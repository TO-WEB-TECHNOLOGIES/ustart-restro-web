import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/utils/error";
import { useAddHoliday } from "../../hooks/useOutletStatus";
import { createHolidaySchema, yearEndInputValue } from "./holidayRules";
import { toInputValue } from "./outletTime";

/**
 * 2026-11-12: "Add Holiday" inline form, opened by the Holidays tab's button (moved there from the
 * Schedule tab's day panel on user request; holidays are dates, not weekdays). Start and end
 * are date + time (native datetime-local, like the offer pages' date inputs), limited by
 * holidayRules (2 h to 30 days, not past, this year) before the API is called; the inputs'
 * min/max already block dates outside this year.
 */
interface HolidayFormProps {
  restroId: string;
  /** Initial values ("YYYY-MM-DDTHH:mm"); read once, when the form opens. */
  defaults: { startsAt: string; endsAt: string };
  onDone: () => void;
  onCancel: () => void;
}

type Field = "startsAt" | "endsAt" | "reason";

export const HolidayForm = ({ restroId, defaults, onDone, onCancel }: HolidayFormProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletSchedule.holiday.";
  const addHoliday = useAddHoliday();
  const [values, setValues] = useState({ ...defaults, reason: "" });
  const [tried, setTried] = useState(false);
  const schema = useMemo(() => createHolidaySchema(t), [t]);
  const now = new Date();

  // Errors show once the user has tried to save, then update as they type.
  const errors = useMemo(() => {
    if (!tried) return {} as Partial<Record<Field, string>>;
    const result = schema.safeParse(values);
    const map: Partial<Record<Field, string>> = {};
    if (!result.success) result.error.issues.forEach((issue) => { map[issue.path[0] as Field] ??= issue.message; });
    return map;
  }, [schema, values, tried]);

  const set = (field: Field, value: string) => setValues((v) => ({ ...v, [field]: value }));

  const save = async () => {
    setTried(true);
    if (!schema.safeParse(values).success) return;
    try {
      await addHoliday.mutateAsync({
        restroId,
        request: { startsAt: values.startsAt, endsAt: values.endsAt, reason: values.reason.trim() || undefined },
      });
      toast.success(t(`${k}added`));
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  const inputClass = "h-11 rounded-xl text-sm font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-white";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["startsAt", "endsAt"] as const).map((field) => (
          <div key={field} className="space-y-1.5">
            <label htmlFor={`holiday-${field}`} className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t(`${k}${field}`)}
            </label>
            <Input
              id={`holiday-${field}`}
              type="datetime-local"
              min={toInputValue(now)}
              max={yearEndInputValue(now)}
              value={values[field]}
              onChange={(e) => set(field, e.target.value)}
              aria-invalid={!!errors[field]}
              className={inputClass}
            />
            {errors[field] && <p className="text-xs font-medium text-red-500">{errors[field]}</p>}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="holiday-reason" className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {t(`${k}reason`)}
        </label>
        <Input
          id="holiday-reason"
          maxLength={200}
          placeholder={t(`${k}reasonPlaceholder`)}
          value={values.reason}
          onChange={(e) => set("reason", e.target.value)}
          className={inputClass}
        />
        {errors.reason && <p className="text-xs font-medium text-red-500">{errors.reason}</p>}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${k}rules`, { year: now.getFullYear() })}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={addHoliday.isPending}
          onClick={onCancel}
          className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {t(`${k}cancel`)}
        </button>
        <button
          type="button"
          disabled={addHoliday.isPending}
          onClick={save}
          className="h-11 px-6 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-secondary-orange/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
        >
          {addHoliday.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {t(`${k}save`)}
        </button>
      </div>
    </div>
  );
};
