import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Layout, Loader2, Plus, Puzzle, Search } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { Addon, AddonGroup } from "../../api/addonLibraryApi";
import { useAddonMutations, useGroupAddons } from "../../hooks/useAddonLibrary";
import { AddonCard } from "./AddonCard";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useAddonLibraryPaths } from "./paths";

/**
 * 2026-10-27: the add-ons of the selected group (right column of the add-on library). Add / Edit
 * open the full-page form (product decision); delete and the outlet stock box save immediately.
 * Styled after the menu editor's MenuItemList (product feedback: same look) - action bar with
 * search and the add button, big title with count, the same dashed empty state, one card per row.
 */
interface AddonListProps {
  group: AddonGroup;
  canManage: boolean;
  onOpenSidebar: () => void;
}

const K = "dashboard.addonLibrary.";

export const AddonList = ({ group, canManage, onOpenSidebar }: AddonListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { library } = useAddonLibraryPaths();
  const { data: addons = [], isLoading, isError } = useGroupAddons(group.addOnId);
  const { remove, setStock } = useAddonMutations();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Addon | null>(null);

  const shown = addons.filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase()));

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.variantId);
      toast.success(t(`${K}deleted`, { name: deleting.name }));
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t(`${K}deleteFailed`)));
    }
  };

  const changeStock = async (addon: Addon, isAvailable: boolean) => {
    try {
      await setStock.mutateAsync({ addonId: addon.variantId, isAvailable });
    } catch (err) {
      toast.error(getErrorMessage(err, t(`${K}stockFailed`)));
    }
  };

  const addNew = () => navigate(`${library}/new?group=${group.addOnId}`);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fdfdfd] dark:bg-slate-950 overflow-hidden">
      {/* Action bar */}
      <div className="px-4 md:px-8 py-4 shrink-0 z-30 border-b md:border-none border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
            <button
              onClick={onOpenSidebar}
              aria-label={t(`${K}groupsTitle`)}
              className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
            >
              <Layout className="w-5 h-5" />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t(`${K}searchPlaceholder`)}
                aria-label={t(`${K}searchPlaceholder`)}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={addNew}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white text-sm font-black px-4 md:px-6 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                <Plus className="w-5 h-5 shrink-0" />
                <span className="truncate">{t(`${K}addAddon`)}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 md:px-8 py-4">
          {/* Group title + rule */}
          <div className="mb-6 md:mb-8 flex flex-col">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
              <span className="truncate">{group.categoryName}</span>
              <span className="text-lg md:text-xl font-bold text-slate-400 dark:text-slate-500 shrink-0">
                ({addons.length})
              </span>
            </h2>
            <p className="text-sm md:text-base mt-2 text-slate-500 dark:text-slate-400">
              {t(`${K}selectionRule`, { min: group.minCustomizationSelection, max: group.maxCustomizationSelection })}
              {" · "}
              {group.minCustomizationSelection > 0
                ? t("dashboard.menuEditor.customizations.mandatory")
                : t("dashboard.menuEditor.customizations.optional")}
            </p>
            {!canManage && <p className="text-xs mt-2 text-slate-500 dark:text-slate-400">{t(`${K}outletNote`)}</p>}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-blue)] mb-4" />
              <p className="text-slate-400 font-medium text-sm">{t(`${K}loading`)}</p>
            </div>
          ) : isError ? (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {t(`${K}loadFailed`)}
            </p>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-[32px] md:rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                <Puzzle className="w-6 h-6 md:w-8 md:h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white mb-2 text-center px-4">
                {addons.length === 0 ? t(`${K}emptyGroup`) : t(`${K}noMatches`)}
              </h3>
              {canManage && addons.length === 0 && (
                <button
                  onClick={addNew}
                  className="mt-4 flex items-center gap-2 bg-[var(--color-primary-blue)] text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-[#1a3a5f] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {t(`${K}addAddon`)}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:gap-4 w-full pb-8">
              {shown.map((addon) => (
                <AddonCard
                  key={addon.variantId}
                  addon={addon}
                  canManage={canManage}
                  isStockPending={setStock.isPending && setStock.variables?.addonId === addon.variantId}
                  onEdit={() => navigate(`${library}/new?edit=${addon.variantId}`)}
                  onDelete={() => setDeleting(addon)}
                  onStockChange={(isAvailable) => changeStock(addon, isAvailable)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={deleting !== null}
        title={t(`${K}deleteTitle`, { name: deleting?.name ?? "" })}
        description={t(`${K}deleteDescription`)}
        isPending={remove.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
};
