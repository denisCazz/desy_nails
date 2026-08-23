export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="font-serif text-2xl tracking-[0.12em] text-mauve">
        <span className="relative inline-block">
          D
          <span className="-ml-2 text-gold">T</span>
        </span>
      </span>
      <span className="mt-1 text-xs font-medium tracking-[0.38em] text-muted uppercase">
        Desy Nails
      </span>
    </span>
  );
}
