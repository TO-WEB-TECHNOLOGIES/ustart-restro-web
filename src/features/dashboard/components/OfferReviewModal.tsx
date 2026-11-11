import { useTranslation } from "react-i18next";
import { CheckCircle2, ShoppingCart, Calendar, Info, Tag, Users, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { offerDays, type ReviewDeal } from "./offerReview";

interface OfferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deal: ReviewDeal | null;
  startDate: Date;
  endDate: Date;
  isLoading?: boolean;
}

/**
 * Review dialog for a flat ₹ offer. 2026-11-02: moved from a hand-rolled overlay onto the shadcn
 * Dialog (CLAUDE.local.md §1), so it gets focus trap, Escape and a portal. Closing is blocked
 * while the activation is in flight.
 */
export const OfferReviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  deal,
  startDate,
  endDate,
  isLoading = false
}: OfferReviewModalProps) => {
  const { t, i18n } = useTranslation();

  if (!deal) return null;

  const formatDate = (date: Date) => date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent
        showCloseButton={!isLoading}
        className="sm:max-w-lg rounded-[32px] p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      >
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="size-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-secondary-orange shadow-sm">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center space-y-1">
          <DialogTitle className="text-2xl font-bold text-[#1a2b4b] dark:text-white leading-tight">
            {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.subtitle")}
          </DialogDescription>
        </div>

        {/* Main Offer Card */}
        <div className="bg-[#fffcf5] dark:bg-orange-900/10 rounded-[24px] p-6 relative border border-orange-100/50 dark:border-orange-500/10 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Tag className="w-20 h-20 -rotate-12" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-secondary-orange uppercase tracking-[0.2em]">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.offerDetails")}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-black text-[#1a2b4b] dark:text-white">₹{deal.discountValue}</span>
                <span className="text-3xl font-black text-secondary-orange">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.off")}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.flatDiscountHint")}</p>
            </div>
            {deal.targetCustomers && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-orange-100 dark:border-orange-900/30 shadow-sm">
                  <Users className="w-4 h-4 text-secondary-orange" />
                  <span className="text-xs font-bold text-[#1a2b4b] dark:text-white">
                    {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.targetCustomers")}: {deal.targetCustomers}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-center mb-1">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.minOrder")}</p>
            <p className="text-lg font-black text-[#1a2b4b] dark:text-white">₹{deal.minOrderAmount}</p>
            <p className="text-[10px] text-slate-400 font-medium">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.cartValue")}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-center mb-1">
              <Calendar className="text-slate-400 w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.durationUppercase")}</p>
            <p className="text-lg font-black text-[#1a2b4b] dark:text-white">{t("dashboard.offers.activation.daysCount", { count: offerDays(startDate, endDate) })}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl p-4 flex gap-3 border border-yellow-100/50 dark:border-yellow-900/20">
          <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium leading-relaxed text-yellow-700 dark:text-yellow-600">
            <span className="font-bold">{t("dashboard.offers.activation.noteLabel")}</span> {t("dashboard.offers.customerDelightersDetails.flatDeals.note")}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full h-14 bg-secondary-orange hover:bg-orange-500 disabled:opacity-70 text-white rounded-2xl font-bold shadow-lg shadow-secondary-orange/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("common.processing")}...
              </>
            ) : (
              <>
                {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.confirmBtn")}
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
          {!isLoading && (
            <button
              onClick={onClose}
              className="w-full h-10 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-sm"
            >
              {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.cancelBtn")}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
