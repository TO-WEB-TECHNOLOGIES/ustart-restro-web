import { useState } from "react";
import {
  type RestroDay,
  type TimeSlot,
  type Restaurant,
} from "@/types/restaurantTypes";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { restaurantService } from "@/api/restaurantService";

interface DayScheduleEditorProps {
  days: RestroDay[];
  onChange: (days: RestroDay[]) => void;
  restaurants: Restaurant[];
  restroId: string;
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

const ensureTimeFormat = (time: string) => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length === 2) return `${time}:00`;
  return time;
};

const toInputFormat = (time?: string) => {
  if (!time) return "";
  return time.substring(0, 5);
};

export const DayScheduleEditor = ({
  days,
  onChange,
  restaurants,
  restroId,
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

  return (
    <div className="flex flex-col gap-6">
      {restaurants.length > 1 && (
        <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
            <Copy className="w-4 h-4 shrink-0" />
            <Label className="font-semibold whitespace-nowrap text-sm">
              {t(
                "onboarding.restaurant.complete.schedule.copyFrom",
                "Copy schedule from",
              )}
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
              {t(
                "onboarding.restaurant.complete.schedule.copySelectPlaceholder",
                "Select restaurant...",
              )}
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
      )}

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
                  {t(
                    DAYS_OF_WEEK[day.dayOfWeek],
                    DAYS_OF_WEEK[day.dayOfWeek].split(".").pop() || "",
                  )?.toUpperCase()}
                </Label>
              </div>
              {day.isClosed && (
                <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                  {t("common.closed", "CLOSED")}
                </span>
              )}
            </div>

            {!day.isClosed && (
              <div className="flex flex-col gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                {(day.schedules || []).map((slot, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-lg border border-slate-100 dark:border-zinc-800/80"
                  >
                    <div className="flex-1 min-w-[120px] relative">
                      <Input
                        type="time"
                        value={toInputFormat(slot.startTime)}
                        onChange={(e) =>
                          updateScheduleTime(
                            idx,
                            slotIdx,
                            "startTime",
                            e.target.value,
                          )
                        }
                        className="h-9 bg-white dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 text-sm"
                        required
                      />
                      <Label className="absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-900/90 px-1 text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase z-10 transition-colors">
                        {t(
                          "onboarding.restaurant.complete.schedule.openTime",
                          "Open",
                        )}
                      </Label>
                    </div>
                    <span className="text-slate-400 dark:text-zinc-500">-</span>
                    <div className="flex-1 min-w-[120px] relative">
                      <Input
                        type="time"
                        value={toInputFormat(slot.endTime)}
                        onChange={(e) =>
                          updateScheduleTime(
                            idx,
                            slotIdx,
                            "endTime",
                            e.target.value,
                          )
                        }
                        className="h-9 bg-white dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 text-sm"
                        required
                      />
                      <Label className="absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-900/90 px-1 text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase z-10 transition-colors">
                        {t(
                          "onboarding.restaurant.complete.schedule.closeTime",
                          "Close",
                        )}
                      </Label>
                    </div>
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
                  className="self-start text-secondary-orange hover:text-secondary-orange hover:bg-orange-50/50 dark:hover:bg-orange-900/20 mt-1 h-8 text-xs font-medium"
                  onClick={() => addTimeSlot(idx)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t(
                    "onboarding.restaurant.complete.schedule.addTimeSlot",
                    "Add time slot",
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
