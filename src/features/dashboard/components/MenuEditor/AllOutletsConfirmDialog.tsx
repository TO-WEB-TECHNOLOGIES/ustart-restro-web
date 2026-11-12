import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * 2026-11-11: "this changes every outlet" confirmation for saves made under "All Locations" (stock
 * switch, category stock switch, price edit). shadcn Dialog; replaces the hand-rolled Modal the
 * stock switch used. Closing is blocked while the save runs.
 * 2026-11-12: optional confirmLabel / cancelLabel so the outlet status confirmations (pause, end a
 * holiday) reuse this dialog instead of a copy; the defaults keep the menu editor's wording.
 */
interface AllOutletsConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  isLoading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const AllOutletsConfirmDialog = ({ open, title, description, isLoading = false, confirmLabel, cancelLabel, onConfirm, onClose }: AllOutletsConfirmDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !isLoading) onClose(); }}>
      <DialogContent showCloseButton={!isLoading} className="sm:max-w-md rounded-[28px] p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">{title}</DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{description}</DialogDescription>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {cancelLabel ?? t("dashboard.menuEditor.outletSave.cancel")}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-[var(--color-primary-blue)] hover:opacity-90 text-white text-sm font-bold disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel ?? t("dashboard.menuEditor.outletSave.confirmAll")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
