import { useTranslation } from "react-i18next";
import type { CommissionTier } from "../../api/outletInfoApi";
import { wholeRupees } from "./outletInfoFormat";

/**
 * 2026-11-12: every partner-visible term of one commission plan (GET /tiers): commission (a % for
 * PERCENTAGE plans, a flat ₹ per order for FIXED ones), the order-value range it covers, delivery
 * fees, the combined-fee cap, payment-gateway fee, per-call fee and GST. Used for the plan picked on
 * the slider and, read-only, for the fixed plans USTART applies.
 */
export const TierVariables = ({ tier, compact = false }: { tier: CommissionTier; compact?: boolean }) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletInfo.plans.vars.";
  // Whole rupees, no decimals (user request); an amount the API omits (null) reads as ₹0.
  const rupees = (value?: number | null) => wholeRupees(value, i18n.language);
  const percent = (value?: number | null) => `${value ?? 0}%`;
  const rows: [string, string][] = [
    [t(`${k}commission`), tier.tierType === "FIXED"
      ? t(`${k}flatPerOrder`, { amount: rupees(tier.commissionValue) })
      : percent(tier.commissionValue)],
    [t(`${k}orderRange`), tier.maxTov != null
      ? t(`${k}between`, { min: wholeRupees(tier.minTov, i18n.language, "ceil"), max: wholeRupees(tier.maxTov, i18n.language, "floor") })
      : t(`${k}andAbove`, { min: wholeRupees(tier.minTov, i18n.language, "ceil") })],
    [t(`${k}baseDeliveryFee`), rupees(tier.baseDeliveryFee)],
    [t(`${k}deliveryFeePerKm`), rupees(tier.deliveryFeePerKm)],
    [t(`${k}maxCombinedFee`), tier.maxCombinedFeePercent != null ? percent(tier.maxCombinedFeePercent) : t(`${k}noCap`)],
    [t(`${k}pgFee`), percent(tier.pgFeePercent)],
    [t(`${k}perCallFee`), rupees(tier.perCallFee)],
    [t(`${k}gst`), percent(tier.gstPercent)],
  ];
  return (
    <dl className={`grid gap-x-4 ${compact ? "grid-cols-2 gap-y-2" : "grid-cols-2 sm:grid-cols-4 gap-y-3"}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</dt>
          <dd className="text-sm font-bold text-[#1a2b4b] dark:text-slate-100">{value}</dd>
        </div>
      ))}
    </dl>
  );
};
