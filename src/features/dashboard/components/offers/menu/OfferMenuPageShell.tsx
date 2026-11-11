import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { getErrorMessage } from "@/utils/error";
import type { Category } from "@/types/menuTypes";
import { useOfferMenuCategories } from "../../../hooks/useOfferMenu";

/**
 * 2026-11-11: page frame shared by the BOGO and Item Level Discount pages: back link + title like
 * the other growth screens, the "pick one outlet" state (both pages are per outlet: BOGO coverage
 * and dish prices differ by outlet), the category load states, and a save bar that sticks to the bottom of the content column.
 * children gets the loaded categories.
 */
interface OfferMenuPageShellProps {
  title: string;
  subtitle: string;
  needsOutlet: boolean; // true while "All Locations" is selected
  banner?: ReactNode;
  footer?: ReactNode;
  children: (categories: Category[]) => ReactNode;
}

export const OfferMenuPageShell = ({ title, subtitle, needsOutlet, banner, footer, children }: OfferMenuPageShellProps) => {
  const { t } = useTranslation();
  const k = "dashboard.offers.offerMenu.";
  const categoriesQuery = useOfferMenuCategories();

  let body: ReactNode;
  if (needsOutlet) {
    body = (
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 py-16 px-6 flex flex-col items-center text-center gap-4">
        <div className="size-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-secondary-orange">
          <Store className="w-8 h-8" />
        </div>
        <p className="text-lg font-bold text-[#1a2b4b] dark:text-white">{t(`${k}outletRequired.title`)}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{t(`${k}outletRequired.text`)}</p>
      </div>
    );
  } else if (categoriesQuery.isLoading) {
    body = (
      <div className="py-24 flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 text-secondary-orange animate-spin" />
        <p className="text-sm font-bold text-slate-500 animate-pulse">{t("common.loading")}...</p>
      </div>
    );
  } else if (categoriesQuery.isError) {
    body = (
      <div className="py-24 flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium text-red-500">{getErrorMessage(categoriesQuery.error, t(`${k}menuFailed`))}</p>
        <button
          type="button"
          onClick={() => categoriesQuery.refetch()}
          className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t(`${k}retry`)}
        </button>
      </div>
    );
  } else if ((categoriesQuery.data ?? []).length === 0) {
    body = <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">{t(`${k}noCategories`)}</p>;
  } else {
    body = children(categoriesQuery.data ?? []);
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-[#fdfbf7] dark:bg-slate-950 p-4 md:p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <Link
            to=".."
            relative="path"
            className="mt-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
            aria-label={t(`${k}back`)}
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary-blue dark:text-white">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
          </div>
        </div>
        {!needsOutlet && banner}
        {body}
        {/* Sticky inside the content column (not fixed), so it never covers the sidebar. */}
        {!needsOutlet && footer && (
          <div className="sticky bottom-4 z-20 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
