import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getErrorMessage } from "@/utils/error";
import type { ActivePlan } from "../../api/outletInfoApi";
import { useAssignPlan, usePercentagePlans } from "../../hooks/useOutletInfo";
import { FixedPlanLines } from "./FixedPlanLines";
import { TierVariables } from "./TierVariables";

/**
 * 2026-11-12: the brand's commission plans in a dialog.
 * - Percentage plans on a slider (user request: a slider instead of plan cards), ordered by
 *   commission %; each stop shows that plan's full terms (TierVariables). Saving assigns it to the
 *   whole brand (POST /tiers/assign) and writes it into the cache, so every view updates at once.
 * - Fixed plans (USTART's mandatory small-order plans, all of them) are listed read-only above the
 *   slider - commission only, one line per order band (FixedPlanLines).
 * - canChange=false (outlet logins, or a brand that isn't live): the same view, slider disabled,
 *   no Save - so anyone can read the terms.
 */
interface CommissionPlanDialogProps {
  current: ActivePlan | null;
  fixed: ActivePlan[];
  canChange: boolean;
  onClose: () => void;
}

export const CommissionPlanDialog = ({ current, fixed, canChange, onClose }: CommissionPlanDialogProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.plans.";
  const plansQuery = usePercentagePlans(true);
  const assign = useAssignPlan();
  const plans = useMemo(
    () => [...(plansQuery.data ?? [])].sort((a, b) => a.commissionValue - b.commissionValue),
    [plansQuery.data],
  );
  // Slider position = index into `plans`; starts on the current plan (or the first one).
  const [picked, setPicked] = useState<number | null>(null);
  const currentIndex = Math.max(0, plans.findIndex((p) => p.tierId === current?.tierId));
  const index = picked ?? currentIndex;
  const chosen = plans[index] ?? null;

  const save = async () => {
    if (!chosen) return;
    try {
      await assign.mutateAsync(chosen);
      toast.success(t(`${k}saved`, { name: chosen.tierName }));
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  return (
    <Dialog open onOpenChange={(next) => { if (!next && !assign.isPending) onClose(); }}>
      <DialogContent showCloseButton={!assign.isPending} className="sm:max-w-2xl rounded-[28px] p-6 sm:p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="space-y-1">
          <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">{t(canChange ? `${k}title` : `${k}viewTitle`)}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}hint`)}</DialogDescription>
        </div>

        {/* 2026-11-12 (user request): the fixed plans first, above the slider - they always apply. */}
        {fixed.length > 0 && (
          <section className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
            <FixedPlanLines fixed={fixed} />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${k}fixedHint`)}</p>
          </section>
        )}

        {plansQuery.isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>
        ) : plansQuery.isError ? (
          <p className="text-sm text-red-500">{getErrorMessage(plansQuery.error, t(`${k}loadFailed`))}</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}empty`)}</p>
        ) : (
          <section className="space-y-5">
            <div className="space-y-3">
              <Slider
                value={[index]}
                min={0}
                max={Math.max(plans.length - 1, 0)}
                step={1}
                disabled={!canChange || plans.length < 2 || assign.isPending}
                onValueChange={([value]) => setPicked(value)}
                aria-label={t(`${k}sliderLabel`)}
                className="[&_[data-slot=slider-range]]:bg-secondary-orange [&_[data-slot=slider-thumb]]:border-secondary-orange [&_[data-slot=slider-thumb]]:size-5"
              />
              {/* One label per stop, under its position on the track. */}
              <div className="flex justify-between gap-1">
                {plans.map((plan, i) => (
                  <button
                    key={plan.tierId}
                    type="button"
                    disabled={!canChange || assign.isPending}
                    onClick={() => setPicked(i)}
                    className={`text-xs font-bold tabular-nums disabled:cursor-default ${i === index ? "text-secondary-orange" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {plan.commissionValue}%
                  </button>
                ))}
              </div>
            </div>

            {chosen && (
              <div className="rounded-2xl border border-orange-100 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-500/5 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-[#1a2b4b] dark:text-white">{chosen.tierName}</span>
                  {chosen.isRecommended && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {t(`${k}recommended`)}
                    </span>
                  )}
                  {chosen.tierId === current?.tierId && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {t(`${k}current`)}
                    </span>
                  )}
                </div>
                {chosen.description && <p className="text-sm text-slate-500 dark:text-slate-400">{chosen.description}</p>}
                <TierVariables tier={chosen} />
              </div>
            )}
          </section>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={assign.isPending}
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {t(canChange ? `${k}cancel` : `${k}close`)}
          </button>
          {canChange && (
            <button
              type="button"
              disabled={assign.isPending || !chosen || chosen.tierId === current?.tierId}
              onClick={save}
              className="flex-1 h-12 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {assign.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t(`${k}save`)}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
