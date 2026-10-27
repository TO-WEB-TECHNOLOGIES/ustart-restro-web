import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EyeOff, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { AddonGroup } from "../../api/addonLibraryApi";
import { useAddonGroupMutations } from "../../hooks/useAddonLibrary";
import { AddonGroupDialog } from "./AddonGroupDialog";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

/**
 * 2026-10-27: add-on groups of the brand (left column of the add-on library). Brand users add /
 * edit / delete groups here; outlet users only pick.
 * Styled after the menu editor's CategorySidebar (product feedback: same look) - mobile header
 * with close, "Groups (n)" + bordered add button, search box, rows with the blue left border when
 * selected and actions on hover. Edit / delete are two hover icons instead of CategorySidebar's
 * hand-rolled dropdown (no shadcn DropdownMenu installed yet, and groups have only two actions).
 */
interface AddonGroupSidebarProps {
  groups: AddonGroup[];
  selectedId: number | null;
  canManage: boolean;
  isCollapsed: boolean;
  onSelect: (groupId: number | null) => void;
  onClose: () => void;
}

const K = "dashboard.addonLibrary.";

export const AddonGroupSidebar = ({
  groups,
  selectedId,
  canManage,
  isCollapsed,
  onSelect,
  onClose,
}: AddonGroupSidebarProps) => {
  const { t } = useTranslation();
  const { remove } = useAddonGroupMutations();
  // undefined = dialog closed, null = creating, a group = editing it.
  const [editing, setEditing] = useState<AddonGroup | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AddonGroup | null>(null);
  const [search, setSearch] = useState("");

  const shown = groups.filter((g) => g.categoryName.toLowerCase().includes(search.trim().toLowerCase()));

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.addOnId);
      toast.success(t(`${K}group.deleted`, { name: deleting.categoryName }));
      if (selectedId === deleting.addOnId) onSelect(null);
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t(`${K}group.deleteFailed`)));
    }
  };

  return (
    <div
      className={`w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-opacity duration-200 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Mobile header with close */}
      <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t(`${K}groupsTitle`)}</span>
        <button
          onClick={onClose}
          aria-label={t(`${K}cancel`)}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Count + add group */}
      <div className="p-6 px-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-around gap-2">
        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
          {t(`${K}groupsTitle`)} ({groups.length})
        </h3>
        {canManage && (
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 text-[var(--color-primary-blue)] dark:text-blue-400 text-xs font-black uppercase tracking-wider py-2.5 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t(`${K}addGroup`)}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t(`${K}searchGroups`)}
            aria-label={t(`${K}searchGroups`)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[var(--color-primary-blue)] transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {shown.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-xs text-slate-400 font-medium italic">{t(`${K}noGroups`)}</p>
          </div>
        ) : (
          shown.map((group) => {
            const isSelected = group.addOnId === selectedId;
            return (
              <div
                key={group.addOnId}
                onClick={() => {
                  onSelect(group.addOnId);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-50/50 dark:bg-blue-600/20 border-l-4 border-[var(--color-primary-blue)]"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent"
                } ${!group.isActive ? "opacity-50 grayscale-[0.5]" : ""}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {!group.isActive && <EyeOff className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                  <div className="min-w-0">
                    <span
                      className={`block text-sm font-bold truncate ${isSelected ? "text-[var(--color-primary-blue)] dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      {group.categoryName}
                    </span>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t(`${K}selectionRule`, {
                        min: group.minCustomizationSelection,
                        max: group.maxCustomizationSelection,
                      })}
                    </span>
                  </div>
                </div>
                {/* Actions: always shown on touch screens (no hover there); on hover from md up. */}
                {canManage && (
                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(group);
                      }}
                      title={t(`${K}group.edit`)}
                      aria-label={t(`${K}group.edit`)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(group);
                      }}
                      title={t(`${K}group.delete`)}
                      aria-label={t(`${K}group.delete`)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AddonGroupDialog
        open={editing !== undefined}
        group={editing ?? null}
        onOpenChange={(open) => !open && setEditing(undefined)}
        onSaved={(saved) => onSelect(saved.addOnId)}
      />
      <ConfirmDeleteDialog
        open={deleting !== null}
        title={t(`${K}group.deleteTitle`, { name: deleting?.categoryName ?? "" })}
        description={t(`${K}group.deleteDescription`)}
        isPending={remove.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
};
