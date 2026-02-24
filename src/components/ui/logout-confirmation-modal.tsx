import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasUnsavedChanges?: boolean;
}

export const LogoutConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  hasUnsavedChanges = false,
}: LogoutConfirmationModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-background-white mb-2">
          {t("onboarding.header.logout")}?
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          {hasUnsavedChanges
            ? t("common.unsavedChangesWarning")
            : t("common.logoutConfirmation")}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl dark:bg-slate-800 dark:text-background-white dark:border-slate-700 dark:hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-background-white rounded-xl"
          >
            {t("onboarding.header.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
};
