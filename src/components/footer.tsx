import Link from "next/link";
import { GoldDivider } from "./gold-divider";
import { Logo } from "./logo";
import { CREATOR_NAME, CREATOR_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand";
import { getSetting } from "@/lib/settings";

export async function Footer() {
  const handle = ((await getSetting("instagram", INSTAGRAM_HANDLE)) || INSTAGRAM_HANDLE).replace(
    /^@/,
    "",
  );
  const href = `https://www.instagram.com/${handle}/`;

  return (
    <footer className="mt-auto border-t border-line bg-surface print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <GoldDivider className="my-6 w-48" />
          <p className="font-script text-2xl text-gold">ogni dettaglio, la mia passione</p>
          <p className="mt-3 text-sm text-muted">Desiree Tropini Studio · Nail Artist</p>
          <a
            href={href || INSTAGRAM_URL}
            className="mt-2 text-sm tracking-wide text-mauve hover:text-gold"
            target="_blank"
            rel="noreferrer"
          >
            @{handle}
          </a>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs tracking-[0.18em] uppercase text-muted">
            <Link href="/chi-sono">Chi sono</Link>
            <Link href="/servizi">Servizi</Link>
            <Link href="/prenota">Prenota</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/regolamento">Regolamento</Link>
            <Link href="/admin">Admin</Link>
          </div>
          <p className="mt-8 inline-flex items-center gap-1 text-xs text-muted/80">
            sito creato con
            <svg viewBox="0 0 12 12" className="size-3.5 fill-[#e11d48]" aria-hidden>
              <path d="M6 10.8C2.4 8.4 0.6 6.2 0.6 4.1 0.6 2.5 1.8 1.3 3.4 1.3c.9 0 1.8.5 2.6 1.4.8-.9 1.7-1.4 2.6-1.4 1.6 0 2.8 1.2 2.8 2.8 0 2.1-1.8 4.3-5.4 6.7Z" />
            </svg>
            <span className="sr-only">amore</span>
            da{" "}
            <a
              href={CREATOR_URL}
              className="text-muted hover:text-gold"
              target="_blank"
              rel="noreferrer"
            >
              {CREATOR_NAME}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
