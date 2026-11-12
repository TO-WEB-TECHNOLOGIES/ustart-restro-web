import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/utils/error";
import type { OutletStatusItem } from "../../api/outletStatusApi";
import { usePauseOutlet, useResumeOutlet } from "../../hooks/useOutletStatus";
import { AllOutletsConfirmDialog } from "../MenuEditor/AllOutletsConfirmDialog";
import { describeStatus, formatWhen } from "./outletTime";

/**
 * 2026-11-12: the open/closed switch for one outlet (header, home card, All Locations sidebar).
 * Product rules:
 * - OFF while open → confirm, then pause until the current opening hours end;
 * - ON while paused → resume straight away;
 * - ON during a holiday → confirm, then end the holiday now (all of it);
 * - disabled while closed by the timetable, not live, or without hours (title says why).
 */
interface OutletToggleProps {
  item: OutletStatusItem;
  className?: string;
}

type Pending = "pause" | "endHoliday" | null;

export const OutletToggle = ({ item, className }: OutletToggleProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletSchedule.toggle.";
  const pause = usePauseOutlet();
  const resume = useResumeOutlet();
  const [pending, setPending] = useState<Pending>(null);
  const { status } = item;
  const busy = pause.isPending || resume.isPending;
  const canToggle = status.state === "OPEN" || status.state === "PAUSED" || status.state === "ON_HOLIDAY";

  const run = async (action: "pause" | "resume") => {
    try {
      if (action === "pause") {
        await pause.mutateAsync(item.restroId);
        toast.success(t(`${k}paused`, { name: item.restroName }));
      } else {
        await resume.mutateAsync(item.restroId);
        toast.success(t(`${k}resumed`, { name: item.restroName }));
      }
      setPending(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  const onChange = (next: boolean) => {
    if (!next && status.state === "OPEN") setPending("pause");
    else if (next && status.state === "PAUSED") run("resume");
    else if (next && status.state === "ON_HOLIDAY") setPending("endHoliday");
  };

  const closure = status.activeClosure;
  return (
    // The wrapper stops clicks (the switch's, and the dialog's - React portals still bubble through
    // the component tree) reaching a clickable sidebar row. It can't go on the Switch itself, whose
    // own onClick a passed one would replace.
    <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <Switch
        checked={status.isOpen}
        onCheckedChange={onChange}
        disabled={!canToggle || busy}
        aria-label={t(`${k}label`, { name: item.restroName })}
        title={canToggle ? undefined : describeStatus(t, status, i18n.language).label}
        className={className ?? "scale-75 data-[state=checked]:bg-emerald-500"}
      />
      <AllOutletsConfirmDialog
        open={pending !== null}
        isLoading={busy}
        title={pending === "pause" ? t(`${k}pauseTitle`, { name: item.restroName }) : t(`${k}endHolidayTitle`)}
        description={
          pending === "pause"
            ? t(`${k}pauseText`, { time: status.closesAt ? formatWhen(status.closesAt, i18n.language) : "" })
            : t(`${k}endHolidayText`, {
                reason: closure?.reason || t("dashboard.outletSchedule.holiday.noReason"),
                time: closure ? formatWhen(closure.endsAt, i18n.language) : "",
              })
        }
        confirmLabel={pending === "pause" ? t(`${k}pauseConfirm`) : t(`${k}endHolidayConfirm`)}
        cancelLabel={t(`${k}cancel`)}
        onConfirm={() => run(pending === "pause" ? "pause" : "resume")}
        onClose={() => setPending(null)}
      />
    </span>
  );
};
