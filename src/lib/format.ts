export function formatPrice(
  cents: number | null,
  options?: { from?: boolean; note?: string },
) {
  if (options?.note?.toLowerCase() === "inclusa") return "Inclusa";
  if (cents == null) return options?.note || "su richiesta";
  if (cents === 0 && options?.note) return options.note;

  const euro = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

  const prefix = options?.from ? "da " : "";
  const suffix = options?.note ? ` ${options.note}` : "";
  return `${prefix}${euro}${suffix}`.trim();
}

export function slugId() {
  return crypto.randomUUID();
}

export function eurosToCents(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function centsToEuroInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return String(cents / 100);
}

export function parseColorList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((value) => String(value).trim()).filter(Boolean);
  }
  return String(raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
