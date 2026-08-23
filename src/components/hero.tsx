import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt="Desiree Tropini, nail artist, con smalti in primo piano"
        fill
        preload
        quality={100}
        sizes="100vw"
        className="object-cover object-[0%_42%] md:object-[78%_center]"
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/30 to-transparent" />
      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl items-center px-4 py-16">
        <div className="max-w-xl text-white">
          <p className="font-script text-3xl text-gold-soft md:text-4xl">Sono</p>
          <h1 className="mt-1 font-serif text-5xl leading-tight md:text-6xl">
            Desiree Tropini
          </h1>
          <p className="mt-2 font-script text-3xl text-gold-soft md:text-4xl">Nail Artist</p>
          <div className="my-6 h-px w-28 bg-gold-soft/80" />
          <p className="max-w-lg text-lg leading-relaxed text-white/95 md:text-xl">
            Aiuto ogni cliente a sentirsi curata e sicura di sé attraverso un lavoro{" "}
            <em className="font-serif text-gold-soft not-italic">
              preciso, elegante e personalizzato
            </em>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/prenota"
              className="rounded-full bg-gold px-6 py-3 text-base font-semibold text-[#3a2c2e] shadow-sm transition hover:bg-gold-soft"
            >
              Prenota il tuo momento
            </Link>
            <Link
              href="/chi-sono"
              className="rounded-full border border-white/80 bg-white/15 px-6 py-3 text-base font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Scopri chi sono
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
