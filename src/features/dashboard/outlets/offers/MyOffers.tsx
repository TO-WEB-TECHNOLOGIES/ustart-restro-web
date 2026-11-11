import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { History, Loader2, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/utils/error";
import { ALL_LOCATIONS_ID } from "@/types/storeTypes";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useRestaurantOfferList, useUpdateRestaurantOffer } from "../../hooks/useRestaurantOffers";
import type { RestaurantOfferDTO } from "../../api/restaurantOffersApi";
import { ActiveOfferCard } from "../../components/offers/ActiveOfferCard";
import { OfferHistoryRow } from "../../components/offers/OfferHistoryRow";
import { EndOfferDialog } from "../../components/offers/EndOfferDialog";
import { HISTORY_PAGE_SIZE, localNowString, splitOffers } from "../../components/offers/offerSummary";

/**
 * 2026-11-11: My Offers (/dashboard/offers, the sidebar's Growth → Offers link, which had no page).
 *
 * - Outlet scope follows the header picker: one outlet → ?restroId; "All Locations" → no restroId,
 *   so the backend returns every outlet the user may see, and cards then name the outlet.
 * - One request for everything; split in the browser into Active (live + upcoming + paused) and
 *   History (ended). History renders 20 rows at a time - the backend has no paging yet
 *   (ustart-backend ARCHITECTURE_REVIEW M25).
 * - Pause/Resume and End now use PATCH /restaurant-offers/{id}; the list refreshes itself because
 *   every write invalidates the restaurantOffers query prefix.
 */

type OffersTab = "active" | "history";

export const MyOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const k = "dashboard.offers.myOffers.";

  const { selectedAddressId } = useRestaurantStore();
  const allLocations = !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID;
  const offersQuery = useRestaurantOfferList(allLocations ? undefined : selectedAddressId ?? undefined);
  const updateOffer = useUpdateRestaurantOffer();

  const [tab, setTab] = useState<OffersTab>("active");
  const [historyShown, setHistoryShown] = useState(HISTORY_PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [endingOffer, setEndingOffer] = useState<RestaurantOfferDTO | null>(null);

  const { active, history } = useMemo(() => splitOffers(offersQuery.data ?? []), [offersQuery.data]);

  const togglePause = async (offer: RestaurantOfferDTO) => {
    const pausing = offer.status !== "PAUSED";
    setBusyId(offer.offerId);
    try {
      await updateOffer.mutateAsync({ offerId: offer.offerId, isActive: !pausing });
      toast.success(t(pausing ? `${k}toast.paused` : `${k}toast.resumed`, { promo: offer.promoCode }));
    } catch (error) {
      // e.g. "An ended offer can't be resumed" if it ran out while the page was open.
      toast.error(getErrorMessage(error, t(`${k}toast.failed`)));
    } finally {
      setBusyId(null);
    }
  };

  const confirmEnd = async () => {
    if (!endingOffer) return;
    const offer = endingOffer;
    setBusyId(offer.offerId);
    try {
      await updateOffer.mutateAsync({ offerId: offer.offerId, endingDateTime: localNowString() });
      toast.success(t(`${k}toast.ended`, { promo: offer.promoCode }));
      setEndingOffer(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}toast.failed`)));
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: OffersTab; count: number }[] = [
    { id: "active", count: active.length },
    { id: "history", count: history.length },
  ];

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-[#fdfbf7] dark:bg-slate-950 p-4 md:p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#1a2b4b] dark:text-white pb-1">{t(`${k}title`)}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t(`${k}subtitle`)}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/growth")}
            className="h-12 px-6 rounded-2xl bg-secondary-orange hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-secondary-orange/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {t(`${k}create`)}
          </button>
        </div>

        {/* Pill tabs, same style as the Orders page */}
        <Tabs value={tab} onValueChange={(value) => setTab(value as OffersTab)}>
          <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 h-auto inline-flex gap-1 rounded-full border border-slate-200 dark:border-slate-700">
            {tabs.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="rounded-full px-6 py-2.5 font-bold text-sm transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
              >
                {t(`${k}tabs.${item.id}`)}
                {item.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tab === item.id
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
                    {item.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {offersQuery.isLoading ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-secondary-orange animate-spin" />
            <p className="text-sm font-bold text-slate-500 animate-pulse">{t("common.loading")}...</p>
          </div>
        ) : offersQuery.isError ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium text-red-500">
              {getErrorMessage(offersQuery.error, t("dashboard.offers.activation.loadFailed"))}
            </p>
            <button
              type="button"
              onClick={() => offersQuery.refetch()}
              className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t(`${k}retry`)}
            </button>
          </div>
        ) : tab === "active" ? (
          active.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 py-16 px-6 flex flex-col items-center text-center gap-4">
              <div className="size-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-secondary-orange">
                <Tag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">{t(`${k}emptyActive.title`)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{t(`${k}emptyActive.text`)}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dashboard/growth")}
                className="h-12 px-6 rounded-2xl bg-secondary-orange hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-secondary-orange/20 transition-all"
              >
                {t(`${k}emptyActive.cta`)}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {active.map((offer) => (
                <ActiveOfferCard
                  key={offer.offerId}
                  offer={offer}
                  showOutlet={allLocations}
                  busy={busyId === offer.offerId}
                  onTogglePause={togglePause}
                  onEndNow={setEndingOffer}
                />
              ))}
            </div>
          )
        ) : history.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 py-16 px-6 flex flex-col items-center text-center gap-4">
            <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <History className="w-8 h-8" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{t(`${k}emptyHistory`)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {history.slice(0, historyShown).map((offer) => (
                <OfferHistoryRow key={offer.offerId} offer={offer} showOutlet={allLocations} />
              ))}
            </div>
            {historyShown < history.length && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setHistoryShown((n) => n + HISTORY_PAGE_SIZE)}
                  className="h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t(`${k}showMore`)}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <EndOfferDialog
        offer={endingOffer}
        isLoading={endingOffer !== null && busyId === endingOffer.offerId}
        onConfirm={confirmEnd}
        onClose={() => setEndingOffer(null)}
      />
    </div>
  );
};
