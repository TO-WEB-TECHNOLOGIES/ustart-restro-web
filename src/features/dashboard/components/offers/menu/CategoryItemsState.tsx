import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/utils/error";

/**
 * 2026-11-11: loading / error / empty states of one category's dish list on the offer pages, so
 * both pages word them the same. Returns null once there are dishes to show.
 */
interface CategoryItemsStateProps {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  onRetry: () => void;
}

export const CategoryItemsState = ({ isLoading, error, isEmpty, onRetry }: CategoryItemsStateProps) => {
  const { t } = useTranslation();
  const k = "dashboard.offers.offerMenu.";

  if (isLoading) {
    return (
      <div className="py-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin text-secondary-orange" />
        {t("common.loading")}...
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-4 flex items-center gap-3 text-sm">
        <span className="text-red-500">{getErrorMessage(error, t(`${k}itemsFailed`))}</span>
        <button type="button" onClick={onRetry} className="font-bold text-primary-blue dark:text-blue-300 hover:underline">
          {t(`${k}retry`)}
        </button>
      </div>
    );
  }
  if (isEmpty) {
    return <p className="py-4 text-sm text-slate-400 dark:text-slate-500">{t(`${k}noItems`)}</p>;
  }
  return null;
};
