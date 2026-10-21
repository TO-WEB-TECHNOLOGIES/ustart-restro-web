import type { TFunction } from "i18next";

/**
 * Display labels for menu item enum codes (2026-10-21).
 *
 * Why: the Review Changes card (ModifiedItemCard) printed the stored codes as-is - "NON_VEG",
 * "DINE_IN", "SEMI_SOLID", "CHEFS_SPECIAL", "TREE_NUTS" - instead of the text the partner picked in
 * the form. These maps reuse the exact i18n keys AddItemPage's options use, so both screens say the
 * same thing. Codes with no mapping fall back to a readable version of the code, never the raw code.
 */
const K = "dashboard.menuEditor.addItem.";

export const FOOD_TYPE_LABELS: Record<string, string> = {
  VEG: `${K}foodTypes.veg`,
  NON_VEG: `${K}foodTypes.nonVeg`,
  CONTAINS_EGG: `${K}foodTypes.egg`,
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  DELIVERY: `${K}serviceTypes.delivery`,
  DINE_IN: `${K}serviceTypes.dineIn`,
  BOTH: `${K}serviceTypes.both`,
};

export const CONSISTENCY_LABELS: Record<string, string> = {
  SOLID: `${K}consistencies.solid`,
  LIQUID: `${K}consistencies.liquid`,
  SEMI_SOLID: `${K}consistencies.semiSolid`,
  FROZEN: `${K}consistencies.frozen`,
};

export const TAG_LABELS: Record<string, string> = {
  GLUTEN_FREE: `${K}menuTags.gluten_free`,
  SUGAR_FREE: `${K}menuTags.sugar_free`,
  JAIN: `${K}menuTags.jain`,
  VEGAN: `${K}menuTags.vegan`,
  CHEFS_SPECIAL: `${K}menuTags.chefs_special`,
  // Key is misspelled in the locale files; kept to match AddItemPage.
  HIGH_PROTEIN: `${K}menuTags.high_protien`,
};

export const ALLERGEN_LABELS: Record<string, string> = {
  MILK: `${K}allergens.milk`,
  EGGS: `${K}allergens.eggs`,
  FISH: `${K}allergens.fish`,
  SHELLFISH: `${K}allergens.shellfish`,
  TREE_NUTS: `${K}allergens.tree_nuts`,
  PEANUTS: `${K}allergens.peanuts`,
  WHEAT: `${K}allergens.wheat`,
  SOY: `${K}allergens.soy`,
  SESAME: `${K}allergens.sesame`,
};

// Same three options as AddItemPage's frosting <select>.
export const FROSTING_LABELS: Record<string, string> = {
  NO: `${K}frostingOptions.no`,
  FROSTED: `${K}frostingOptions.frosted`,
  PRE: `${K}frostingOptions.pre`,
};

// "SOME_CODE" -> "Some code": last-resort text for a code no map knows about.
const humanize = (code: string) =>
  code.charAt(0).toUpperCase() + code.slice(1).toLowerCase().replace(/_/g, " ");

export const enumLabel = (
  t: TFunction,
  labels: Record<string, string>,
  value: string | null | undefined,
): string | undefined => {
  if (!value) return undefined;
  const key = labels[value.toUpperCase()];
  return key ? t(key) : humanize(value);
};

// Multi-select fields (tags, allergens, consistency). NONE_OF_THESE is the form's "nothing picked"
// placeholder sent to the backend, not a real choice, so it's dropped.
export const enumListLabel = (
  t: TFunction,
  labels: Record<string, string>,
  values: string[] | null | undefined,
): string | undefined =>
  values
    ?.filter((v) => v !== "NONE_OF_THESE")
    .map((v) => enumLabel(t, labels, v))
    .join(", ") || undefined;

export const yesNoLabel = (t: TFunction, value: boolean | undefined) =>
  value ? t("common.yes") : t("common.no");
