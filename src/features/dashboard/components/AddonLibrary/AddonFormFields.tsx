import { useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Candy, Flame, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import type { FoodType } from "../../../../types/menuTypes";
import { MAX_IMAGE_BYTES } from "../MenuEditor/ImagePickField";
import { SPICE_LEVEL_VALUES, SPICE_SWEET, spiceLevelLabelKey } from "../MenuEditor/spiceLevel";

/**
 * 2026-10-27: building blocks of the add-on form, styled exactly like AddItemPage (product
 * feedback: "make the add/edit form similar to the add item page"). AddItemPage writes these
 * inline per field; they are pulled out here so the add-on page stays readable.
 * Two deliberate differences from AddItemPage's markup:
 * - food-type tiles use static classes: AddItemPage builds `border-${color}-600`, which Tailwind
 *   never generates, so its selected tile isn't highlighted;
 * - consistency is chips like allergens/tags, not react-select (CLAUDE.local.md §2 lists
 *   react-select for removal).
 */

/** Plain input, AddItemPage's Attributes style. */
export const FIELD_INPUT =
  "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none";
export const SMALL_LABEL = "text-sm font-bold text-gray-500 dark:text-slate-400";
export const FIELD_TITLE = "text-base font-bold text-slate-900 dark:text-white";

/** "● BASIC INFO" - section heading with a coloured dot. */
export const SectionTitle = ({ dot, children }: { dot: string; children: ReactNode }) => (
  <h3 className="font-mono text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
    <span className={`w-2 h-2 rounded-full ${dot}`} />
    {children}
  </h3>
);

/** The white ring card AddItemPage wraps name / description / price in. */
export const FieldCard = ({ hasError, children }: { hasError?: boolean; children: ReactNode }) => (
  <div
    className={`bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border ${hasError ? "border-red-500" : "border-slate-100"} dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all`}
  >
    {children}
  </div>
);

export const CardLabel = ({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-3"
  >
    {children}
  </label>
);

/** Multi-select pill chips (allergens, tags, consistency). */
export const ChipGroup = ({
  options,
  selected,
  onToggle,
}: {
  options: Record<string, string>;
  selected: string[];
  onToggle: (code: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(options).map(([code, labelKey]) => (
        <label key={code} className="cursor-pointer group">
          <input className="peer sr-only" type="checkbox" checked={selected.includes(code)} onChange={() => onToggle(code)} />
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 text-sm font-medium transition-all peer-checked:bg-[var(--color-primary-blue)] peer-checked:text-white peer-checked:border-[var(--color-primary-blue)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-blue)] hover:bg-gray-50 dark:hover:bg-slate-700">
            {t(labelKey)}
          </span>
        </label>
      ))}
    </div>
  );
};

const FOOD_TILES: { id: FoodType; labelKey: string; selected: string }[] = [
  {
    id: "VEG",
    labelKey: "dashboard.menuEditor.addItem.foodTypes.veg",
    selected: "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  },
  {
    id: "NON_VEG",
    labelKey: "dashboard.menuEditor.addItem.foodTypes.nonVeg",
    selected: "border-red-600 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
  {
    id: "CONTAINS_EGG",
    labelKey: "dashboard.menuEditor.addItem.foodTypes.egg",
    selected: "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
];

/** AddItemPage's three food-type tiles. */
export const FoodTypeTiles = ({ value, onChange }: { value: FoodType; onChange: (value: FoodType) => void }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-3 gap-2">
      {FOOD_TILES.map((tile) => (
        <label key={tile.id} className="cursor-pointer relative">
          <input
            className="peer sr-only"
            name="addon_food_type"
            type="radio"
            checked={value === tile.id}
            onChange={() => onChange(tile.id)}
          />
          <div
            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-blue)] ${
              value === tile.id
                ? tile.selected
                : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
            }`}
          >
            <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
              <div className="size-full rounded-full bg-current" />
            </div>
            <span className="text-xs font-bold">{t(tile.labelKey)}</span>
          </div>
        </label>
      ))}
    </div>
  );
};

/** AddItemPage's spice row: Sweet (candy) and 1-3 flames. */
export const SpiceLevelPicker = ({ value, onChange }: { value?: number; onChange: (level: number) => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full gap-1">
      {SPICE_LEVEL_VALUES.map((level) => {
        const isSelected = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            aria-pressed={isSelected}
            title={t(spiceLevelLabelKey(level))}
            className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group/spice w-full ${
              isSelected
                ? "bg-red-50 dark:bg-red-500/10 text-red-600"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-600"
            }`}
          >
            <div className="flex items-center">
              {level === SPICE_SWEET ? (
                <Candy
                  className={`w-4 h-4 ${isSelected ? "fill-pink-500 text-pink-500" : "text-gray-300 group-hover/spice:text-gray-500"}`}
                  strokeWidth={2.5}
                />
              ) : (
                [...Array(level)].map((_, i) => (
                  <Flame
                    key={i}
                    className={`w-4 h-4 ${isSelected ? "fill-red-600 text-red-600" : "text-gray-300 group-hover/spice:text-gray-500"}`}
                    strokeWidth={2.5}
                  />
                ))
              )}
            </div>
            <span className="text-xs uppercase tracking-tighter font-extrabold">{t(spiceLevelLabelKey(level))}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * AddItemPage's big dashed media box. Preview only - the form uploads the picked file on Save, so
 * a discarded form leaves no orphan upload.
 */
export const ImageDropzone = ({
  previewUrl,
  onPick,
  onRemove,
}: {
  previewUrl?: string;
  onPick: (file: File, previewUrl: string) => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      toast.error(t("onboarding.restaurant.complete.setupForm.fileTooLarge", { name: picked.name, size: 2 }));
      return;
    }
    onPick(picked, URL.createObjectURL(picked));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
      className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center hover:border-[var(--color-primary-blue)]/50 hover:bg-[var(--color-primary-blue)]/[0.02] transition-all cursor-pointer group h-64 relative overflow-hidden"
    >
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={pickFile} />
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={t("dashboard.menuEditor.customizations.details.remove")}
            className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg z-10"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white font-bold">{t("dashboard.menuEditor.addItem.changeImage")}</p>
          </div>
        </>
      ) : (
        <>
          <div className="size-16 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <ImagePlus className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-primary-blue)]" />
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-lg">{t("dashboard.menuEditor.addItem.dropImage")}</p>
          <p className="text-gray-400 text-sm mt-1">{t("dashboard.menuEditor.addItem.clickBrowse")}</p>
        </>
      )}
    </div>
  );
};
