import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/utils/error";
import type { AddonGroup, AddonGroupValues } from "../../api/addonLibraryApi";
import { useAddonGroupMutations } from "../../hooks/useAddonLibrary";

/**
 * 2026-10-27: create / edit one add-on group (name + selection rules). Replaces the hand-rolled
 * createPortal AddEditAddonCategoryModal with shadcn Dialog. Saves immediately (product decision).
 * Never touches the group's dish links - those are set from the dish form.
 */
interface AddonGroupDialogProps {
  open: boolean;
  /** null = create. */
  group: AddonGroup | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (group: AddonGroup) => void;
}

const K = "dashboard.addonLibrary.group.";
const HEADING = "text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500";
const INPUT = "dark:bg-slate-950 dark:border-slate-700 dark:text-white";
const toNumber = (value: string) => (value === "" ? 0 : Number(value));

const valuesOf = (group: AddonGroup | null): AddonGroupValues => ({
  categoryName: group?.categoryName ?? "",
  // A new group starts optional, pick up to 1 (the backend's own defaults).
  minCustomizationSelection: group?.minCustomizationSelection ?? 0,
  maxCustomizationSelection: group?.maxCustomizationSelection ?? 1,
  isActive: group?.isActive ?? true,
});

export const AddonGroupDialog = ({ open, group, onOpenChange, onSaved }: AddonGroupDialogProps) => {
  const { t } = useTranslation();
  const { create, update } = useAddonGroupMutations();
  const [values, setValues] = useState<AddonGroupValues>(valuesOf(group));
  const [error, setError] = useState("");
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    setValues(valuesOf(group));
    setError("");
  }, [open, group]);

  const set = (patch: Partial<AddonGroupValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleSave = async () => {
    // The backend's rules, checked first so the message sits next to the fields.
    const { categoryName, minCustomizationSelection: min, maxCustomizationSelection: max } = values;
    if (!categoryName.trim()) return setError(t(`${K}nameRequired`));
    if (!(min >= 0 && max >= 1 && min <= max)) return setError(t(`${K}limits`));
    setError("");
    try {
      const saved = group
        ? await update.mutateAsync({ groupId: group.addOnId, values })
        : await create.mutateAsync(values);
      toast.success(t(group ? `${K}updated` : `${K}created`, { name: categoryName.trim() }));
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, t(`${K}saveFailed`)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t(group ? `${K}editTitle` : `${K}addTitle`)}</DialogTitle>
          <DialogDescription className="dark:text-slate-400">{t(`${K}subtitle`)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="addon-group-name" className={HEADING}>
              {t(`${K}name`)}
            </Label>
            <Input
              id="addon-group-name"
              value={values.categoryName}
              placeholder={t(`${K}namePlaceholder`)}
              onChange={(e) => set({ categoryName: e.target.value })}
              className={INPUT}
            />
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="addon-group-min" className={HEADING}>
                  {t("dashboard.menuEditor.customizations.minSelection")}
                </Label>
                <Input
                  id="addon-group-min"
                  type="number"
                  min={0}
                  className={INPUT}
                  value={values.minCustomizationSelection}
                  onChange={(e) => set({ minCustomizationSelection: toNumber(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addon-group-max" className={HEADING}>
                  {t("dashboard.menuEditor.customizations.maxSelection")}
                </Label>
                <Input
                  id="addon-group-max"
                  type="number"
                  min={1}
                  className={INPUT}
                  value={values.maxCustomizationSelection}
                  onChange={(e) => set({ maxCustomizationSelection: toNumber(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <span className={`block ${HEADING}`}>{t("dashboard.menuEditor.customizations.status")}</span>
                <label className="flex h-10 items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <Checkbox checked={values.isActive} onCheckedChange={(v) => set({ isActive: v === true })} />
                  {t("dashboard.menuEditor.customizations.active")}
                </label>
              </div>
            </div>
            {/* Same wording as customization categories: derived from Min, not a setting. */}
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {values.minCustomizationSelection > 0
                ? t("dashboard.menuEditor.customizations.mandatory")
                : t("dashboard.menuEditor.customizations.optional")}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

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
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[var(--color-primary-blue)] text-white hover:opacity-90"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {t("dashboard.addonLibrary.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
