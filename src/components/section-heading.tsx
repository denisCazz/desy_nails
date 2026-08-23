export function SectionHeading({
  script,
  title,
  subtitle,
}: {
  script?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {script ? (
        <p className="font-script text-3xl text-gold md:text-4xl">{script}</p>
      ) : null}
      <h2 className="mt-1 font-serif text-4xl text-mauve md:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-lg text-muted leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}
