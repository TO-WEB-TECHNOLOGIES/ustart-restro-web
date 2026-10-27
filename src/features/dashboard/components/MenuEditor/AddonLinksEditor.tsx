import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/utils/error";
import { fetchGroupAddons } from "../../api/addonLibraryApi";
import { type AddonGroupLinkDraft, type AddonLinkDraft, newGroupLink } from "../../api/addonLinks";
import { useAddonGroups } from "../../hooks/useAddonLibrary";
import { FoodTypeMarker } from "./MenuItemCard";

/**
 * 2026-10-27: the "Add-ons" section of one row (item or variant) in the customization panel,
 * below its customization categories. Purely controlled - the panel owns the drafts, saves them
 * with its own Save, and confirms copies.
 * - "Add add-on group" links one of the brand's groups; all its add-ons start offered, at their
 *   default price.
 * - Each add-on: offered on this dish (tick) and its price here - one price for every outlet
 *   (product decision). A price equal to the default is no special price.
 * - Copy: a variant copies from the base item, the base item from another item of its category
 *   (links + special prices); the panel asks before replacing.
 */
export interface CopySource {
  id: number;
  label: string;
}

interface AddonLinksEditorProps {
  rowKey: number;
  links: AddonGroupLinkDraft[];
  onChange: (links: AddonGroupLinkDraft[]) => void;
  /** Variant tabs: copy the base item's add-ons. */
  onCopyFromBase?: () => void;
  /** Base item tab: other items of the category to copy from. */
  copySources?: CopySource[];
  onCopyFrom?: (itemId: number) => void;
  isCopying: boolean;
}

const K = "dashboard.menuEditor.customizations.addOns.";
const HEADING = "text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500";
const SELECT =
  "h-9 w-full sm:w-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-white";

