import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Percent } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBrandDetail, useCommissionPlans } from "../../hooks/useOutletInfo";
import { CommissionPlanDialog } from "./CommissionPlanDialog";
import { InfoField, InfoSection } from "./InfoSection";
import { FixedPlanLines } from "./FixedPlanLines";

/**
 * 2026-11-12: the brand's commission plans (shown on each outlet page and in Brand Details; one set
 * for the whole brand): the chosen percentage plan, plus all of USTART's fixed small-order plans
 * as read-only commission lines (FixedPlanLines, 2026-11-12). "Change" (brand-level logins while
 * the brand is ACTIVE or UPDATE_APPROVAL_PENDING - the backend's rules) or "View details" (everyone
 * else) opens CommissionPlanDialog.
 * 2026-11-12: `editable` - plans belong to the brand, not an outlet, so an outlet page passes
 * editable={false}: View details only, with a note that the plan is changed in Brand Details.
 */
const PLAN_EDITABLE = ["ACTIVE", "UPDATE_APPROVAL_PENDING"];

export const CommissionSection = ({ editable = true }: { editable?: boolean }) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.";
  const { user } = useAuth();
  const plans = useCommissionPlans();
  const brand = useBrandDetail();
  const [open, setOpen] = useState(false);
  const notSet = t(`${k}notSet`);

  const isBrandUser = !user?.restroId;
  const brandAllows = !!brand.data && PLAN_EDITABLE.includes(brand.data.status);
  const canChange = editable && isBrandUser && brandAllows;
  const hint = !editable ? t(`${k}plans.setForBrand`)
    : !isBrandUser ? t(`${k}plans.brandUsersOnly`)
    : brand.data && !brandAllows ? t(`${k}plans.notYet`) : null;
  const percentage = plans.data?.percentage ?? null;
  const fixed = plans.data?.fixed ?? [];

  return (
    <InfoSection
      icon={Percent}
      title={t(`${k}sections.commission`)}
      action={plans.isSuccess && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t(canChange ? `${k}plans.change` : `${k}plans.viewDetails`)}
        </button>
      )}
    >
      {plans.isLoading ? (
        <Loader2 className="w-5 h-5 text-secondary-orange animate-spin" />
      ) : percentage ? (
        <div className="grid grid-cols-2 gap-4">
          <InfoField label={t(`${k}commission.plan`)} value={percentage.tierName} fallback={notSet} />
          <InfoField
            label={t(`${k}commission.rate`)}
            value={percentage.tier ? `${percentage.tier.commissionValue}%` : null}
            fallback={notSet}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}commission.none`)}</p>
      )}

      {/* 2026-11-12 (user request): the flat plans as commission-only lines, no table. */}
      <FixedPlanLines fixed={fixed} />
      <p className="text-xs text-slate-400 dark:text-slate-500">{hint ?? t(`${k}plans.appliesToAll`)}</p>

      {open && (
        <CommissionPlanDialog current={percentage} fixed={fixed} canChange={canChange} onClose={() => setOpen(false)} />
      )}
    </InfoSection>
  );
};
