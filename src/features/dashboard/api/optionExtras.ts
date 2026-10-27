/**
 * 2026-10-27: the optional "Additional details" of one customization option beyond its image and
 * description - every other field the database stores for an option (product decision: "all
 * optional fields"):
 * - its availability row: in stock, time window;
 * - its own specifications row: serves, portion, weight, max qty, frosting, spice level,
 *   consistency, tags, allergens, nutrition.
 * Sent with the item-group save under the same names as the item create body (backend
 * docs/integration-docs/menu-item-groups.md); read from the item detail's option fields.
 * Left out on purpose: tax (always the item's), discount (options aren't discounted), admin lock,
 * and (2026-10-27, product decision) packaging fee - packaging is charged on the dish, not per
 * option. It isn't sent, so the backend keeps an option's stored fee (0 unless set elsewhere).
 */

export interface OptionNutrition {
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
}

export interface OptionExtras {
    isAvailable: boolean;
    allDay: boolean;
    /** "HH:mm"; only sent when allDay is off. */
    startTime: string;
    endTime: string;
    /** 0-3 as in spiceLevel.ts; undefined = not set (the backend then keeps / defaults to Mild). */
    spiceLevel?: number;
    serves?: number;
    portionSize: string;
    weight: string;
    maxQuantity?: number;
    /** NO / FROSTED / PRE; undefined = not set. */
    isFrosting?: string;
    itemType: string[];
    tags: string[];
    allergens: string[];
    nutrition: OptionNutrition;
}

export const emptyOptionExtras = (): OptionExtras => ({
    isAvailable: true,
    allDay: true,
    startTime: '',
    endTime: '',
    portionSize: '',
    weight: '',
    itemType: [],
    tags: [],
    allergens: [],
    nutrition: { calories: '', protein: '', carbs: '', fats: '' },
});

/** The option fields of the item detail read that feed OptionExtras. */
export interface OptionExtrasDTO {
    isAvailable?: boolean | null;
    allDay?: boolean | null;
    startTime?: string | null;
    endTime?: string | null;
    servCount?: number | null;
    spiceLevel?: string | null;
    portionSize?: string | null;
    weight?: string | null;
    maxQuantityPerOrder?: number | null;
    frostingType?: string | null;
    itemTypes?: string[] | null;
    tags?: string[] | null;
    allergyWarnings?: string[] | null;
    calories?: string | null;
    protein?: string | null;
    carbs?: string | null;
    fats?: string | null;
}

const SPICE_FROM_API: Record<string, number> = { SWEET: 0, MODERATE: 1, SPICY: 2, VERY_SPICY: 3 };
// NONE_OF_THESE is the backend's "nothing picked" placeholder, not a choice the partner sees.
const realChoices = (values?: string[] | null) =>
    (values ?? []).map(v => v.toUpperCase()).filter(v => v !== 'NONE_OF_THESE');

export const optionExtrasFromDTO = (dto: OptionExtrasDTO): OptionExtras => ({
    isAvailable: dto.isAvailable ?? true,
    allDay: dto.allDay ?? true,
    // LocalTime may come back as "HH:mm:ss"; <input type="time"> wants "HH:mm".
    startTime: dto.startTime?.slice(0, 5) ?? '',
    endTime: dto.endTime?.slice(0, 5) ?? '',
    spiceLevel: dto.spiceLevel ? SPICE_FROM_API[dto.spiceLevel.toUpperCase()] : undefined,
    serves: dto.servCount ?? undefined,
    portionSize: dto.portionSize ?? '',
    weight: dto.weight ?? '',
    maxQuantity: dto.maxQuantityPerOrder ?? undefined,
    isFrosting: dto.frostingType?.toUpperCase() || undefined,
    itemType: realChoices(dto.itemTypes),
    tags: realChoices(dto.tags),
    allergens: realChoices(dto.allergyWarnings),
    nutrition: {
        calories: dto.calories ?? '',
        protein: dto.protein ?? '',
        carbs: dto.carbs ?? '',
        fats: dto.fats ?? '',
    },
});

/**
 * The extras as option-node fields. Availability is sent every save: the backend only
 * applies what differs from the stored brand value, so an untouched option changes nothing.
 * Unset numbers/selects are left out (unchanged); empty tags/allergens go as NONE_OF_THESE,
 * the same placeholder the item form sends.
 */
export const optionExtrasToNode = (x: OptionExtras) => ({
    isAvailable: x.isAvailable,
    availability: x.allDay
        ? { allDay: true }
        : { allDay: false, startTime: x.startTime, endTime: x.endTime },
    ...(x.spiceLevel !== undefined && { spiceLevel: x.spiceLevel }),
    ...(x.serves !== undefined && { serves: x.serves }),
    ...(x.maxQuantity !== undefined && { maxQuantity: x.maxQuantity }),
    ...(x.isFrosting && { isFrosting: x.isFrosting }),
    portionSize: x.portionSize.trim(),
    weight: x.weight.trim(),
    itemType: x.itemType,
    tags: x.tags.length ? x.tags : ['NONE_OF_THESE'],
    allergens: x.allergens.length ? x.allergens : ['NONE_OF_THESE'],
    nutritionalInfo: {
        calories: x.nutrition.calories.trim(),
        protein: x.nutrition.protein.trim(),
        carbs: x.nutrition.carbs.trim(),
        fats: x.nutrition.fats.trim(),
    },
});

/** True when anything differs from a fresh option, so the link reads "Edit additional details". */
// Explicit field checks rather than comparing with emptyOptionExtras(): the read always fills
// spice level (the column defaults to Mild) and may return times while allDay is on, and
// neither means the partner set anything.
export const hasOptionExtras = (x: OptionExtras) =>
    !x.isAvailable || !x.allDay
    || (x.spiceLevel !== undefined && x.spiceLevel !== 1)
    || x.serves !== undefined || x.maxQuantity !== undefined || !!x.isFrosting
    || !!x.portionSize.trim() || !!x.weight.trim()
    || x.itemType.length > 0 || x.tags.length > 0 || x.allergens.length > 0
    || Object.values(x.nutrition).some(v => !!v.trim());

/** A time window needs both ends (the backend would otherwise keep a stale one). */
export const extrasTimesMissing = (x: OptionExtras) => !x.allDay && (!x.startTime || !x.endTime);
