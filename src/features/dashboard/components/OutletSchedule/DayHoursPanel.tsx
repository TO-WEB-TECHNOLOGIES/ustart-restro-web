import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/utils/error";
import type { RestroDay } from "@/types/restaurantTypes";
import { DayScheduleEditor } from "@/features/onboarding/components/common/DayScheduleEditor";
import { validateScheduleDay } from "@/features/onboarding/utils/scheduleValidation";
import { useSaveScheduleDay } from "../../hooks/useOutletStatus";
import { HolidayForm } from "./HolidayForm";
import { formatSlotTime, toInputValue } from "./outletTime";
import { WEEKDAY_KEYS, nextDateOf } from "./weekdays";

/**
 * 2026-11-12: the selected weekday's hours, an Edit mode (user decision: hours are editable here),
 * and the "Add a Holiday" switch that opens the holiday form in the same card.
 * Edit reuses the onboarding DayScheduleEditor with just this day and saves only this day
 * (PATCH /schedules), which changes it for every week. Locked while isSetupLocked (the API would
 * answer 403). The parent keys this panel by weekday, so switching days drops an open edit/form.
 */
interface DayHoursPanelProps {
  restroId: string;
  dayOfWeek: number;
  day: RestroDay | null;
  hasSchedule: boolean;
  isSetupLocked: boolean;
}

export const DayHoursPanel = ({ restroId, dayOfWeek, day, hasSchedule, isSetupLocked }: DayHoursPanelProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletSchedule.hours.";
  const saveDay = useSaveScheduleDay();
  const [draft, setDraft] = useState<RestroDay | null>(null);
  const [holidayOpen, setHolidayOpen] = useState(false);
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

  // Holiday defaults: this weekday's next date, from its opening (or now, if that's passed) to its
  // closing; a closed day defaults to the whole day.
  const holidayDefaults = () => {
    const date = nextDateOf(dayOfWeek);
    const at = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      const d = new Date(date);
      d.setHours(h, m, 0, 0);
      return d;
    };
    let start = open ? at(day!.schedules[0].startTime) : new Date(date);
    let end = open ? at(day!.schedules[day!.schedules.length - 1].endTime) : at("23:59");
    const now = new Date();
    if (start < now) start = now;
    if (end.getTime() - start.getTime() < 2 * 60 * 60 * 1000) end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return { startsAt: toInputValue(start), endsAt: toInputValue(end) };
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
          <DayScheduleEditor days={[draft]} onChange={(days) => setDraft(days[0])} />
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

      {/* Add a Holiday: the switch opens the form in this same card. */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className="block text-sm font-bold text-[#1a2b4b] dark:text-white">{t("dashboard.outletSchedule.holiday.add")}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{t("dashboard.outletSchedule.holiday.addHint")}</span>
          </span>
          <Switch
            checked={holidayOpen}
            onCheckedChange={setHolidayOpen}
            aria-label={t("dashboard.outletSchedule.holiday.add")}
            className="scale-75"
          />
        </label>
        {holidayOpen && (
          <HolidayForm
            restroId={restroId}
            defaults={holidayDefaults()}
            onDone={() => setHolidayOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
