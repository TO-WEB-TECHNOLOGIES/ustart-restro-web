import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Menu, PanelLeftClose, PanelLeftOpen, Puzzle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAddonGroups } from "../../hooks/useAddonLibrary";
import { AddonGroupSidebar } from "../../components/AddonLibrary/AddonGroupSidebar";
import { AddonList } from "../../components/AddonLibrary/AddonList";
import { useAddonLibraryPaths } from "../../components/AddonLibrary/paths";

/**
 * 2026-10-27: the brand's add-on library (/dashboard/menu/addons, and during onboarding
 * /grow-with-ustart/upload-menu/addons) - rebuilt from scratch in place of AddonEditor.
 * Add-on groups on the left, the selected group's add-ons on the right.
 * - Brand-level users manage groups and add-ons with their DEFAULT price/availability. No outlet
 *   or dish here: dish links live in the dish form, outlet/dish prices on /allocation.
 * - Outlet-level users see it read-only, plus an in-stock box for their own outlet.
 * The selected group is in the URL (?group=) so returning from the add-on form keeps it.
 * 2026-10-27 (product feedback "should look the same as the menu editor"): the shell copies
 * MenuEditor's - top bar, collapsible w-72 sidebar with the edge toggle, mobile slide-in with a
 * backdrop and a floating open button.
 */
export const AddonLibrary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { menu, pageHeight } = useAddonLibraryPaths();
  // Outlet-level tokens carry restroId (backend guarantee since 2026-10-19).
  const canManage = !user?.restroId;
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { data: groups = [], isLoading, isError } = useAddonGroups();

  const requested = Number(searchParams.get("group"));
  // Fall back to the first group when none (or a deleted one) is in the URL.
  const selected = groups.find((g) => g.addOnId === requested) ?? groups[0] ?? null;

  const select = (groupId: number | null) =>
    setSearchParams(groupId === null ? {} : { group: String(groupId) }, { replace: true });

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${pageHeight} bg-slate-50 dark:bg-slate-950`}>
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-blue)] mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-bold">{t("dashboard.addonLibrary.loading")}</p>
      </div>
    );
  }

  return (
    // Explicit height (see paths.ts): h-full collapsed to the content, leaving the page half-empty.
    <div className={`flex flex-col w-full ${pageHeight} bg-slate-50 dark:bg-slate-950 relative overflow-hidden`}>
      {/* Mobile sidebar toggle (same as MenuEditor) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        aria-label={t("dashboard.addonLibrary.groupsTitle")}
        className={`md:hidden fixed bottom-6 right-6 z-50 p-4 bg-[var(--color-primary-blue)] text-white rounded-full shadow-lg transition-transform active:scale-90 ${isSidebarOpen ? "scale-0" : "scale-100"}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Top bar - MenuTabs' bar; add-ons save per form, so no submit button here */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 py-4 text-xs md:text-sm font-bold text-[var(--color-primary-blue)] dark:text-white">
          <Puzzle className="w-4 h-4" />
          {t("dashboard.addonLibrary.title")}
        </div>
        <button
          onClick={() => navigate(menu)}
          className="flex items-center gap-2 py-2 text-[var(--color-primary-blue)] dark:text-blue-400 text-sm font-bold hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("dashboard.addonLibrary.backToMenu")}</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-40 md:z-40
            transition-all duration-300 ease-in-out transform
            ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:w-0"}
            bg-white dark:bg-slate-900 shadow-xl md:shadow-none
          `}
        >
          <AddonGroupSidebar
            groups={groups}
            selectedId={selected?.addOnId ?? null}
            canManage={canManage}
            isCollapsed={!isSidebarOpen}
            onSelect={select}
            onClose={() => setIsSidebarOpen(false)}
          />
          {/* Desktop toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={t("dashboard.addonLibrary.groupsTitle")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-400 hover:text-[var(--color-primary-blue)] transition-all transform hover:scale-105 active:scale-95"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 h-full">
          {isError ? (
            <p role="alert" className="p-8 text-sm font-medium text-red-600 dark:text-red-400">
              {t("dashboard.addonLibrary.loadFailed")}
            </p>
          ) : selected ? (
            // key: a different group starts with a fresh search box.
            <AddonList
              key={selected.addOnId}
              group={selected}
              canManage={canManage}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          ) : (
            // Same empty state as MenuItemList's "no category selected".
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fdfdfd] dark:bg-slate-950">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Puzzle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                {t("dashboard.addonLibrary.title")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                {canManage ? t("dashboard.addonLibrary.startHint") : t("dashboard.addonLibrary.noGroups")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
