import { useTranslation } from "react-i18next";
import type { RestroDay } from "@/types/restaurantTypes";
import { formatSlotTime } from "./outletTime";
import { WEEKDAY_KEYS, WEEK_ORDER } from "./weekdays";

/**
 * 2026-11-12: the 7 weekdays as a horizontally scrolling row of cards in a fixed Sunday → Saturday
 * order (user request: hours repeat per weekday, so the row shouldn't shift with today). Today
 * keeps its "Today" tag. Each shows Open/Closed and its first slot (+n more).
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

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1" role="tablist" aria-label={t(`${k}weekdays`)}>
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
  );
};
