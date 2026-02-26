import { useState, useEffect } from "react";
import {
  type RestroDay,
  type TimeSlot,
  type Restaurant,
} from "@/types/restaurantTypes";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { restaurantService } from "@/api/restaurantService";
import { DayScheduleEditor } from "./DayScheduleEditor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
  initialSchedules: Record<string, RestroDay[]>;
  onSaveSuccess: (updatedSchedules: Record<string, RestroDay[]>) => void;
}

const ensureTimeFormat = (time: string) => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length === 2) return `${time}:00`;
  return time;
};

const isDayChanged = (currentDay: RestroDay, originalDay?: RestroDay) => {
  if (!originalDay) return true;
  if (currentDay.isClosed !== originalDay.isClosed) return true;
  if (currentDay.isClosed && originalDay.isClosed) return false;

  const currentSchedules = currentDay.schedules || [];
  const originalSchedules = originalDay.schedules || [];

  if (currentSchedules.length !== originalSchedules.length) return true;

  for (let i = 0; i < currentSchedules.length; i++) {
    const cs = currentSchedules[i];
    const os = originalSchedules[i];
    if (
      ensureTimeFormat(cs.startTime) !== ensureTimeFormat(os.startTime) ||
      ensureTimeFormat(cs.endTime) !== ensureTimeFormat(os.endTime)
    ) {
      return true;
    }
  }
  return false;
};

const hasOverlappingTimes = (schedules: TimeSlot[]) => {
  if (!schedules || schedules.length < 2) return false;
  const sorted = [...schedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (ensureTimeFormat(current.endTime) > ensureTimeFormat(next.startTime)) {
      return true;
    }
  }
  return false;
};

export const BulkScheduleModal = ({
  isOpen,
  onClose,
  restaurants,
  initialSchedules,
  onSaveSuccess,
}: BulkScheduleModalProps) => {
  const { t } = useTranslation();
  const [localSchedules, setLocalSchedules] = useState<
    Record<string, RestroDay[]>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [verifiedIds, setVerifiedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Deep copy initial schedules
      const copied: Record<string, RestroDay[]> = {};
      restaurants.forEach((r) => {
        const schedule = initialSchedules[r.restroId] || [];
        // Ensure each restaurant has 7 days array
        const dayMap = new Map(schedule.map((d) => [d.dayOfWeek, d]));
        copied[r.restroId] = Array.from({ length: 7 }, (_, i) => {
          const d = dayMap.get(i);
          return d
            ? { ...d, schedules: [...(d.schedules || [])] }
            : { dayOfWeek: i, isClosed: true, schedules: [] };
        });
      });
      setLocalSchedules(copied);

      // Mark as initially verified if they have valid schedules
      const initialVerified: Record<string, boolean> = {};
      restaurants.forEach((r) => {
        const schedule = copied[r.restroId];
        const hasOpenDay = schedule.some((d) => !d.isClosed);
        if (hasOpenDay) initialVerified[r.restroId] = true;
      });
      setVerifiedIds(initialVerified);
    }
  }, [isOpen, restaurants, initialSchedules]);

  const handleUpdateRestroSchedule = (restroId: string, days: RestroDay[]) => {
    setLocalSchedules((prev) => ({ ...prev, [restroId]: days }));
    // Mark as verified when we update
    setVerifiedIds((prev) => ({ ...prev, [restroId]: true }));
  };

  const validateAll = () => {
    for (const restro of restaurants) {
      const days = localSchedules[restro.restroId];
      if (!days) continue;

      const hasOpenDay = days.some((d) => !d.isClosed);
      if (!hasOpenDay) {
        toast.error(`${restro.brandName}: At least one day must be open`);
        return false;
      }

      const hasInvalidTimes = days.some(
        (d) =>
          !d.isClosed &&
          d.schedules?.some(
            (s) => s.startTime && s.endTime && s.startTime >= s.endTime,
          ),
      );
      if (hasInvalidTimes) {
        toast.error(`${restro.brandName}: Close time must be after Open time`);
        return false;
      }

      const hasOverlaps = days.some(
        (d) => !d.isClosed && hasOverlappingTimes(d.schedules || []),
      );
      if (hasOverlaps) {
        toast.error(`${restro.brandName}: Time slots cannot overlap`);
        return false;
      }
    }
    return true;
  };

  const handleSaveAll = async () => {
    if (!validateAll()) return;

    setIsSaving(true);
    try {
      const updatePromises = restaurants.map(async (restro) => {
        const days = localSchedules[restro.restroId];
        const originalDays = initialSchedules[restro.restroId] || [];

        // If it's a new or modified schedule
        if (originalDays.length > 0) {
          const changedDays = days.filter((day) => {
            const originalDay = originalDays.find(
              (d) => d.dayOfWeek === day.dayOfWeek,
            );
            return isDayChanged(day, originalDay);
          });

          if (changedDays.length > 0) {
            await restaurantService.updateSchedule(restro.restroId, {
              days: changedDays,
            });
          }
        } else {
          await restaurantService.createSchedule({
            restroId: restro.restroId,
            days,
          });
        }
      });

      await Promise.all(updatePromises);
      onSaveSuccess(localSchedules);
      toast.success(t("common.success", "All schedules verified successfully"));
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save some schedules. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const allVerified = restaurants.every((r) => verifiedIds[r.restroId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(
        "onboarding.restaurant.complete.schedule.bulkTitle",
        "Verify Restaurant Hours",
      )}
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {t(
            "onboarding.restaurant.complete.schedule.bulkSubtitle",
            "Please review and verify the operating hours for all your restaurants before proceeding.",
          )}
        </p>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {restaurants.map((restro) => (
            <AccordionItem
              key={restro.restroId}
              value={restro.restroId}
              className={`border rounded-2xl px-4 py-1 transition-all ${verifiedIds[restro.restroId] ? "border-slate-200 dark:border-zinc-800" : "border-secondary-orange/30 bg-orange-50/10 dark:bg-orange-950/5"}`}
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  {verifiedIds[restro.restroId] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-secondary-orange shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-zinc-100">
                      {restro.restroName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500 truncate max-w-[200px] sm:max-w-md">
                      {restro.address || "No address provided"}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <DayScheduleEditor
                  days={localSchedules[restro.restroId] || []}
                  onChange={(days) =>
                    handleUpdateRestroSchedule(restro.restroId, days)
                  }
                  restaurants={restaurants}
                  restroId={restro.restroId}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100 dark:border-zinc-800 mt-4">
          <p className="text-xs text-slate-500 dark:text-zinc-500 italic">
            {!allVerified && "Please verify all restaurants to continue."}
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 text-slate-700 bg-white hover:bg-slate-100"
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || !allVerified}
              className="bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-black dark:hover:bg-white flex-1 sm:flex-none min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.saving", "Saving...")}
                </>
              ) : (
                t(
                  "onboarding.restaurant.complete.schedule.verifyAllButton",
                  "Verify & Save All",
                )
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
