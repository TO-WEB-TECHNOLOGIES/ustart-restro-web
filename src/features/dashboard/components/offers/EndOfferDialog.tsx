import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RestaurantOfferDTO } from "../../api/restaurantOffersApi";

/**
 * 2026-11-11: confirms "End now" on the My Offers page. Ending can't be undone (the backend refuses
 * to resume an ended offer), so it asks first. CLAUDE.local.md §3 suggests AlertDialog for this;
 * it isn't installed, so the existing shadcn Dialog is used (same Radix focus trap / Escape), with
 * closing blocked while the request is in flight - as in the offer review modals.
 */

interface EndOfferDialogProps {
  offer: RestaurantOfferDTO | null; // null = closed
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const EndOfferDialog = ({ offer, isLoading, onConfirm, onClose }: EndOfferDialogProps) => {
  const { t } = useTranslation();
  const k = "dashboard.offers.myOffers.endDialog.";

  return (
    <Dialog open={offer !== null} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent
        showCloseButton={!isLoading}
        className="sm:max-w-md rounded-[28px] p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      >
        <div className="space-y-2">
          <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">
            {t(`${k}title`, { promo: offer?.promoCode ?? "" })}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(`${k}description`)}
          </DialogDescription>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {t(`${k}cancel`)}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-70 flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t(`${k}confirm`)}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
