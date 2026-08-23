const SHAPES: Record<string, string> = {
  almond:
    "M18 4 C26 4 32 16 32 36 C32 52 26 68 18 76 C10 68 4 52 4 36 C4 16 10 4 18 4 Z",
  coffin:
    "M10 8 L26 8 L32 22 L28 76 L8 76 L4 22 Z",
  square:
    "M8 8 L28 8 L30 76 L6 76 Z",
  stiletto:
    "M18 2 C24 8 30 22 31 48 C28 64 22 74 18 78 C14 74 8 64 5 48 C6 22 12 8 18 2 Z",
};

export function NailSetPreview({
  colors,
  shape = "almond",
}: {
  colors: string[];
  shape?: string;
}) {
  const path = SHAPES[shape] ?? SHAPES.almond;
  const nails = colors.slice(0, 5);
  while (nails.length < 5) nails.push(nails[nails.length - 1] ?? "#f3d4d4");

  return (
    <div className="flex h-44 items-end justify-center gap-2 bg-linear-to-b from-blush/50 to-paper px-4 py-6 dark:from-blush/20">
      {nails.map((color, index) => (
        <svg
          key={`${color}-${index}`}
          viewBox="0 0 36 80"
          className="h-28 w-8 drop-shadow-sm"
          style={{ transform: `rotate(${(index - 2) * 6}deg) translateY(${Math.abs(index - 2) * 4}px)` }}
          aria-hidden
        >
          <path d={path} fill={color} stroke="rgba(196,163,90,0.45)" strokeWidth="1.2" />
        </svg>
      ))}
    </div>
  );
}

export function parseColors(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}
