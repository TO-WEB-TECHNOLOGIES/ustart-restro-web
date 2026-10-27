import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OptionExtras, OptionNutrition } from "../../api/optionExtras";
import { ALLERGEN_LABELS, CONSISTENCY_LABELS, FROSTING_LABELS, TAG_LABELS } from "./menuLabels";
import { SPICE_LEVEL_VALUES, spiceLevelLabelKey } from "./spiceLevel";

/**
 * 2026-10-27: the "Additional details" fields of a customization option below its image and
 * description - availability, specifications and nutrition (everything the database
 * stores for an option, product decision). Purely controlled; OptionDetailsDialog owns the state.
 * Labels reuse the add-item form's keys so an option and a dish describe a field the same way.
 */
interface OptionExtrasFieldsProps {
  idPrefix: string;
  value: OptionExtras;
  onChange: (value: OptionExtras) => void;
  /** Shows the "both times needed" note under the time window. */
  timesMissing: boolean;
}

const A = "dashboard.menuEditor.addItem.";
const D = "dashboard.menuEditor.customizations.details.";
const SECTION = "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const FIELD_LABEL = "text-xs font-semibold text-slate-600 dark:text-slate-300";
const INPUT = "dark:bg-slate-950 dark:border-slate-700 dark:text-white";
const TAB_LIST = "h-auto flex-wrap bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800";
const TAB = "h-7 px-2.5 text-xs data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 dark:text-slate-300";

// Number inputs: an emptied field is "not set" (left unchanged by the save), not 0.
const toOptionalInt = (raw: string) => (raw === "" ? undefined : Math.max(0, Math.floor(Number(raw))));

export const OptionExtrasFields = ({ idPrefix, value, onChange, timesMissing }: OptionExtrasFieldsProps) => {
  const { t } = useTranslation();
  const set = (patch: Partial<OptionExtras>) => onChange({ ...value, ...patch });
  const setNutrition = (field: keyof OptionNutrition, v: string) =>
    set({ nutrition: { ...value.nutrition, [field]: v } });
  const toggle = (field: "itemType" | "tags" | "allergens", code: string) =>
    set({
      [field]: value[field].includes(code) ? value[field].filter((c) => c !== code) : [...value[field], code],
    });

  // One checkbox grid per multi-select field (consistency, tags, allergens).
  const checkGroup = (field: "itemType" | "tags" | "allergens", labels: Record<string, string>, titleKey: string) => (
    <div className="space-y-2">
      <span className={`block ${FIELD_LABEL}`}>{t(titleKey)}</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(labels).map(([code, labelKey]) => (
          <label key={code} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <Checkbox checked={value[field].includes(code)} onCheckedChange={() => toggle(field, code)} />
            {t(labelKey)}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Availability: the option's own row. No packaging fee (2026-10-27): it's charged on the
          dish, not per option. */}
      <section className="space-y-3">
        <h3 className={SECTION}>{t(`${D}availabilitySection`)}</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <Checkbox checked={value.isAvailable} onCheckedChange={(v) => set({ isAvailable: v === true })} />
          {t("dashboard.menuEditor.inStock")}
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <Checkbox checked={value.allDay} onCheckedChange={(v) => set({ allDay: v === true })} />
          {t(`${A}sameAsRestaurant`)}
        </label>
        {!value.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-from`} className={FIELD_LABEL}>
                {t(`${A}from`)}
              </Label>
              <Input
                id={`${idPrefix}-from`}
                type="time"
                className={INPUT}
                value={value.startTime}
                onChange={(e) => set({ startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-to`} className={FIELD_LABEL}>
                {t(`${A}to`)}
              </Label>
              <Input
                id={`${idPrefix}-to`}
                type="time"
                className={INPUT}
                value={value.endTime}
                onChange={(e) => set({ endTime: e.target.value })}
              />
            </div>
            {timesMissing && (
              <p className="col-span-2 text-xs font-medium text-red-600 dark:text-red-400">{t(`${D}timesRequired`)}</p>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${D}availabilityHint`)}</p>
      </section>

      {/* Specifications: the option's own item_specifications row */}
      <section className="space-y-4">
        <h3 className={SECTION}>{t(`${D}specsSection`)}</h3>

        <div className="space-y-2">
          <span className={`block ${FIELD_LABEL}`}>{t(`${A}spiceLevel`)}</span>
          <Tabs
            value={value.spiceLevel !== undefined ? String(value.spiceLevel) : ""}
            onValueChange={(v) => set({ spiceLevel: Number(v) })}
          >
            <TabsList className={TAB_LIST}>
              {SPICE_LEVEL_VALUES.map((level) => (
                <TabsTrigger key={level} value={String(level)} className={TAB}>
                  {t(spiceLevelLabelKey(level))}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-portion`} className={FIELD_LABEL}>
              {t(`${A}portion`)}
            </Label>
            <Input
              id={`${idPrefix}-portion`}
              className={INPUT}
              value={value.portionSize}
              onChange={(e) => set({ portionSize: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-serves`} className={FIELD_LABEL}>
              {t(`${A}serves`)}
            </Label>
            <Input
              id={`${idPrefix}-serves`}
              type="number"
              min={1}
              className={INPUT}
              value={value.serves ?? ""}
              onChange={(e) => set({ serves: toOptionalInt(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-weight`} className={FIELD_LABEL}>
              {t(`${A}weight`)}
            </Label>
            <Input
              id={`${idPrefix}-weight`}
              className={INPUT}
              value={value.weight}
              onChange={(e) => set({ weight: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-maxqty`} className={FIELD_LABEL}>
              {t(`${A}maxQty`)}
            </Label>
            <Input
              id={`${idPrefix}-maxqty`}
              type="number"
              min={1}
              className={INPUT}
              value={value.maxQuantity ?? ""}
              onChange={(e) => set({ maxQuantity: toOptionalInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <span className={`block ${FIELD_LABEL}`}>{t(`${A}frosting`)}</span>
          <Tabs value={value.isFrosting ?? ""} onValueChange={(v) => set({ isFrosting: v })}>
            <TabsList className={TAB_LIST}>
              {Object.entries(FROSTING_LABELS).map(([code, labelKey]) => (
                <TabsTrigger key={code} value={code} className={TAB}>
                  {t(labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {checkGroup("itemType", CONSISTENCY_LABELS, `${A}consistency`)}
        {checkGroup("tags", TAG_LABELS, `${A}tags`)}
        {checkGroup("allergens", ALLERGEN_LABELS, `${A}allergyInfo`)}
      </section>

      {/* Nutrition: free text, same as the dish form (e.g. "120 kcal") */}
      <section className="space-y-3">
        <h3 className={SECTION}>{t(`${A}nutrition.title`)}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["calories", "protein", "carbs", "fats"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-${field}`} className={FIELD_LABEL}>
                {t(`${A}nutrition.${field}`)}
              </Label>
              <Input
                id={`${idPrefix}-${field}`}
                className={INPUT}
                value={value.nutrition[field]}
                onChange={(e) => setNutrition(field, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
