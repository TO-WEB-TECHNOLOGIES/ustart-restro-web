import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RestroDay } from "@/types/restaurantTypes";
import { formatSlotTime } from "./outletTime";
import { WEEKDAY_KEYS, WEEK_ORDER } from "./weekdays";

/**
 * 2026-11-12: the 7 weekdays as a horizontally scrolling row of cards in a fixed Sunday → Saturday
 * order (user request: hours repeat per weekday, so the row shouldn't shift with today). Today
 * keeps its "Today" tag. Each shows Open/Closed and its first slot (+n more).
 * 2026-11-12 (user request): the scrollbar isn't always visible (overlay scrollbars on macOS,
 * touch devices), so there are permanent arrow buttons on both ends. Each is enabled only when
 * there are more cards that way, and scrolls by most of the visible width. The selected card is
 * scrolled into view on first render, so Saturday isn't hidden when today is Saturday.
 */
interface WeekdayCardsProps {
  days: RestroDay[] | null;
  selected: number;
  onSelect: (dayOfWeek: number) => void;
}

export const WeekdayCards = ({ days, selected, onSelect }: WeekdayCardsProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletSchedule.hours.";
  const todayDow = new Date().getDay();
  const scroller = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });

  // 1px tolerance: scrollLeft can be fractional at some zoom levels.
  const updateArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanScroll({
      prev: el.scrollLeft > 1,
      next: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  // Recheck when the row resizes (window, sidebar collapse); bring the selected card into view
  // once. "nearest" keeps the page itself from jumping vertically.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // No direct updateArrows() here: ResizeObserver calls it once on observe() (the initial
    // state) and on every resize after, which also avoids a synchronous setState in the effect.
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateArrows]); // updateArrows is stable, so this runs once (on mount)

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrowClass = "shrink-0 self-center size-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#1a2b4b] dark:text-white flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-opacity";

  return (
    <div className="flex items-stretch gap-2">
      <button type="button" onClick={() => scrollBy(-1)} disabled={!canScroll.prev} aria-label={t(`${k}scrollPrev`)} className={arrowClass}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div ref={scroller} onScroll={updateArrows} className="flex-1 min-w-0 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1" role="tablist" aria-label={t(`${k}weekdays`)}>
        {WEEK_ORDER.map((dow) => {
          const day = days?.find((d) => d.dayOfWeek === dow);
          const open = !!day && !day.isClosed && (day.schedules?.length ?? 0) > 0;
          const first = open ? day!.schedules[0] : null;
          const isSelected = dow === selected;
          return (
            <button
              key={dow}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(dow)}
              className={`snap-start shrink-0 w-36 text-left rounded-2xl border p-4 transition-all ${isSelected
                ? "border-secondary-orange bg-orange-50/60 dark:bg-orange-500/10 shadow-sm"
                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#1a2b4b] dark:text-white truncate">{t(WEEKDAY_KEYS[dow])}</span>
                {dow === todayDow && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-secondary-orange">{t(`${k}today`)}</span>
                )}
              </div>
              <p className={`mt-2 text-xs font-bold ${open ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                {open ? t(`${k}open`) : t(`${k}closed`)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {first
                  ? `${formatSlotTime(first.startTime, i18n.language)} – ${formatSlotTime(first.endTime, i18n.language)}`
                  : "—"}
                {open && day!.schedules.length > 1 && ` +${day!.schedules.length - 1}`}
              </p>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => scrollBy(1)} disabled={!canScroll.next} aria-label={t(`${k}scrollNext`)} className={arrowClass}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
