import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Percent, Plus, Store } from "lucide-react";
import type { Restaurant } from "@/types/restaurantTypes";
import type { ActivePlan } from "../../api/outletInfoApi";
import { StatusChip } from "./StatusChip";
import { formatAddress } from "./outletInfoFormat";

/**
 * 2026-11-12: the "All Locations" grid on Outlet Info. Each card shows the outlet's status, full
 * address and the brand's commission plan (plans are per brand, so it's the same on every card),
 * and opens the outlet's detail page. AddOutletCard opens the full-page add form.
 */
export const INFO_PATH = "/dashboard/info";

interface OutletCardProps {
  outlet: Restaurant;
  /** The brand's percentage plan (the same for every outlet). */
  plan: ActivePlan | null | undefined;
}

export const OutletCard = ({ outlet, plan }: OutletCardProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.";
  return (
    <Link
      to={`${INFO_PATH}/${outlet.restroId}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-orange"
    >
      <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
        {outlet.primaryImage ? (
          <img src={outlet.primaryImage} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Store className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusChip status={outlet.status} />
        </div>
      </div>
      <div className="flex-1 p-5 space-y-3">
        <h3 className="text-base font-bold text-[#1a2b4b] dark:text-white truncate group-hover:text-secondary-orange transition-colors">
          {outlet.restroName}
        </h3>
        <p className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{formatAddress(outlet.address) || t(`${k}notSet`)}</span>
        </p>
        <p className="flex items-center gap-2 text-sm font-semibold text-[#1a2b4b] dark:text-slate-200">
          <Percent className="w-4 h-4 shrink-0 text-secondary-orange" />
          {plan
            ? plan.tier
              ? t(`${k}commission.percent`, { value: plan.tier.commissionValue, name: plan.tierName })
              : plan.tierName
            : t(`${k}commission.none`)}
        </p>
      </div>
    </Link>
  );
};

export const AddOutletCard = () => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.";
  return (
    <Link
      to={`${INFO_PATH}/new`}
      className="min-h-[16rem] flex flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-secondary-orange hover:text-secondary-orange transition-colors p-6 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-orange"
    >
      <span className="size-12 rounded-full bg-orange-50 dark:bg-orange-900/20 text-secondary-orange flex items-center justify-center">
        <Plus className="w-6 h-6" />
      </span>
      <span className="text-sm font-bold">{t(`${k}addOutlet`)}</span>
      <span className="text-xs max-w-[14rem]">{t(`${k}addOutletHint`)}</span>
    </Link>
  );
};
