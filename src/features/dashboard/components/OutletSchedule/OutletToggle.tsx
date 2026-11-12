import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getErrorMessage } from "@/utils/error";
import type { OutletStatusItem } from "../../api/outletStatusApi";
import { usePauseOutlet, useResumeOutlet } from "../../hooks/useOutletStatus";
import { AllOutletsConfirmDialog } from "../MenuEditor/AllOutletsConfirmDialog";
import { formatWhen } from "./outletTime";

/**
 * 2026-11-12: the open/closed switch for one outlet (header, home card, All Locations sidebar).
 * Product rules:
 * - OFF while open → confirm, then pause until the current opening hours end;
 * - ON while paused → resume straight away;
 * - ON during a holiday → confirm, then end the holiday now (all of it);
 * - disabled while closed by the timetable, not live, or without hours.
 * 2026-11-12 (user request): hovering (or focusing) a disabled switch shows a tooltip with the reason -
 * closed by today's hours (and when it opens), no hours set, or not live: outlet awaiting approval,
 * brand awaiting approval, or on hold (`notLiveReason` from the API). Replaces the plain title.
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
  // Why the switch can't be used (null when it can).
  const disabledReason = canToggle ? null
    : status.state === "CLOSED_BY_SCHEDULE"
      ? status.opensAt
        ? t(`${k}why.closedOpensAt`, { time: formatWhen(status.opensAt, i18n.language) })
        : t(`${k}why.closed`)
      : status.state === "NO_SCHEDULE" ? t(`${k}why.noSchedule`)
      : t(`${k}why.${item.notLiveReason ?? "notLive"}`);

  const control = (
    <Switch
      checked={status.isOpen}
      onCheckedChange={onChange}
      disabled={!canToggle || busy}
      aria-label={t(`${k}label`, { name: item.restroName })}
      className={className ?? "scale-75 data-[state=checked]:bg-emerald-500"}
    />
  );
  return (
    // The wrapper stops clicks (the switch's, and the dialog's - React portals still bubble through
    // the component tree) reaching a clickable sidebar row. It can't go on the Switch itself, whose
    // own onClick a passed one would replace.
    <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
      {disabledReason ? (
        // A disabled <button> gets no pointer events, so the tooltip hangs on a focusable wrapper.
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} aria-label={disabledReason} className="inline-flex cursor-not-allowed rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-orange">
              {control}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-64 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 [&_svg]:bg-slate-900 [&_svg]:fill-slate-900 dark:[&_svg]:bg-slate-100 dark:[&_svg]:fill-slate-100">
            {disabledReason}
          </TooltipContent>
        </Tooltip>
      ) : control}
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
