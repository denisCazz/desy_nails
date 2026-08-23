export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-gold/80" />
      <svg viewBox="0 0 12 12" className="size-3 fill-gold">
        <path d="M6 10.8C2.4 8.4 0.6 6.2 0.6 4.1 0.6 2.5 1.8 1.3 3.4 1.3c.9 0 1.8.5 2.6 1.4.8-.9 1.7-1.4 2.6-1.4 1.6 0 2.8 1.2 2.8 2.8 0 2.1-1.8 4.3-5.4 6.7Z" />
      </svg>
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-gold/80" />
    </div>
  );
}
