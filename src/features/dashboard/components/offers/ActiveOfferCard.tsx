import { useTranslation } from "react-i18next";
import { CalendarDays, Crown, Loader2, Pause, Play, Square, Store, Users } from "lucide-react";
import type { RestaurantOfferDTO } from "../../api/restaurantOffersApi";
import { customerTypeLabelKey } from "../../outlets/growth/offerPayloads";
import { canEndNow, offerDateRange, offerHeadline, offerTimingLabel } from "./offerSummary";

/**
 * 2026-11-11: one live / upcoming / paused offer on the My Offers page. Brand look as on the growth
 * screens: white rounded card, orange headline, slate meta lines. Pause/Resume and End now call
 * back to the page, which owns the mutation and the End-now confirmation dialog.
 */

// Status chip colours: live = brand green, upcoming = brand blue, paused = amber (needs attention).
const STATUS_STYLES: Record<string, string> = {
  LIVE: "bg-terracotta-green/10 text-terracotta-green border-terracotta-green/20",
  UPCOMING: "bg-primary-blue/5 text-primary-blue border-primary-blue/20 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
};

interface ActiveOfferCardProps {
  offer: RestaurantOfferDTO;
  showOutlet: boolean; // only with "All Locations", where offers of several outlets are mixed
  busy: boolean;
  onTogglePause: (offer: RestaurantOfferDTO) => void;
  onEndNow: (offer: RestaurantOfferDTO) => void;
}

export const ActiveOfferCard = ({ offer, showOutlet, busy, onTogglePause, onEndNow }: ActiveOfferCardProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.offers.myOffers.";
  const minOrder = offer.minOrderAmount > 0 ? t(`${k}minOrder`, { mov: offer.minOrderAmount }) : null;
  const paused = offer.status === "PAUSED";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-extrabold text-base text-[#1a2b4b] dark:text-white tracking-wide break-all">{offer.promoCode}</p>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[offer.status] ?? ""}`}>
          {offer.status === "LIVE" && <span className="size-1.5 rounded-full bg-current" />}
          {t(`${k}status.${offer.status}`)}
        </span>
      </div>

      <div>
        <p className="text-2xl font-black text-secondary-orange leading-tight">{offerHeadline(t, offer)}</p>
        {minOrder && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{minOrder}</p>}
      </div>

      {/* Who it's for: Elite-only offers say so; otherwise the restaurant customer segment. */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5" />
          {t(customerTypeLabelKey(offer.applicableOnCustomerType))}
        </span>
        {offer.offerTypeFor === 2 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-blue text-white text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            {t(`${k}eliteOnly`)}
          </span>
        )}
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-xs font-bold text-secondary-orange">
          {t(offer.offerCreationType === "ENROLLED_BY_RESTRO" ? `${k}origin.enrolled` : `${k}origin.created`)}
        </span>
      </div>

      <div className="space-y-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
        <p className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          {offerDateRange(offer, i18n.language)}
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="font-bold text-[#1a2b4b] dark:text-slate-200">{offerTimingLabel(t, offer)}</span>
        </p>
        {showOutlet && (
          <p className="flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-400" />
            {offer.restroName}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2 mt-auto border-t border-slate-50 dark:border-slate-800">
        <button
          type="button"
          disabled={busy}
          onClick={() => onTogglePause(offer)}
          className="flex-1 h-11 mt-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {t(paused ? `${k}actions.resume` : `${k}actions.pause`)}
        </button>
        {canEndNow(offer) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onEndNow(offer)}
            className="flex-1 h-11 mt-3 rounded-xl border border-red-100 dark:border-red-500/20 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            <Square className="w-4 h-4" />
            {t(`${k}actions.endNow`)}
          </button>
        )}
      </div>
    </div>
  );
};
