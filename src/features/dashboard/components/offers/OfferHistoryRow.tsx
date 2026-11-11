import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";
import type { RestaurantOfferDTO } from "../../api/restaurantOffersApi";
import { offerDateRange, offerHeadline, offerLengthDays } from "./offerSummary";

/**
 * 2026-11-11: one ended offer in the My Offers history - a compact row (history is for looking
 * back, not acting), so many fit on screen. Read-only: the backend refuses changes to ended offers.
 */

interface OfferHistoryRowProps {
  offer: RestaurantOfferDTO;
  showOutlet: boolean;
}

export const OfferHistoryRow = ({ offer, showOutlet }: OfferHistoryRowProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.offers.myOffers.";
  const minOrder = offer.minOrderAmount > 0 ? t(`${k}minOrder`, { mov: offer.minOrderAmount }) : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-5 py-4 bg-white dark:bg-slate-900">
      <div className="sm:w-40 shrink-0 flex items-center gap-2">
        <p className="font-extrabold text-sm text-slate-500 dark:text-slate-400 tracking-wide break-all">{offer.promoCode}</p>
        {offer.offerTypeFor === 2 && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label={t(`${k}eliteOnly`)} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1a2b4b] dark:text-slate-200">
          {offerHeadline(t, offer)}
          {minOrder && <span className="font-medium text-slate-500 dark:text-slate-400"> {minOrder}</span>}
        </p>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
          {t(offer.offerCreationType === "ENROLLED_BY_RESTRO" ? `${k}origin.enrolled` : `${k}origin.created`)}
          {showOutlet && <> · {offer.restroName}</>}
        </p>
      </div>
      <div className="sm:text-right shrink-0">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{offerDateRange(offer, i18n.language, true)}</p>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {t("dashboard.offers.activation.daysCount", { count: offerLengthDays(offer) })}
        </p>
      </div>
    </div>
  );
};
