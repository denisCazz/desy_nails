import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MIN_FILL_MS = 4_000;
const MAX_FORM_AGE_MS = 3 * 60 * 60 * 1000;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET non configurato");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Token emesso al render del form: prova che il form è stato caricato dal sito e da quanto. */
export function issueFormToken(now = Date.now()) {
  const payload = `${now}.${randomBytes(8).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyFormToken(token: string, now = Date.now()) {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false as const, reason: "token" };
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(parts[2]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false as const, reason: "token" };
  }
  const issuedAt = Number(parts[0]);
  const age = now - issuedAt;
  if (!Number.isFinite(issuedAt) || age < MIN_FILL_MS) {
    return { ok: false as const, reason: "too-fast" };
  }
  if (age > MAX_FORM_AGE_MS) return { ok: false as const, reason: "expired" };
  return { ok: true as const };
}

export function getClientIp(request: Request) {
  const headers = request.headers;
  const direct = headers.get("cf-connecting-ip") ?? headers.get("x-real-ip");
  if (direct) return direct.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    // L'ultimo hop è quello aggiunto dal proxy di Coolify, gli altri sono falsificabili.
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}

export function hashIp(ip: string) {
  return createHash("sha256").update(`${secret()}:${ip}`).digest("hex");
}

const buckets = new Map<string, number[]>();

/** Rate limit in memoria (singola istanza): `limit` richieste ogni `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5_000) {
    for (const [bucketKey, times] of buckets) {
      if (times.every((time) => now - time >= windowMs)) buckets.delete(bucketKey);
    }
  }
  return true;
}

const LINK_PATTERN = /(https?:\/\/|www\.|<\s*\/?\s*[a-z]|\[url|\.(ru|cn|xyz|top|click)\b)/i;

export function containsLinks(...values: string[]) {
  return values.some((value) => LINK_PATTERN.test(value));
}

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
]);

export function isDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}

export function turnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY?.trim() ?? "";
}

function allowedHostnames() {
  const configured = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (configured.length > 0) return new Set(configured);
  const appHost = new URL(process.env.APP_URL || "https://desynails.it").hostname;
  return new Set([appHost, `www.${appHost.replace(/^www\./, "")}`, "localhost"]);
}

const TOKEN_TTL_MS = 5 * 60 * 1000;
const usedTokens = new Map<string, number>();

/** Siteverify non rifiuta sempre un token riusato: i replay vengono bloccati qui. */
function claimToken(token: string, now = Date.now()) {
  for (const [used, expiresAt] of usedTokens) {
    if (expiresAt <= now) usedTokens.delete(used);
  }
  if (usedTokens.has(token)) return false;
  usedTokens.set(token, now + TOKEN_TTL_MS);
  return true;
}

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  metadata?: { result_with_testing_key?: boolean };
};

export async function verifyTurnstile(token: string, ip: string, expectedAction: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secretKey) {
    console.warn("[anti-spam] TURNSTILE_SECRET_KEY assente: verifica captcha saltata");
    return { ok: true, skipped: true };
  }
  if (!token || token.length > 2048) return { ok: false, skipped: false };
  if (!claimToken(token)) {
    console.warn("[anti-spam] token Turnstile riusato", { ip });
    return { ok: false, skipped: false };
  }

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    const data = (await res.json()) as SiteverifyResult;
    if (!data.success) {
      console.warn("[anti-spam] Turnstile rifiutato", data["error-codes"]);
      return { ok: false, skipped: false };
    }
    if (data.metadata?.result_with_testing_key) return { ok: true, skipped: false };
    if (data.action !== expectedAction || !allowedHostnames().has(data.hostname ?? "")) {
      console.warn("[anti-spam] token Turnstile non corrispondente", {
        action: data.action,
        hostname: data.hostname,
      });
      return { ok: false, skipped: false };
    }
    return { ok: true, skipped: false };
  } catch (error) {
    console.error("[anti-spam] Turnstile non raggiungibile", error);
    return { ok: false, skipped: false };
  }
}
