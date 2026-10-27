import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/utils/error";
import type { FoodType, MenuItem } from "../../../../types/menuTypes";
import {
  type GroupDraft,
  type RowCustomizations,
  copyGroupsAsNew,
  fetchGroupCustomizations,
  newDraftKey,
  saveGroupCustomizations,
  validateRowGroups,
} from "../../api/customizationApi";
import { type AddonGroupLinkDraft, copyGroupLinks, fetchDishAddonLinks, groupLibraryLoader } from "../../api/addonLinks";
import { fetchCategoryItems } from "../../api/menuApi";
import { ADDON_LIBRARY_KEY } from "../../hooks/useAddonLibrary";
import { CustomizationGroupEditor, newOptionDraft } from "./CustomizationGroupEditor";
import { AddonLinksEditor, type CopySource } from "./AddonLinksEditor";
import { useMenuStore } from "../../store/useMenuStore";
import { getVariants } from "../../store/menuItemLookup";

/**
 * 2026-10-26: full-height side panel to manage the customizations of an item AND its variants
 * (one tab per row): categories first, then the options inside each. Saved with the panel's own
 * Save button, all rows in one transaction (PUT /menu/item-groups - see customizationApi), not
 * queued for Review. Only saved items/variants can be edited here: an unsaved one has no id yet.
 *
 * "Same as base item" on a variant copies the base item's categories/options into it (replacing
 * what it had, after a confirmation); the copy is then the variant's own and stays editable.
 * Unticking restores what the variant had before the copy.
 *
 * 2026-10-27: below the categories, each row's linked add-ons (AddonLinksEditor): groups, which of
 * their add-ons this dish offers, and its own price for each (all outlets). Saved with the same
 * Save. A variant can copy the base item's add-ons, the base item another item's of its category
 * (links + special prices, confirmed when it replaces something).
 */
