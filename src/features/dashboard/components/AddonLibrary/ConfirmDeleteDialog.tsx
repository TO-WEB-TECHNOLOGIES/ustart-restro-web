import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * 2026-10-27: confirmation before deleting an add-on group or add-on (add-on library page).
 * shadcn Dialog, not window.confirm (CLAUDE.local.md §3). The caller runs the delete and closes it.
 */
interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  description: string;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export const ConfirmDeleteDialog = ({
  open,
  title,
  description,
  isPending,
  onConfirm,
  onOpenChange,
}: ConfirmDeleteDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{title}</DialogTitle>
          <DialogDescription className="dark:text-slate-400">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="dark:hover:bg-slate-800 dark:text-slate-300"
          >
            {t("dashboard.addonLibrary.cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {t("dashboard.addonLibrary.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
