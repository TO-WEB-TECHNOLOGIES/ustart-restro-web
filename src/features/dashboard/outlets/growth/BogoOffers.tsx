import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/utils/error";
import { ALL_LOCATIONS_ID } from "@/types/storeTypes";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useBogo } from "../../hooks/useRestaurantOffers";
import { OfferMenuPageShell } from "../../components/offers/menu/OfferMenuPageShell";
import { BogoEditor } from "../../components/offers/bogo/BogoEditor";

/**
 * 2026-11-11: BOGO Offers (Customer Delighters → BOGO). Per outlet: with "All Locations" selected it
 * asks for one outlet, since each outlet has its own BOGO. Loads the outlet's BOGO, then hands
 * over to BogoEditor (keyed by outlet so switching outlets drops unsaved ticks).
 */
export const BogoOffers = () => {
  const { t } = useTranslation();
  const k = "dashboard.offers.bogoPage.";
  const { selectedAddressId } = useRestaurantStore();
  const restroId = !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID ? null : selectedAddressId;
  const bogoQuery = useBogo(restroId);
  const title = t(`${k}title`);
  const subtitle = t(`${k}subtitle`);

  if (restroId && bogoQuery.data) {
    return <BogoEditor key={restroId} restroId={restroId} server={bogoQuery.data} title={title} subtitle={subtitle} />;
  }

  return (
    <OfferMenuPageShell title={title} subtitle={subtitle} needsOutlet={restroId === null}>
      {() =>
        bogoQuery.isError ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium text-red-500">{getErrorMessage(bogoQuery.error, t(`${k}loadFailed`))}</p>
            <button
              type="button"
              onClick={() => bogoQuery.refetch()}
              className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t("dashboard.offers.offerMenu.retry")}
            </button>
          </div>
        ) : (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-10 h-10 text-secondary-orange animate-spin" />
          </div>
        )
      }
    </OfferMenuPageShell>
  );
};
