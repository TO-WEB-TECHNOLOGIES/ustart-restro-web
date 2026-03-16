import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lightbulb, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OfferSupportSidebar } from "../../components/OfferSupportSidebar";
import { PercentageDiscountReviewModal } from "../../components/PercentageDiscountReviewModal";
import { OfferReviewModal } from "../../components/OfferReviewModal";
import { offersApi } from "../../api/offersApi";

type TabValues = "percentage" | "flat";
interface Deal {
  id: string;
  promo: string;
  desc: string;
  popular?: boolean;
}

export const DealOfTheDay = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValues>("percentage");
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [dealsInfo, setDealsInfo] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const currentDeal = dealsInfo.find(d => d.id === selectedDeal) || null;

  const handleConfirmActivation = async () => {
    setIsActivating(true);
    const promise = new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.promise(promise, {
      loading: 'Activating your Deal of the Day...',
      success: () => {
        setTimeout(() => {
          setIsActivating(false);
          setShowReviewModal(false);
          navigate("..");
        }, 500);
        return 'Deal activated successfully!';
      },
      error: 'Failed to activate deal.',
    });

    try {
      await promise;
    } catch (e) {
      setIsActivating(false);
    }
  };

  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true);
      try {
        const data = await offersApi.getDayDeals(activeTab, i18n.language.split('-')[0]);
        setDealsInfo(data);
        // Find popular deal to set as default if none selected or if switching tabs
        const popular = data.find(d => d.popular);
        setSelectedDeal(popular ? popular.id : (data[0]?.id || null));
      } catch (error) {
        console.error("Failed to fetch deals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [activeTab, i18n.language]);

  const learningCenterItems = [1, 2, 3].map((i) => ({
    question: t(`dashboard.offers.customerDelightersDetails.dotd.configure.learningCenter.q${i}`),
  }));

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-[#fdfbf7] dark:bg-slate-950 p-4 md:p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content */}
        <div className="flex-1 w-full space-y-8 mb-10 lg:mb-0">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Link
              to=".."
              relative="path"
              className="mt-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#1a2b4b] dark:text-white pb-1">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.title")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.subtitle")}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 xl:mb-12">
            {/* Tabs */}
            <div className="flex items-center gap-6 sm:gap-10 border-b border-slate-100 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                onClick={() => setActiveTab("percentage")}
                className={`pb-4 text-sm font-bold transition-colors relative ${
                  activeTab === "percentage"
                    ? "text-[#1a2b4b] dark:text-white"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.tabs.percentageDiscount")}
                {activeTab === "percentage" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-400 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("flat")}
                className={`pb-4 text-sm transition-colors relative ${
                  activeTab === "flat"
                    ? "font-bold text-[#1a2b4b] dark:text-white"
                    : "font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.tabs.flatOff")}
                {activeTab === "flat" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-400 rounded-t-full"></div>
                )}
              </button>

            </div>

            {/* Tip Box */}
            <div className="bg-[#fffdf5] dark:bg-yellow-900/10 rounded-xl p-4 flex gap-3 text-[#d97706] dark:text-yellow-600 mb-8 items-center border border-yellow-100/50 dark:border-yellow-900/20">
              <Lightbulb className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.tip")}
              </p>
            </div>

            {/* Deals Selection */}
            <div className="space-y-4 min-h-[300px] relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-2xl z-10 transition-all duration-300">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-secondary-orange animate-spin" />
                    <p className="text-sm font-bold text-slate-500 animate-pulse">{t("common.loading")}...</p>
                  </div>
                </div>
              ) : null}

              <div className={`${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 space-y-4`}>
                {dealsInfo.map((deal) => (
                  <label
                    key={deal.id}
                    className={`flex flex-col sm:flex-row gap-4 p-5 sm:p-6 border rounded-2xl cursor-pointer transition-all ${
                      selectedDeal === deal.id
                        ? "border-secondary-orange bg-orange-50/30 dark:bg-orange-900/10"
                        : "border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="pt-0.5">
                        <div
                          className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedDeal === deal.id
                              ? "border-secondary-orange"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedDeal === deal.id && (
                            <div className="size-2.5 rounded-full bg-secondary-orange"></div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[15px] sm:text-base text-[#1a2b4b] dark:text-white tracking-wide flex items-center gap-3">
                          {deal.promo}
                          {deal.popular && (
                            <span className="bg-secondary-orange text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded shadow-sm opacity-90 uppercase">
                              {t("dashboard.offers.customerDelightersDetails.dotd.configure.tabs.popular")}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-snug">
                          {deal.desc}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                       <input 
                         type="radio" 
                         name="deal" 
                         value={deal.id} 
                         checked={selectedDeal === deal.id} 
                         onChange={() => setSelectedDeal(deal.id)} 
                         className="sr-only" 
                       />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Preveiw Button */}
            <div className="mt-10 pt-4">
              <button
                type="button"
                disabled={!selectedDeal || isLoading}
                onClick={() => setShowReviewModal(true)}
                className="w-full bg-secondary-orange hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-[15px] h-14 rounded-2xl transition-all shadow-lg shadow-secondary-orange/20"
              >
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.previewBtn")}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <OfferSupportSidebar
          learningCenterTitle={t("dashboard.offers.customerDelightersDetails.dotd.configure.learningCenter.title")}
          learningCenterItems={learningCenterItems}
          helpTitle={t("dashboard.offers.customerDelightersDetails.dotd.configure.help.title")}
          helpText={t("dashboard.offers.customerDelightersDetails.dotd.configure.help.text")}
          chatLabel={t("dashboard.offers.customerDelightersDetails.dotd.configure.help.chat")}
        />
      </div>

      {activeTab === "percentage" ? (
        <PercentageDiscountReviewModal 
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmActivation}
          deal={currentDeal}
          startDate={new Date()}
          endDate={new Date()}
          isLoading={isActivating}
        />
      ) : (
        <OfferReviewModal 
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmActivation}
          deal={currentDeal}
          startDate={new Date()}
          endDate={new Date()}
          isLoading={isActivating}
        />
      )}
    </div>
  );
};
