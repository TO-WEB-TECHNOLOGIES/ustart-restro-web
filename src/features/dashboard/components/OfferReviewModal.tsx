import React from "react";
import { useTranslation } from "react-i18next";
import { X, CheckCircle2, ShoppingCart, Calendar, Info, Tag, Users } from "lucide-react";
import type { FlatDealsFormValues } from "../outlets/growth/validations";

interface OfferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: FlatDealsFormValues;
  isSubmitting: boolean;
}

export const OfferReviewModal: React.FC<OfferReviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  isSubmitting,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getTargetCustomerLabel = (type: string) => {
    switch (type) {
      case 'all': return t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.allCustomers");
      case 'new': return t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.newCustomers");
      case 'returning': return t("dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.returningCustomers");
      default: return type;
    }
  };

  const calculateDuration = () => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 space-y-6">
          {/* Header Icon */}
          <div className="flex justify-center">
            <div className="size-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-secondary-orange shadow-sm">
              <Tag className="w-6 h-6" />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-bold text-[#1a2b4b] dark:text-white leading-tight">
              {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.title")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.subtitle")}
            </p>
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
                  <span className="text-4xl font-black text-[#1a2b4b] dark:text-white">₹{data.discountValue}</span>
                  <span className="text-3xl font-black text-secondary-orange">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.off")}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.flatDiscountHint")}</p>
              </div>

              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-orange-100 dark:border-orange-900/30 shadow-sm">
                  <Users className="w-4 h-4 text-secondary-orange" />
                  <span className="text-xs font-bold text-[#1a2b4b] dark:text-white">
                    {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.targetCustomers")}: {getTargetCustomerLabel(data.targetCustomer)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-center mb-1">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.minOrder")}</p>
              <p className="text-lg font-black text-[#1a2b4b] dark:text-white">₹{data.movType}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.cartValue")}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-center mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.durationUppercase")}</p>
              <p className="text-lg font-black text-[#1a2b4b] dark:text-white">{t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.daysCount", { count: calculateDuration() })}</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {new Date(data.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(data.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl p-4 flex gap-3 border border-yellow-100/50 dark:border-yellow-900/20">
            <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed text-yellow-700 dark:text-yellow-600">
                 <span className="font-bold">Note:</span> {t("dashboard.offers.customerDelightersDetails.flatDeals.note")}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button 
              onClick={onConfirm}
              disabled={isSubmitting}
              className="w-full h-14 bg-secondary-orange hover:bg-orange-500 disabled:opacity-70 text-white rounded-2xl font-bold shadow-lg shadow-secondary-orange/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t("common.processing")}...
                </>
              ) : (
                <>
                  {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.confirmBtn")}
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full h-10 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-sm"
            >
              {t("dashboard.offers.customerDelightersDetails.flatDeals.reviewDialog.cancelBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
