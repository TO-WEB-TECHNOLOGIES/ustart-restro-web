import { useState } from "react";
import {
  type RestroDay,
  type TimeSlot,
  type Restaurant,
} from "@/types/restaurantTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { restaurantService } from "@/api/restaurantService";

interface DayScheduleEditorProps {
  days: RestroDay[];
  onChange: (days: RestroDay[]) => void;
  // Optional - omitted during onboarding, where no restaurant exists yet to copy a schedule
  // from or fetch one via restaurantService. When absent, the "copy from" bar is hidden and
  // only the day-list/time-slot editing UI (the reusable part) renders.
  restaurants?: Restaurant[];
  restroId?: string;
  // "list" (default) is step 5's original always-visible-rows layout, unchanged. "cards" is a
  // compact flex row of day pills (same visual language as FoodTypeButton) - selecting a day
  // pill opens/closes it and reveals its time-slot row underneath the pill row, one row per
  // currently-open day. Used by onboarding's Restaurant/Dining Timings sections.
  layout?: "list" | "cards";
}

const DAYS_OF_WEEK = [
  "onboarding.restaurant.complete.schedule.days.sunday",
  "onboarding.restaurant.complete.schedule.days.monday",
  "onboarding.restaurant.complete.schedule.days.tuesday",
  "onboarding.restaurant.complete.schedule.days.wednesday",
  "onboarding.restaurant.complete.schedule.days.thursday",
  "onboarding.restaurant.complete.schedule.days.friday",
  "onboarding.restaurant.complete.schedule.days.saturday",
];

const DEFAULT_TIME: TimeSlot = { startTime: "09:00:00", endTime: "22:00:00" };
const MINUTE_OPTIONS = [0, 15, 30, 45];
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12

const ensureTimeFormat = (time: string) => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length === 2) return `${time}:00`;
  return time;
};

// "HH:mm[:ss]" (24h) -> {hour: 1-12, minute, period}, for the 12-hour dropdown picker below.
const to12Hour = (time24?: string) => {
  if (!time24) return { hour: 9, minute: 0, period: "AM" as const };
  const [h, m] = time24.split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: m, period };
};

