import { useTranslation } from "react-i18next";
import { X, Calendar, Info, Loader2 } from "lucide-react";

interface Deal {
  id: string;
  promo: string;
  desc: string;
  popular?: boolean;
  discountValue?: number;
  minOrderAmount?: number;
  capOfDiscountAmount?: number;
  isAbsolute?: boolean;
  targetCustomers?: string;
}

interface PercentageDiscountReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deal: Deal | null;
  startDate: Date;
  endDate: Date;
  isLoading?: boolean;
}

export const PercentageDiscountReviewModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  deal,
  startDate,
  endDate,
  isLoading = false
}: PercentageDiscountReviewModalProps) => {
  const { t, i18n } = useTranslation();

  if (!isOpen || !deal) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysCount = calculateDays(startDate, endDate);
  const discountDisplay = deal.isAbsolute ? `${deal.discountValue}%` : `₹${deal.discountValue}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F2441]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={isLoading ? undefined : onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-800">
          <h2 className="text-xl font-bold text-[#1a2b4b] dark:text-white">
            {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.title")}
          </h2>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Highlight Card */}
          <div className="bg-[#fdfbf7] dark:bg-slate-950 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/20">
            <div className="flex items-start justify-between">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.promoCode")}
                  </p>
                  <p className="text-xl font-black text-secondary-orange tracking-tight uppercase">
                    {deal.promo}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.targeting")}
                  </p>
                  <div className="inline-flex px-4 py-1.5 rounded-full bg-orange-100/50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20">
                    <p className="text-sm font-bold text-secondary-orange">
                      {deal.targetCustomers}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-secondary-orange text-white px-6 py-4 rounded-2xl shadow-lg shadow-secondary-orange/20">
                  <span className="text-3xl font-black">{discountDisplay}</span>
                  <span className="text-sm font-bold block text-center uppercase tracking-tighter">Off</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.minOrder")}
              </p>
              <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">₹{deal.minOrderAmount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.maxDiscount")}
              </p>
              <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">₹{deal.capOfDiscountAmount || deal.minOrderAmount}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.duration")}
              </p>
              <div className="flex items-center gap-3">
                <Calendar className="text-secondary-orange w-5 h-5" />
                <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">
                  {formatDate(startDate)} - {formatDate(endDate)} 
                  <span className="text-slate-400 font-medium text-sm ml-2">({daysCount === 0 || isNaN(daysCount) ? 1 : daysCount} {daysCount <= 1 ? 'Day' : 'Days'})</span>
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex gap-3 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <Info className="text-slate-400 w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.infoText")}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-4">
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full bg-secondary-orange hover:bg-orange-500 disabled:opacity-70 disabled:hover:bg-secondary-orange text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary-orange/30 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.confirmBtn")}
            </button>
            {!isLoading && (
              <button 
                onClick={onClose}
                className="w-full text-slate-500 dark:text-slate-400 font-bold py-2 text-sm hover:text-[#1a2b4b] dark:hover:text-white transition-colors"
              >
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.backBtn")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
