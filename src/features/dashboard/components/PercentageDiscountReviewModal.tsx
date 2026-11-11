import { useTranslation } from "react-i18next";
import { Calendar, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { offerDays, type ReviewDeal } from "./offerReview";

interface PercentageDiscountReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deal: ReviewDeal | null;
  startDate: Date;
  endDate: Date;
  isLoading?: boolean;
}

/**
 * Review dialog for a percentage offer (also used for Deal of the Day). 2026-11-02: on the shadcn
 * Dialog (CLAUDE.local.md §1); isAbsolute now uses the backend's meaning (true = flat ₹), it was
 * inverted before; the "Off" / day labels go through i18n.
 */
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

  if (!deal) return null;

  const formatDate = (date: Date) => date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  const discountDisplay = deal.isAbsolute ? `₹${deal.discountValue}` : `${deal.discountValue}%`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent
        showCloseButton={!isLoading}
        className="sm:max-w-xl rounded-[28px] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800">
          <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">
            {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">{deal.desc}</DialogDescription>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Highlight Card */}
          <div className="bg-background-white dark:bg-slate-950 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/20">
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
                {deal.targetCustomers && (
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
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-secondary-orange text-white px-6 py-4 rounded-2xl shadow-lg shadow-secondary-orange/20">
                  <span className="text-3xl font-black">{discountDisplay}</span>
                  <span className="text-sm font-bold block text-center uppercase tracking-tighter">{t("dashboard.offers.activation.off")}</span>
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
            {/* A flat deal has no cap; the max saving is the flat amount itself. */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.maxDiscount")}
              </p>
              <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">
                ₹{deal.isAbsolute ? deal.discountValue : (deal.capOfDiscountAmount || deal.minOrderAmount)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {t("dashboard.offers.customerDelightersDetails.dotd.configure.reviewModal.duration")}
              </p>
              <div className="flex items-center gap-3">
                <Calendar className="text-secondary-orange w-5 h-5" />
                <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">
                  {formatDate(startDate)} - {formatDate(endDate)}
                  <span className="text-slate-400 font-medium text-sm ml-2">({t("dashboard.offers.activation.daysCount", { count: offerDays(startDate, endDate) })})</span>
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
      </DialogContent>
    </Dialog>
  );
};
