import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/error";
import { ALL_LOCATIONS_ID } from "@/types/storeTypes";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useCommissionPlans, useOutletCards } from "../../hooks/useOutletInfo";
import { AddOutletCard, OutletCard } from "../../components/OutletInfo/OutletCards";
import { BrandDetailsSection } from "../../components/OutletInfo/BrandDetailsSection";
import { OutletDetailView } from "../../components/OutletInfo/OutletDetailView";

/**
 * 2026-11-12: Support → Outlet Info (/dashboard/info, previously Coming Soon).
 * One outlet selected in the header: that outlet's details. "All Locations": a card per outlet
 * (status, full address, commission plan) plus "Add Outlet", which brand-level users get (an
 * outlet-level login manages only its own outlet, so it doesn't see Add).
 * 2026-11-12: "All Locations" starts with Brand Details (editable, with the brand's commission plan).
 */
// 2026-11-12 (user report: the outlet cards sat flush on the bottom edge): the real cause was
// DashboardLayout cutting off the bottom of the page (fixed there); this keeps clear space under the
// last cards. pb-* is repeated per breakpoint because md:p-6 / lg:p-10 would override a bare pb-16.
export const PAGE_CLASS = "flex-1 min-h-[calc(100vh-64px)] p-4 md:p-6 lg:p-10 pb-16 md:pb-16 lg:pb-20 bg-[#fdfbf7] dark:bg-slate-950 transition-colors duration-300";

export const OutletInfo = () => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.";
  const { user } = useAuth();
  const selectedAddressId = useRestaurantStore((state) => state.selectedAddressId);
  const isAll = !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID;
  const outlets = useOutletCards(isAll); // only the grid needs the list
  const plans = useCommissionPlans();

  if (!isAll) {
    return (
      <div className={PAGE_CLASS}>
        <div className="max-w-6xl mx-auto">
          <OutletDetailView key={selectedAddressId} restroId={selectedAddressId!} />
        </div>
      </div>
    );
  }

  const items = outlets.data?.pages.flatMap((page) => page.content) ?? [];
  return (
    <div className={PAGE_CLASS}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1a2b4b] dark:text-white pb-1">{t(`${k}title`)}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t(`${k}subtitle`)}</p>
        </div>

        <BrandDetailsSection />

        <h2 className="text-lg font-bold text-[#1a2b4b] dark:text-white pt-2">{t(`${k}outletsHeading`)}</h2>

        {outlets.isLoading ? (
          <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-secondary-orange animate-spin" /></div>
        ) : outlets.isError ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium text-red-500">{getErrorMessage(outlets.error, t(`${k}loadFailed`))}</p>
            <button
              type="button"
              onClick={() => outlets.refetch()}
              className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t(`${k}retry`)}
            </button>
          </div>
        ) : (
          // 2026-11-12 (user request): clear space under the outlet cards.
          <section className="space-y-5 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.map((outlet) => <OutletCard key={outlet.restroId} outlet={outlet} plan={plans.data?.percentage} />)}
              {!user?.restroId && <AddOutletCard />}
            </div>
            {outlets.hasNextPage && (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={outlets.isFetchingNextPage}
                  onClick={() => outlets.fetchNextPage()}
                  className="h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {outlets.isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t(`${k}loadMore`)}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