export const AddonLinksEditor = ({
  rowKey,
  links,
  onChange,
  onCopyFromBase,
  copySources,
  onCopyFrom,
  isCopying,
}: AddonLinksEditorProps) => {
  const { t } = useTranslation();
  const { data: groups = [], isLoading: isLoadingGroups } = useAddonGroups();
  const [isLinking, setIsLinking] = useState(false);

  const linkedIds = new Set(links.map((g) => g.groupId));
  const unlinked = groups.filter((g) => !linkedIds.has(g.addOnId));

  const updateAddOn = (groupIndex: number, variantId: number, patch: Partial<AddonLinkDraft>) =>
    onChange(
      links.map((group, i) =>
        i === groupIndex
          ? { ...group, addOns: group.addOns.map((a) => (a.variantId === variantId ? { ...a, ...patch } : a)) }
          : group,
      ),
    );

  const linkGroup = async (groupId: number) => {
    const group = groups.find((g) => g.addOnId === groupId);
    if (!group) return;
    setIsLinking(true);
    try {
      onChange([...links, newGroupLink(group, await fetchGroupAddons(groupId))]);
    } catch (err) {
      toast.error(getErrorMessage(err, t(`${K}linkFailed`)));
    } finally {
      setIsLinking(false);
    }
  };

  // Typed price: empty or equal to the default = no special price for this dish.
  const priceFrom = (raw: string, addOn: AddonLinkDraft): number | null => {
    if (raw === "") return null;
    const value = Number(raw);
    return value === addOn.defaultPrice ? null : value;
  };

  return (
    <section className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{t(`${K}title`)}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${K}subtitle`)}</p>
        </div>
        {onCopyFromBase && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCopying}
            onClick={onCopyFromBase}
            className="dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            {isCopying ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Copy className="w-4 h-4 mr-1" />}
            {t(`${K}copyFromBase`)}
          </Button>
        )}
        {copySources && onCopyFrom && (
          <div className="flex items-center gap-2">
            {isCopying && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {/* Resets to the placeholder after each pick, so the same item can be picked again. */}
            <select
              aria-label={t(`${K}copyFrom`)}
              className={SELECT}
              value=""
              disabled={isCopying || copySources.length === 0}
              onChange={(e) => e.target.value && onCopyFrom(Number(e.target.value))}
            >
              <option value="">{copySources.length ? t(`${K}copyFrom`) : t(`${K}noCopySources`)}</option>
              {copySources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {links.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${K}none`)}</p>}

      {links.map((group, groupIndex) => (
        <div
          key={group.groupId}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{group.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("dashboard.addonLibrary.selectionRule", { min: group.minSelection, max: group.maxSelection })}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(links.filter((_, i) => i !== groupIndex))}
              title={t(`${K}unlink`)}
              aria-label={t(`${K}unlink`)}
              className="text-slate-400 hover:text-red-600 dark:hover:bg-slate-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {group.addOns.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${K}emptyGroup`)}</p>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[2rem_minmax(0,1fr)_8rem] gap-x-3 px-1">
                <span className={HEADING}>{t(`${K}offered`)}</span>
                <span className={HEADING}>{t(`${K}addOn`)}</span>
                <span className={HEADING}>{t(`${K}priceHere`)}</span>
              </div>
              {group.addOns.map((addOn) => {
                const inputId = `${rowKey}-${group.groupId}-${addOn.variantId}`;
                return (
                  <div
                    key={addOn.variantId}
                    className={`grid grid-cols-[2rem_minmax(0,1fr)_8rem] items-center gap-x-3 rounded-xl px-1 py-1 ${
                      addOn.isOffInLibrary || !addOn.isOffered ? "opacity-60" : ""
                    }`}
                  >
                    <Checkbox
                      checked={addOn.isOffered}
                      disabled={addOn.isOffInLibrary}
                      aria-label={t(`${K}offered`)}
                      onCheckedChange={(v) => updateAddOn(groupIndex, addOn.variantId, { isOffered: v === true })}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FoodTypeMarker type={addOn.foodType} />
                        <label htmlFor={inputId} className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {addOn.name}
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {addOn.isOffInLibrary
                          ? t(`${K}offInLibrary`)
                          : t(`${K}defaultPrice`, { price: addOn.defaultPrice })}
                        {addOn.price !== null && !addOn.isOffInLibrary && (
                          <>
                            {" · "}
                            <button
                              type="button"
                              onClick={() => updateAddOn(groupIndex, addOn.variantId, { price: null })}
                              className="font-semibold text-[var(--color-primary-blue)] dark:text-blue-400 hover:underline"
                            >
                              {t(`${K}resetPrice`)}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                      <Input
                        id={inputId}
                        type="number"
                        min={0}
                        disabled={addOn.isOffInLibrary || !addOn.isOffered}
                        value={addOn.price ?? addOn.defaultPrice}
                        onChange={(e) =>
                          updateAddOn(groupIndex, addOn.variantId, { price: priceFrom(e.target.value, addOn) })
                        }
                        className={`pl-7 dark:bg-slate-950 dark:border-slate-700 dark:text-white ${
                          addOn.price !== null ? "border-[var(--color-primary-blue)] font-bold" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ))}

      {/* Link another group */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={t(`${K}addGroup`)}
          className={SELECT}
          value=""
          disabled={isLinking || isLoadingGroups || unlinked.length === 0}
          onChange={(e) => e.target.value && linkGroup(Number(e.target.value))}
        >
          <option value="">
            {groups.length === 0 && !isLoadingGroups
              ? t(`${K}noGroups`)
              : unlinked.length === 0
                ? t(`${K}allLinked`)
                : t(`${K}addGroup`)}
          </option>
          {unlinked.map((g) => (
            <option key={g.addOnId} value={g.addOnId}>
              {g.categoryName}
            </option>
          ))}
        </select>
        {isLinking ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <Plus className="w-4 h-4 text-slate-400" aria-hidden />
        )}
      </div>
    </section>
  );
};
