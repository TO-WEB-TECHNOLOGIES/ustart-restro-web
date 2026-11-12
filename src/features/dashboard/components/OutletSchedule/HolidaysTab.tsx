import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarOff, Loader2, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getErrorMessage } from "@/utils/error";
import type { Closure } from "../../api/outletStatusApi";
import { useClosureHistory, useEndClosure, useUpcomingClosures } from "../../hooks/useOutletStatus";
import { AllOutletsConfirmDialog } from "../MenuEditor/AllOutletsConfirmDialog";
import { formatDateTime } from "./outletTime";

/**
 * 2026-11-12: the Holidays tab. Upcoming first (the active pause or holiday on top with "End now",
 * future ones with "Cancel", both confirmed), then a collapsible History (loaded only when opened,
 * paged with "Load more"). Same list look as My Offers' history.
 */
export const HolidaysTab = ({ restroId }: { restroId: string }) => {
  const { t } = useTranslation();
  const k = "dashboard.outletSchedule.holidays.";
  const upcoming = useUpcomingClosures(restroId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useClosureHistory(restroId, historyOpen);
  const endClosure = useEndClosure();
  const [confirming, setConfirming] = useState<Closure | null>(null);

  const confirmEnd = async () => {
    if (!confirming) return;
    try {
      await endClosure.mutateAsync({ restroId, closureId: confirming.closureId });
      toast.success(t(confirming.state === "ACTIVE" ? `${k}toast.ended` : `${k}toast.cancelled`));
      setConfirming(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}toast.failed`)));
    }
  };

  const historyItems = history.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-6">
      {upcoming.isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-secondary-orange animate-spin" /></div>
      ) : upcoming.isError ? (
        <ErrorRetry message={getErrorMessage(upcoming.error, t(`${k}loadFailed`))} onRetry={() => upcoming.refetch()} />
      ) : (upcoming.data ?? []).length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 py-12 px-6 flex flex-col items-center text-center gap-3">
          <div className="size-14 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-secondary-orange">
            <CalendarOff className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{t(`${k}empty`)}</p>
        </div>
      ) : (
        <div className="rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm bg-white dark:bg-slate-900">
          {upcoming.data!.map((closure) => (
            <ClosureRow
              key={closure.closureId}
              closure={closure}
              action={
                <button
                  type="button"
                  onClick={() => setConfirming(closure)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                >
                  {closure.state === "ACTIVE" ? t(`${k}endNow`) : t(`${k}cancel`)}
                </button>
              }
            />
          ))}
        </div>
      )}

      <Accordion type="single" collapsible onValueChange={(value) => setHistoryOpen(value === "history")}>
        <AccordionItem value="history" className="border-none">
          <AccordionTrigger className="text-sm font-bold text-[#1a2b4b] dark:text-white hover:no-underline">
            {t(`${k}history`)}
          </AccordionTrigger>
          <AccordionContent>
            {history.isLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>
            ) : history.isError ? (
              <ErrorRetry message={getErrorMessage(history.error, t(`${k}loadFailed`))} onRetry={() => history.refetch()} />
            ) : historyItems.length === 0 ? (
              <p className="py-4 text-sm text-slate-500 dark:text-slate-400">{t(`${k}emptyHistory`)}</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {historyItems.map((closure) => <ClosureRow key={closure.closureId} closure={closure} />)}
                </div>
                {history.hasNextPage && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={history.isFetchingNextPage}
                      onClick={() => history.fetchNextPage()}
                      className="h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                    >
                      {history.isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t(`${k}loadMore`)}
                    </button>
                  </div>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AllOutletsConfirmDialog
        open={confirming !== null}
        isLoading={endClosure.isPending}
        title={confirming?.state === "ACTIVE" ? t(`${k}confirmEndTitle`) : t(`${k}confirmCancelTitle`)}
        description={confirming?.state === "ACTIVE" ? t(`${k}confirmEndText`) : t(`${k}confirmCancelText`)}
        confirmLabel={confirming?.state === "ACTIVE" ? t(`${k}endNow`) : t(`${k}cancelHoliday`)}
        cancelLabel={t(`${k}keep`)}
        onConfirm={confirmEnd}
        onClose={() => setConfirming(null)}
      />
    </div>
  );
};

const STATE_CHIP: Record<Closure["state"], string> = {
  ACTIVE: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  UPCOMING: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  ENDED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  ENDED_EARLY: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

const ClosureRow = ({ closure, action }: { closure: Closure; action?: ReactNode }) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletSchedule.holidays.";
  const isPause = closure.type === "PAUSE";
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${isPause
        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        : "bg-orange-50 dark:bg-orange-900/20 text-secondary-orange"}`}>
        {isPause ? <PauseCircle className="w-5 h-5" /> : <CalendarOff className="w-5 h-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-[#1a2b4b] dark:text-white truncate">
            {closure.reason || t(isPause ? `${k}pause` : "dashboard.outletSchedule.holiday.noReason")}
          </p>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATE_CHIP[closure.state]}`}>
            {t(`${k}state.${closure.state}`)}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {formatDateTime(closure.startsAt, i18n.language)} – {formatDateTime(closure.endsAt, i18n.language)}
        </p>
      </div>
      {action}
    </div>
  );
};

const ErrorRetry = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="py-12 flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-medium text-red-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {t("dashboard.outletSchedule.retry")}
      </button>
    </div>
  );
};
