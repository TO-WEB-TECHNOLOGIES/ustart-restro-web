/**
 * Menu item spice level contract (2026-10-21), shared by AddItemPage, AddEditItemModal,
 * ModifiedItemCard and menuApi.
 *
 * Why this exists: the UI had 4 options (Sweet = -1, Mild = 1, Medium = 2, Hot = 3) but the
 * backend mapped 1 -> SWEET, 3 -> SPICY, anything else -> MODERATE, and Zod only allowed 1-3.
 * So "Sweet" could never be saved and "Mild" was stored as SWEET. Now 1:1 with the backend's
 * 4-value enum (MenuItemServiceImpl.mapSpiceLevel), sent as 0-3:
 *   0 Sweet -> SWEET | 1 Mild -> MODERATE | 2 Medium -> SPICY | 3 Hot -> VERY_SPICY
 * The non-zero values double as the number of flame icons shown.
 */
export const SPICE_SWEET = 0;
export const SPICE_LEVEL_VALUES = [0, 1, 2, 3] as const;

const LABEL_KEYS: Record<number, string> = {
  0: "dashboard.menuEditor.addItem.spiceLevels.sweet",
  1: "dashboard.menuEditor.addItem.spiceLevels.mild",
  2: "dashboard.menuEditor.addItem.spiceLevels.medium",
  3: "dashboard.menuEditor.addItem.spiceLevels.hot",
};

// i18n key for a level; unknown/missing values fall back to Mild, the form default.
export const spiceLevelLabelKey = (level: number | undefined) => LABEL_KEYS[level ?? 1] ?? LABEL_KEYS[1];

// Backend responses carry the enum name; map it back so editing an existing item starts from
// its saved level instead of the form default (which then overwrote it on save).
const FROM_API: Record<string, number> = { SWEET: 0, MODERATE: 1, SPICY: 2, VERY_SPICY: 3 };
export const spiceLevelFromApi = (value: string | null | undefined): number | undefined =>
  value ? FROM_API[value.toUpperCase()] : undefined;