const from12Hour = (hour12: number, minute: number, period: "AM" | "PM") => {
  let hour = hour12 % 12;
  if (period === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
};

// Dropdown-based (not a native <input type="time">) so hours render as a fixed 12h/AM-PM
// format regardless of the browser/OS locale, and minutes are constrained to quarter-hour
// marks only (0/15/30/45) - a native time input can't guarantee either of these.
const TimePicker = ({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (value: string) => void;
  label: string;
}) => {
  const { hour, minute, period } = to12Hour(value);
  return (
    <div className="flex-1 min-w-[168px] relative">
      <div className="flex items-center gap-1 h-9 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md px-2">
        <select
          value={hour}
          onChange={(e) => onChange(from12Hour(Number(e.target.value), minute, period))}
          className="bg-transparent text-sm focus:outline-none dark:text-zinc-100"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-slate-400 dark:text-zinc-500">:</span>
        <select
          value={minute}
          onChange={(e) => onChange(from12Hour(hour, Number(e.target.value), period))}
          className="bg-transparent text-sm focus:outline-none dark:text-zinc-100"
        >
          {MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => onChange(from12Hour(hour, minute, e.target.value as "AM" | "PM"))}
          className="bg-transparent text-sm font-semibold focus:outline-none ml-1 dark:text-zinc-100"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <Label className="absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-900/90 px-1 text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase z-10 transition-colors">
        {label}
      </Label>
    </div>
  );
};

export const DayScheduleEditor = ({
  days,
  onChange,
  restaurants,
  restroId,
  layout = "list",
}: DayScheduleEditorProps) => {
  const { t } = useTranslation();
  const [copyFromId, setCopyFromId] = useState<string>("");

  const handleCopySchedule = async (sourceRestroId: string) => {
    if (!sourceRestroId) return;
    try {
      const res = await restaurantService.getSchedule(sourceRestroId);
      if (res.data?.days) {
        onChange(res.data.days);
        toast.success(t("common.success", "Schedule copied successfully"));
      } else {
        toast.error(t("common.error.generic", "No schedule found to copy"));
      }
    } catch (err) {
      console.error(err);
      toast.error(
        t("common.error.generic", "Failed to fetch schedule for copying"),
      );
    }
  };

  const updateDay = (
    dayIndex: number,
    updater: (day: RestroDay) => RestroDay,
  ) => {
    setCopyFromId("");
    const newDays = [...days];
    newDays[dayIndex] = updater(newDays[dayIndex]);
    onChange(newDays);
  };

  const toggleDayStatus = (dayIndex: number) => {
    updateDay(dayIndex, (day) => {
      const willBeClosed = !day.isClosed;
      return {
        ...day,
        isClosed: willBeClosed,
        schedules: willBeClosed
          ? []
          : day.schedules?.length
            ? day.schedules
            : [{ ...DEFAULT_TIME }],
      };
    });
  };

  const updateScheduleTime = (
    dayIndex: number,
    scheduleIndex: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    updateDay(dayIndex, (day) => {
      const newSchedules = [...(day.schedules || [])];
      newSchedules[scheduleIndex] = {
        ...newSchedules[scheduleIndex],
        [field]: ensureTimeFormat(value),
      };
      return { ...day, schedules: newSchedules };
    });
  };

  const addTimeSlot = (dayIndex: number) => {
    updateDay(dayIndex, (day) => ({
      ...day,
      schedules: [...(day.schedules || []), { ...DEFAULT_TIME }],
    }));
  };

  const removeTimeSlot = (dayIndex: number, scheduleIndex: number) => {
    updateDay(dayIndex, (day) => ({
      ...day,
      schedules: (day.schedules || []).filter((_, i) => i !== scheduleIndex),
    }));
  };

  const dayLabel = (dayOfWeek: number) =>
    t(DAYS_OF_WEEK[dayOfWeek], DAYS_OF_WEEK[dayOfWeek].split(".").pop() || "");

  // Shared between both layouts - the actual start/end time inputs for one day, identical
  // regardless of whether the day itself is presented as a list row or a pill+below-row.
  const renderSlots = (day: RestroDay, idx: number) => (
    <div className="flex flex-col gap-3">
      {(day.schedules || []).map((slot, slotIdx) => (
        <div
          key={slotIdx}
          className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-lg border border-slate-100 dark:border-zinc-800/80"
        >
          <TimePicker
            value={slot.startTime}
            onChange={(v) => updateScheduleTime(idx, slotIdx, "startTime", v)}
            label={t("onboarding.restaurant.complete.schedule.openTime", "Open")}
          />
          <span className="text-slate-400 dark:text-zinc-500">-</span>
          <TimePicker
            value={slot.endTime}
            onChange={(v) => updateScheduleTime(idx, slotIdx, "endTime", v)}
            label={t("onboarding.restaurant.complete.schedule.closeTime", "Close")}
          />
          {(day.schedules || []).length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => removeTimeSlot(idx, slotIdx)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-secondary-orange hover:text-secondary-orange hover:bg-orange-50/50 dark:hover:bg-orange-900/20 h-8 text-xs font-medium"
        onClick={() => addTimeSlot(idx)}
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        {t("onboarding.restaurant.complete.schedule.addTimeSlot", "Add time slot")}
      </Button>
    </div>
  );

  const copyFromBar = restroId && restaurants && restaurants.length > 1 && (
    <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
        <Copy className="w-4 h-4 shrink-0" />
        <Label className="font-semibold whitespace-nowrap text-sm">
          {t("onboarding.restaurant.complete.schedule.copyFrom", "Copy schedule from")}
        </Label>
      </div>
      <select
        className="flex-1 w-full h-9 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-orange/20 dark:text-zinc-100 truncate"
        value={copyFromId}
        onChange={(e) => {
          setCopyFromId(e.target.value);
          if (e.target.value) handleCopySchedule(e.target.value);
        }}
      >
        <option value="">
          {t("onboarding.restaurant.complete.schedule.copySelectPlaceholder", "Select restaurant...")}
        </option>
        {restaurants
          .filter((r) => r.restroId !== restroId)
          .map((r) => (
            <option key={r.restroId} value={r.restroId}>
              {r.restroName} {r.address && `- ${r.address}`}
            </option>
          ))}
      </select>
    </div>
  );

  if (layout === "cards") {
    const openDays = days.filter((d) => !d.isClosed);
    return (
      <div className="flex flex-col gap-4">
        {copyFromBar}

        <div className="flex flex-wrap gap-2">
          {days.map((day, idx) => (
            <button
              key={day.dayOfWeek}
              type="button"
              onClick={() => toggleDayStatus(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-medium text-sm transition-all ${
                !day.isClosed
                  ? "bg-orange-50 border-secondary-orange text-slate-900"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {/* Explicit checkbox indicator - the border/bg highlight alone wasn't a clear
                  enough "this day is open" signal. */}
              <span
                className={`flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 ${
                  !day.isClosed
                    ? "bg-secondary-orange border-secondary-orange"
                    : "border-slate-300 bg-white"
                }`}
              >
                {!day.isClosed && <Check className="w-3 h-3 text-white" />}
              </span>
              {dayLabel(day.dayOfWeek).slice(0, 3)}
            </button>
          ))}
        </div>

        {openDays.length > 0 && (
          <div className="flex flex-col gap-4">
            {days.map((day, idx) =>
              !day.isClosed && (
                <div key={day.dayOfWeek} className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {dayLabel(day.dayOfWeek)}
                  </Label>
                  {renderSlots(day, idx)}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {copyFromBar}

      <div className="flex flex-col gap-3">
        {days.map((day, idx) => (
          <div
            key={day.dayOfWeek}
            className={`flex flex-col p-4 rounded-xl transition-all duration-200 border ${day.isClosed ? "bg-slate-50 dark:bg-zinc-900/40 border-slate-100 dark:border-zinc-800/50" : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-sm"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!day.isClosed}
                  onCheckedChange={() => toggleDayStatus(idx)}
                />
                <Label
                  className={`font-semibold cursor-pointer select-none text-sm ${day.isClosed ? "text-slate-400 dark:text-zinc-500" : "text-slate-800 dark:text-zinc-100"}`}
                  onClick={() => toggleDayStatus(idx)}
                >
                  {dayLabel(day.dayOfWeek)?.toUpperCase()}
                </Label>
              </div>
              {day.isClosed && (
                <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                  {t("common.closed", "CLOSED")}
                </span>
              )}
            </div>

            {!day.isClosed && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                {renderSlots(day, idx)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
