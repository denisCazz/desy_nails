"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const WEEKDAYS = ["L", "M", "M", "G", "V", "S", "D"];

type Month = { year: number; month: number };

function parseDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month: month - 1, day };
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthIndex({ year, month }: Month) {
  return year * 12 + month;
}

function fromIndex(index: number): Month {
  return { year: Math.floor(index / 12), month: index % 12 };
}

export function formatLongDate(dateStr: string) {
  const { year, month, day } = parseDate(dateStr);
  return new Date(Date.UTC(year, month, day, 12)).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function DatePicker({
  today,
  availableDates,
  value,
  onChange,
  disabled = false,
}: {
  today: string;
  /** Date (YYYY-MM-DD) con almeno un orario libero, in ordine crescente. */
  availableDates: string[];
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}) {
  const available = new Set(availableDates);
  const minMonth = monthIndex(parseDate(today));
  const lastAvailable = availableDates[availableDates.length - 1];
  const maxMonth = Math.max(minMonth, lastAvailable ? monthIndex(parseDate(lastAvailable)) : minMonth);
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  const initial = value || availableDates[0] || today;
  const current = Math.min(maxMonth, Math.max(minMonth, viewIndex ?? monthIndex(parseDate(initial))));
  const { year, month } = fromIndex(current);

  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const monthLabel = new Date(Date.UTC(year, month, 15)).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const freeInMonth = availableDates.filter((date) => date.startsWith(toDateStr(year, month, 1).slice(0, 7))).length;

  return (
    <div className={`mx-auto w-full max-w-sm ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setViewIndex(current - 1)}
          disabled={current <= minMonth}
          aria-label="Mese precedente"
          className="grid size-10 place-items-center rounded-full border border-line transition hover:border-gold disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="font-serif text-lg capitalize text-mauve" aria-live="polite">
            {monthLabel}
          </p>
          <p className="text-xs text-muted">
            {freeInMonth === 0
              ? "Nessun giorno libero"
              : freeInMonth === 1
                ? "1 giorno libero"
                : `${freeInMonth} giorni liberi`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setViewIndex(current + 1)}
          disabled={current >= maxMonth}
          aria-label="Mese successivo"
          className="grid size-10 place-items-center rounded-full border border-line transition hover:border-gold disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted" aria-hidden="true">
        {WEEKDAYS.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <div role="grid" aria-label={`Giorni di ${monthLabel}`} className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day == null) return <span key={`empty-${index}`} />;
          const dateStr = toDateStr(year, month, day);
          const isAvailable = available.has(dateStr);
          const isSelected = value === dateStr;
          const isToday = today === dateStr;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isAvailable}
              onClick={() => onChange(dateStr)}
              aria-pressed={isSelected}
              aria-label={`${formatLongDate(dateStr)}${isAvailable ? "" : ", non disponibile"}`}
              className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-sm transition ${
                isSelected
                  ? "bg-gold font-semibold text-[#3a2c2e] shadow-sm"
                  : isAvailable
                    ? "bg-blush/35 font-medium text-ink hover:bg-blush/70 dark:bg-blush/20"
                    : "text-muted/45"
              } ${isToday && !isSelected ? "ring-1 ring-gold" : ""}`}
            >
              {day}
              {isAvailable && !isSelected ? (
                <span className="absolute bottom-1.5 size-1 rounded-full bg-gold" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
