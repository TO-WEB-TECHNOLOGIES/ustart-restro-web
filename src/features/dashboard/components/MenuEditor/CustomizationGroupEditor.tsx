import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FoodType } from "../../../../types/menuTypes";
import { type GroupDraft, type OptionDraft, newDraftKey } from "../../api/customizationApi";
import { emptyOptionExtras, hasOptionExtras } from "../../api/optionExtras";
import { OptionDetailsDialog } from "./OptionDetailsDialog";

/**
 * 2026-10-26: one customization category (e.g. "Crust") and its options (e.g. "Thin +₹0",
 * "Cheese Burst +₹80") inside the customizations side panel. Purely controlled - the panel owns
 * the drafts and validates them before saving.
 *
 * Layout fix (2026-10-26): every option row and the heading row share ONE fixed column template
 * (OPTION_COLS). Before, each row was its own grid with `auto` columns, so the checkboxes and the
 * delete button sized per row and drifted away from their headings. Same idea for the category
 * row: each cell has its heading above the control.
 * 2026-10-27: "Optional / must choose" is no longer its own column - it's derived from Min, not
 * a setting, so it reads as a note under the boxes (product feedback).
 */
interface CustomizationGroupEditorProps {
  group: GroupDraft;
  /** The item/variant's food type - the default for options added here. */
  defaultFoodType: FoodType;
  onChange: (group: GroupDraft) => void;
  onRemove: () => void;
}

export const newOptionDraft = (foodType: FoodType): OptionDraft => ({
  key: newDraftKey("o"),
  name: "",
  price: 0,
  isActive: true,
  isDefault: false,
  foodType,
  description: "",
  extras: emptyOptionExtras(),
});

// Number inputs: an emptied field becomes 0 rather than NaN.
const toNumber = (value: string) => (value === "" ? 0 : Number(value));

// Phones: name on its own line, then price | active | pre-selected | delete. sm+: one line.
const OPTION_COLS =
  "grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem_2.5rem] sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_5.5rem_2.5rem] gap-x-2 gap-y-2";
const CHECK_CELL = "flex h-10 items-center justify-center gap-1.5";
const HEADING = "text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500";

// 2026-10-27: exported for the add-on library (same veg / non-veg / egg markers).
export const FOOD_TYPES: { value: FoodType; labelKey: string; dot: string }[] = [
  { value: "VEG", labelKey: "dashboard.menuEditor.addItem.foodTypes.veg", dot: "bg-green-600" },
  { value: "NON_VEG", labelKey: "dashboard.menuEditor.addItem.foodTypes.nonVeg", dot: "bg-red-600" },
  { value: "CONTAINS_EGG", labelKey: "dashboard.menuEditor.addItem.foodTypes.egg", dot: "bg-yellow-500" },
];

