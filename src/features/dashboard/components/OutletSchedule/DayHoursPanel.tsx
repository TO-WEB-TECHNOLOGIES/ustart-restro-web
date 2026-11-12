import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Loader2, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/utils/error";
import type { RestroDay } from "@/types/restaurantTypes";
import { DayScheduleEditor } from "@/features/onboarding/components/common/DayScheduleEditor";
import { validateScheduleDay } from "@/features/onboarding/utils/scheduleValidation";
import { useSaveScheduleDay } from "../../hooks/useOutletStatus";
import { formatSlotTime } from "./outletTime";
import { WEEKDAY_KEYS, WEEK_ORDER } from "./weekdays";

/**
 * 2026-11-12: the selected weekday's hours and an Edit mode (user decision: hours are editable here).
 * Edit reuses the onboarding DayScheduleEditor with just this day and saves only this day
 * (PATCH /schedules), which changes it for every week. Locked while isSetupLocked (the API would
 * answer 403). The parent keys this panel by weekday, so switching days drops an open edit.
 * 2026-11-12 (user request): holidays moved out of this panel to the Holidays tab's "Add Holiday"
 * button; edit mode gained "Copy from" (another weekday's saved hours into this day's draft, so the
 * same hours aren't re-entered day by day). Nothing is saved until "Save hours".
 */
interface DayHoursPanelProps {
  restroId: string;
  dayOfWeek: number;
  day: RestroDay | null;
  /** All 7 saved days, the source for "Copy from". */
  days: RestroDay[];
  hasSchedule: boolean;
  isSetupLocked: boolean;
}

export const DayHoursPanel = ({ restroId, dayOfWeek, day, days, hasSchedule, isSetupLocked }: DayHoursPanelProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletSchedule.hours.";
  const saveDay = useSaveScheduleDay();
  const [draft, setDraft] = useState<RestroDay | null>(null);
  const open = !!day && !day.isClosed && (day.schedules?.length ?? 0) > 0;

  const save = async () => {
    if (!draft) return;
    const error = validateScheduleDay(draft);
    if (error) {
      toast.error(t(`${k}errors.${error}`));
      return;
    }
    try {
      await saveDay.mutateAsync({ restroId, day: draft });
      toast.success(t(`${k}saved`, { day: t(WEEKDAY_KEYS[dayOfWeek]) }));
      setDraft(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t(`${k}saveFailed`)));
    }
  };

  // Copy another weekday's saved hours into the draft. Slots are cloned so editing the draft
  // never mutates the cached schedule objects.
  const copyFrom = (sourceDow: number) => {
    const source = days.find((d) => d.dayOfWeek === sourceDow);
    if (!source || !draft) return;
    setDraft({
      ...draft,
      isClosed: source.isClosed,
      schedules: (source.schedules ?? []).map((slot) => ({ ...slot })),
    });
    toast.success(t(`${k}copied`, { day: t(WEEKDAY_KEYS[sourceDow]) }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#1a2b4b] dark:text-white">{t(WEEKDAY_KEYS[dayOfWeek])}</h3>
        {hasSchedule && !draft && (
          isSetupLocked ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500" title={t(`${k}locked`)}>
              <Lock className="w-3.5 h-3.5" />
              {t(`${k}lockedShort`)}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setDraft(day ?? { dayOfWeek, isClosed: true, schedules: [] })}
              className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t(`${k}edit`)}
            </button>
          )
        )}
      </div>

      {!hasSchedule ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}noSchedule`)}</p>
      ) : draft ? (
        <div className="space-y-4">
          {/* Copy from: shadcn Select (added 2026-11-12; replaces the native <select>). Kept at
              value "" so it acts like a picker: choosing a day copies it and the placeholder
              comes back, ready to pick again. */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label htmlFor="copy-from-day" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              <Copy className="w-4 h-4 shrink-0" />
              {t(`${k}copyFrom`)}
            </label>
            <Select value="" disabled={saveDay.isPending} onValueChange={(value) => copyFrom(Number(value))}>
              <SelectTrigger id="copy-from-day" className="w-full sm:w-72 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-[#1a2b4b] dark:text-slate-100">
                <SelectValue placeholder={t(`${k}copyPlaceholder`)} />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                {WEEK_ORDER.filter((dow) => dow !== dayOfWeek).map((dow) => {
                  const source = days.find((d) => d.dayOfWeek === dow);
                  const isOpen = !!source && !source.isClosed && (source.schedules?.length ?? 0) > 0;
                  return (
                    <SelectItem key={dow} value={String(dow)} className="text-[#1a2b4b] dark:text-slate-100">
                      <span className="font-semibold">{t(WEEKDAY_KEYS[dow])}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isOpen
                          ? source!.schedules.map((s) => `${formatSlotTime(s.startTime, i18n.language)}–${formatSlotTime(s.endTime, i18n.language)}`).join(", ")
                          : t(`${k}closed`)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DayScheduleEditor days={[draft]} onChange={(next) => setDraft(next[0])} />
          <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${k}everyWeek`, { day: t(WEEKDAY_KEYS[dayOfWeek]) })}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={saveDay.isPending}
              onClick={() => setDraft(null)}
              className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {t(`${k}cancel`)}
            </button>
            <button
              type="button"
              disabled={saveDay.isPending}
              onClick={save}
              className="h-10 px-5 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {saveDay.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t(`${k}save`)}
            </button>
          </div>
        </div>
      ) : open ? (
        <ul className="space-y-2">
          {day!.schedules.map((slot, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{t(`${k}slot`, { n: i + 1 })}</span>
              <span className="text-sm font-bold text-[#1a2b4b] dark:text-white">
                {formatSlotTime(slot.startTime, i18n.language)} – {formatSlotTime(slot.endTime, i18n.language)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t(`${k}closedAllDay`)}</p>
      )}
    </div>
  );
};