interface CustomizationPanelProps {
  parent: MenuItem;
  /** Row whose tab opens first (the item or one of its variants). */
  initialRowId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// New options start with the food type of the item/variant they belong to.
const newGroupDraft = (foodType: FoodType): GroupDraft => ({
  key: newDraftKey("g"),
  name: "",
  minSelection: 0,
  maxSelection: 1,
  isActive: true,
  options: [newOptionDraft(foodType)],
});

type Confirm =
  | { kind: "copy"; rowId: number }
  | { kind: "discard" }
  // 2026-10-27: replacing a row's add-ons with the base item's ("base") or another item's (its id).
  | { kind: "copyAddons"; rowId: number; source: "base" | number }
  | null;

// How many of the category's items "Copy from" offers (one page of the list API).
const COPY_SOURCE_LIMIT = 100;

export const CustomizationPanel = ({ parent, initialRowId, open, onOpenChange }: CustomizationPanelProps) => {
  const { t } = useTranslation();
  const k = (key: string) => `dashboard.menuEditor.customizations.${key}`;
  const updatedItems = useMenuStore((state) => state.updatedItems);

  const [rows, setRows] = useState<RowCustomizations[] | null>(null);
  const [loadedJson, setLoadedJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRowId, setActiveRowId] = useState(initialRowId);
  // Variant rowId -> its groups before "Same as base item" was ticked (to restore on untick).
  const [beforeCopy, setBeforeCopy] = useState<Record<number, GroupDraft[]>>({});
  const [showIssues, setShowIssues] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [copyingRowId, setCopyingRowId] = useState<number | null>(null);

  const isUnsavedParent = parent.id < 0;
  // New variants exist only locally until Review publishes them - they get a tab after that.
  const unsavedVariantCount = getVariants(parent, updatedItems).filter((v) => v.id < 0).length;

  useEffect(() => {
    if (!open || isUnsavedParent) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadFailed(false);
    setShowIssues(false);
    setBeforeCopy({});
    setActiveRowId(initialRowId);
    fetchGroupCustomizations(parent.id)
      .then((loaded) => {
        if (cancelled) return;
        setRows(loaded);
        setLoadedJson(JSON.stringify(loaded));
        // A variant opened from the row that isn't saved yet falls back to the base item's tab.
        if (!loaded.some((r) => r.rowId === initialRowId)) setActiveRowId(loaded[0].rowId);
      })
      .catch((err) => {
        console.error("Failed to load customizations", err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, parent.id, initialRowId, isUnsavedParent]);

  const isDirty = rows !== null && JSON.stringify(rows) !== loadedJson;
  const activeRow = rows?.find((r) => r.rowId === activeRowId);
  const baseRow = rows?.[0];

  // Every row's problems, labelled with the row's name, for the note next to Save.
  const issues = useMemo(
    () =>
      (rows ?? []).flatMap((row) =>
        validateRowGroups(row).map((issue) => ({
          row: row.name,
          text: t(k(`errors.${issue.key}`), issue.params),
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, t],
  );

  const setRowGroups = (rowId: number, groups: GroupDraft[]) =>
    setRows((prev) => prev && prev.map((r) => (r.rowId === rowId ? { ...r, groups } : r)));
  const setRowAddons = (rowId: number, addOnGroups: AddonGroupLinkDraft[]) =>
    setRows((prev) => prev && prev.map((r) => (r.rowId === rowId ? { ...r, addOnGroups } : r)));

  // "Copy from" for the base item: the other saved items of its category, with their variants
  // (each variant has its own add-ons). Loaded only while the panel is open.
  const { data: categoryItems = [] } = useQuery({
    queryKey: [ADDON_LIBRARY_KEY, "copySources", parent.categoryId],
    queryFn: async () => (await fetchCategoryItems(parent.categoryId, 1, COPY_SOURCE_LIMIT)).items,
    enabled: open && !isUnsavedParent && !!parent.categoryId,
    staleTime: 0,
  });
  const copySources: CopySource[] = categoryItems
    .filter((item) => item.id !== parent.id)
    .flatMap((item) => [
      { id: item.id, label: item.name },
      ...(item.productVariants ?? []).map((v) => ({ id: v.id, label: `${item.name} – ${v.name}` })),
    ]);

  const runAddonCopy = async (rowId: number, source: "base" | number) => {
    if (source === "base") {
      if (baseRow) setRowAddons(rowId, copyGroupLinks(baseRow.addOnGroups));
      return;
    }
    setCopyingRowId(rowId);
    try {
      setRowAddons(rowId, await fetchDishAddonLinks(source, groupLibraryLoader()));
    } catch (err) {
      toast.error(getErrorMessage(err, t(k("addOns.copyFailed"))));
    } finally {
      setCopyingRowId(null);
    }
  };

  // Copying replaces the row's add-on section, so ask first when there is something to replace.
  const requestAddonCopy = (rowId: number, source: "base" | number) => {
    const row = rows?.find((r) => r.rowId === rowId);
    if (row && row.addOnGroups.length > 0) setConfirm({ kind: "copyAddons", rowId, source });
    else runAddonCopy(rowId, source);
  };

  const applyCopy = (rowId: number) => {
    const row = rows?.find((r) => r.rowId === rowId);
    if (!row || !baseRow) return;
    setBeforeCopy((prev) => ({ ...prev, [rowId]: row.groups }));
    setRowGroups(rowId, copyGroupsAsNew(baseRow.groups));
  };

  const handleSameAsBase = (rowId: number, checked: boolean) => {
    if (checked) {
      const row = rows?.find((r) => r.rowId === rowId);
      if (row && row.groups.length > 0) setConfirm({ kind: "copy", rowId });
      else applyCopy(rowId);
    } else {
      const previous = beforeCopy[rowId];
      if (previous) setRowGroups(rowId, previous);
      setBeforeCopy(({ [rowId]: _removed, ...rest }) => rest);
    }
  };

  const requestClose = (nextOpen: boolean) => {
    if (!nextOpen && isDirty && !isSaving) {
      setConfirm({ kind: "discard" });
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    if (!rows) return;
    if (issues.length > 0) {
      setShowIssues(true);
      return;
    }
    setIsSaving(true);
    try {
      await saveGroupCustomizations(parent.id, rows);
      // Reload so new categories/options carry their saved ids for the next save.
      const reloaded = await fetchGroupCustomizations(parent.id);
      setRows(reloaded);
      setLoadedJson(JSON.stringify(reloaded));
      setBeforeCopy({});
      setShowIssues(false);
      toast.success(t(k("saved")));
    } catch (err) {
      toast.error(getErrorMessage(err, t(k("saveFailed"))));
    } finally {
      setIsSaving(false);
    }
  };

  const renderBody = () => {
    if (isUnsavedParent) {
      return <p className="text-sm text-slate-600 dark:text-slate-300">{t(k("publishFirst"))}</p>;
    }
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t(k("loading"))}
        </div>
      );
    }
    if (loadFailed || !rows || !activeRow) {
      return <p className="text-sm text-red-600 dark:text-red-400">{t(k("loadFailed"))}</p>;
    }
    return (
      <div className="space-y-4">
        {activeRow.isVariant && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
            <Checkbox
              id={`same-as-base-${activeRow.rowId}`}
              checked={activeRow.rowId in beforeCopy}
              onCheckedChange={(v) => handleSameAsBase(activeRow.rowId, v === true)}
            />
            <Label htmlFor={`same-as-base-${activeRow.rowId}`} className="text-sm cursor-pointer">
              {t(k("sameAsBase"), { name: baseRow?.name })}
            </Label>
          </div>
        )}

        {activeRow.groups.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t(k("noCategories"))}</p>
        )}
        {activeRow.groups.map((group, index) => (
          <CustomizationGroupEditor
            key={group.key}
            group={group}
            defaultFoodType={activeRow.foodType}
            onChange={(next) =>
              setRowGroups(activeRow.rowId, activeRow.groups.map((g, i) => (i === index ? next : g)))
            }
            onRemove={() => setRowGroups(activeRow.rowId, activeRow.groups.filter((_, i) => i !== index))}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setRowGroups(activeRow.rowId, [...activeRow.groups, newGroupDraft(activeRow.foodType)])}
          className="w-full border-dashed dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t(k("addCategory"))}
        </Button>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <AddonLinksEditor
            rowKey={activeRow.rowId}
            links={activeRow.addOnGroups}
            onChange={(links) => setRowAddons(activeRow.rowId, links)}
            onCopyFromBase={activeRow.isVariant ? () => requestAddonCopy(activeRow.rowId, "base") : undefined}
            copySources={activeRow.isVariant ? undefined : copySources}
            onCopyFrom={activeRow.isVariant ? undefined : (itemId) => requestAddonCopy(activeRow.rowId, itemId)}
            isCopying={copyingRowId === activeRow.rowId}
          />
        </div>
      </div>
    );
  };

  return (
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl h-full flex flex-col gap-0 p-0 bg-slate-50 dark:bg-slate-950"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <SheetTitle className="text-slate-900 dark:text-white">{t(k("title"))}</SheetTitle>
            <SheetDescription className="text-slate-500 dark:text-slate-400">
              {t(k("subtitle"), { name: parent.name })}
            </SheetDescription>
            {rows && rows.length > 1 && (
              <Tabs value={String(activeRowId)} onValueChange={(v) => setActiveRowId(Number(v))} className="pt-3">
                <TabsList className="h-auto flex-wrap justify-start gap-1 dark:bg-slate-800">
                  {rows.map((row) => (
                    <TabsTrigger key={row.rowId} value={String(row.rowId)} className="dark:data-[state=active]:bg-slate-950">
                      {row.isVariant ? row.name : t(k("baseItem"), { name: row.name })}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            {unsavedVariantCount > 0 && !isUnsavedParent && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                {t(k("unsavedVariants"), { count: unsavedVariantCount })}
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">{renderBody()}</div>

          <SheetFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col gap-3 sm:flex-col">
            {/* The problems are listed right here, next to Save: the fields can be far up the
                panel, and a Save that silently does nothing looks stuck (see LEARNINGS 2026-10-21). */}
            {showIssues && issues.length > 0 && (
              <div
                role="alert"
                className="w-full max-h-40 overflow-y-auto rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 flex gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800 dark:text-red-300">{t(k("fixBeforeSave"))}</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-red-700 dark:text-red-400 space-y-0.5">
                    {issues.map((issue, i) => (
                      <li key={i}>
                        {rows && rows.length > 1 ? `${issue.row}: ${issue.text}` : issue.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex w-full justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => requestClose(false)} className="dark:hover:bg-slate-800 dark:text-slate-300">
                {t(k("close"))}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!rows || !isDirty || isSaving || isUnsavedParent}
                className="bg-[var(--color-primary-blue)] text-white hover:opacity-90"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {isSaving ? t(k("saving")) : t(k("save"))}
              </Button>
            </div>
          </SheetFooter>
          {/* Inside SheetContent so Radix stacks it on the panel (a click in it is not "outside" the
              panel). Confirmations: replacing a variant's customizations, or closing with unsaved changes. */}
          <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
            <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">
                  {confirm?.kind === "copy"
                    ? t(k("copyConfirmTitle"))
                    : confirm?.kind === "copyAddons"
                      ? t(k("addOns.copyConfirmTitle"))
                      : t(k("discardTitle"))}
                </DialogTitle>
                <DialogDescription className="dark:text-slate-400">
                  {confirm?.kind === "copy"
                    ? t(k("copyConfirmBody"))
                    : confirm?.kind === "copyAddons"
                      ? t(k("addOns.copyConfirmBody"))
                      : t(k("discardBody"))}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirm(null)} className="dark:hover:bg-slate-800 dark:text-slate-300">
                  {t(k("cancel"))}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm?.kind === "copy") applyCopy(confirm.rowId);
                    else if (confirm?.kind === "copyAddons") runAddonCopy(confirm.rowId, confirm.source);
                    else onOpenChange(false);
                    setConfirm(null);
                  }}
                >
                  {confirm?.kind === "copy" || confirm?.kind === "copyAddons" ? t(k("copyConfirm")) : t(k("discard"))}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SheetContent>
      </Sheet>
  );
};