export const CustomizationGroupEditor = ({ group, defaultFoodType, onChange, onRemove }: CustomizationGroupEditorProps) => {
  const { t } = useTranslation();
  const k = (key: string) => `dashboard.menuEditor.customizations.${key}`;
  // Option whose "Additional details" modal is open.
  const [detailsKey, setDetailsKey] = useState<string | null>(null);

  const update = (patch: Partial<GroupDraft>) => onChange({ ...group, ...patch });
  const updateOption = (index: number, patch: Partial<OptionDraft>) =>
    update({ options: group.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) });
  const detailsIndex = group.options.findIndex((o) => o.key === detailsKey);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
      {/* Category name */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`${group.key}-name`} className={HEADING}>
            {t(k("categoryName"))}
          </Label>
          <Input
            id={`${group.key}-name`}
            value={group.name}
            placeholder={t(k("categoryNamePlaceholder"))}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          title={t(k("removeCategory"))}
          aria-label={t(k("removeCategory"))}
          className="text-slate-400 hover:text-red-600 dark:hover:bg-slate-800"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Category rules: every cell is heading-over-control, controls all h-10 */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${group.key}-min`} className={HEADING}>
              {t(k("minSelection"))}
            </Label>
            <Input
              id={`${group.key}-min`}
              type="number"
              min={0}
              value={group.minSelection}
              onChange={(e) => update({ minSelection: toNumber(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${group.key}-max`} className={HEADING}>
              {t(k("maxSelection"))}
            </Label>
            <Input
              id={`${group.key}-max`}
              type="number"
              min={1}
              value={group.maxSelection}
              onChange={(e) => update({ maxSelection: toNumber(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <span className={`block ${HEADING}`}>{t(k("status"))}</span>
            <div className="flex h-10 items-center gap-2">
              <Checkbox
                id={`${group.key}-active`}
                checked={group.isActive}
                onCheckedChange={(v) => update({ isActive: v === true })}
              />
              <Label htmlFor={`${group.key}-active`} className="text-sm cursor-pointer">
                {t(k("active"))}
              </Label>
            </div>
          </div>
        </div>
        {/* Mandatory isn't a separate setting: the backend derives it from min > 0. */}
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {group.minSelection > 0 ? t(k("mandatory")) : t(k("optional"))}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {/* px-[11px] = the option card's 1px border + p-2.5, so each heading sits exactly over
            its column inside the cards below. */}
        <div className={`hidden sm:grid ${OPTION_COLS.replace("grid ", "")} px-[11px]`}>
          <span className={HEADING}>{t(k("optionName"))}</span>
          <span className={HEADING}>{t(k("optionPrice"))}</span>
          <span className={`${HEADING} text-center`}>{t(k("active"))}</span>
          <span className={`${HEADING} text-center`}>{t(k("preselected"))}</span>
          <span />
        </div>

        {group.options.map((option, index) => {
          // 2026-10-27: the modal now holds every optional field, so any of them counts.
          const hasDetails = !!option.description.trim() || !!option.imageUrl || hasOptionExtras(option.extras);
          return (
            <div
              key={option.key}
              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-2.5 space-y-2"
            >
              <div className={OPTION_COLS}>
                <Input
                  value={option.name}
                  aria-label={t(k("optionName"))}
                  placeholder={t(k("optionNamePlaceholder"))}
                  onChange={(e) => updateOption(index, { name: e.target.value })}
                  className="col-span-4 sm:col-span-1 bg-white dark:bg-slate-900"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">+₹</span>
                  <Input
                    type="number"
                    min={0}
                    aria-label={t(k("optionPrice"))}
                    className="pl-8 bg-white dark:bg-slate-900"
                    value={option.price}
                    onChange={(e) => updateOption(index, { price: toNumber(e.target.value) })}
                  />
                </div>
                <label className={`${CHECK_CELL} cursor-pointer`}>
                  <Checkbox
                    checked={option.isActive}
                    aria-label={t(k("active"))}
                    onCheckedChange={(v) =>
                      // An inactive option can't stay pre-selected (backend rule).
                      updateOption(index, { isActive: v === true, ...(v !== true && { isDefault: false }) })
                    }
                  />
                  {/* Phones have no heading row, so the label sits next to the box there. */}
                  <span className="text-xs sm:hidden">{t(k("active"))}</span>
                </label>
                <label className={`${CHECK_CELL} cursor-pointer`}>
                  <Checkbox
                    checked={option.isDefault}
                    disabled={!option.isActive}
                    aria-label={t(k("preselected"))}
                    onCheckedChange={(v) => updateOption(index, { isDefault: v === true })}
                  />
                  <span className="text-xs sm:hidden">{t(k("preselected"))}</span>
                </label>
                <div className={CHECK_CELL}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => update({ options: group.options.filter((_, i) => i !== index) })}
                    title={t(k("removeOption"))}
                    aria-label={t(k("removeOption"))}
                    className="text-slate-400 hover:text-red-600 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Food type (always visible, defaults to the item's) + optional extras link */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Tabs
                  value={option.foodType}
                  onValueChange={(v) => updateOption(index, { foodType: v as FoodType })}
                >
                  <TabsList className="h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {FOOD_TYPES.map((food) => (
                      <TabsTrigger
                        key={food.value}
                        value={food.value}
                        className="h-6 px-2.5 text-xs gap-1.5 data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 dark:text-slate-300"
                      >
                        <span className={`w-2 h-2 rounded-full ${food.dot}`} />
                        {t(food.labelKey)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <button
                  type="button"
                  onClick={() => setDetailsKey(option.key)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-blue)] dark:text-blue-400 hover:underline"
                >
                  {option.imageUrl && <ImageIcon className="w-3.5 h-3.5" />}
                  {hasDetails ? t(k("editDetails")) : t(k("addDetails"))}
                </button>
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => update({ options: [...group.options, newOptionDraft(defaultFoodType)] })}
          className="dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t(k("addOption"))}
        </Button>
      </div>

      {detailsIndex >= 0 && (
        <OptionDetailsDialog
          option={group.options[detailsIndex]}
          open
          onOpenChange={(open) => !open && setDetailsKey(null)}
          onDone={(patch) => updateOption(detailsIndex, patch)}
        />
      )}
    </div>
  );
};
