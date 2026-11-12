import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import type { ActivePlan } from "../../api/outletInfoApi";
import { wholeRupees } from "./outletInfoFormat";

/**
 * 2026-11-12 (user request): USTART's fixed (flat) plans, commission only, one line per order-value
 * band in order: "≤ ₹149 · ₹9", "₹150 – ≤ ₹249 · ₹15", ... "₹250 & above · ₹X". Read-only; shown on
 * the commission card and above the slider in the plan dialog. Whole rupees, no decimals.
 */
export const FixedPlanLines = ({ fixed }: { fixed: ActivePlan[] }) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletInfo.plans.";
  const lang = i18n.language;
  const tiers = fixed.flatMap((plan) => (plan.tier ? [plan.tier] : []));
  if (tiers.length === 0) return null;

  const band = (min?: number, max?: number | null) => {
    if (!min && max != null) return t(`${k}band.upTo`, { max: wholeRupees(max, lang, "floor") });
    if (max != null) return t(`${k}band.between`, { min: wholeRupees(min, lang, "ceil"), max: wholeRupees(max, lang, "floor") });
    return t(`${k}band.above`, { min: wholeRupees(min, lang, "ceil") });
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <Lock className="w-3.5 h-3.5" />
        {t(`${k}flatTitle`)}
      </p>
      <ul className="space-y-1">
        {tiers.map((tier) => (
          <li key={tier.tierId} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 dark:text-slate-300">{band(tier.minTov, tier.maxTov)}</span>
            <span className="font-bold text-[#1a2b4b] dark:text-slate-100 tabular-nums">
              {t(`${k}flatCommission`, { amount: wholeRupees(tier.commissionValue, lang) })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
