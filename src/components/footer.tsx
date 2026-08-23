import Link from "next/link";
import { GoldDivider } from "./gold-divider";
import { Logo } from "./logo";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/brand";
import { getSetting } from "@/lib/settings";

export async function Footer() {
  const handle = ((await getSetting("instagram", INSTAGRAM_HANDLE)) || INSTAGRAM_HANDLE).replace(
    /^@/,
    "",
  );
  const href = `https://www.instagram.com/${handle}/`;

  return (
    <footer className="mt-auto border-t border-line bg-surface">
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
        </div>
      </div>
    </footer>
  );
}
