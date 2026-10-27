import { api } from '@/api/axios';
import type { FoodType } from '@/types/menuTypes';
import {
    type OptionExtras,
    type OptionExtrasDTO,
    emptyOptionExtras,
    optionExtrasFromDTO,
    optionExtrasToNode,
} from './optionExtras';

/**
 * 2026-10-27: the brand's add-on library page (AddonLibrary) - add-on groups and the add-ons in
 * them, with their DEFAULT price/availability only (product decision: this page is not about
 * outlets or dishes). Linking a group to dishes stays in the dish form; per-outlet / per-dish
 * prices stay on /menu/addons/{id}/allocation. Backend contract:
 * ustart-backend docs/integration-docs/menu-addons.md.
 *
 * Replaces addonApi.ts for this page. Differences that matter:
 * - no restaurantId on brand reads/writes, so the header's outlet picker can't turn a default
 *   edit into an outlet override;
 * - a group edit never sends menuItemIds (sending it replaces the dish links);
 * - the image is sent only when it changed: the add-on PATCH deletes the stored file whenever
 *   itemImage is present, and the read only gives a public URL, never the key;
 * - specs/availability use the same field names as customization options, so the shared
 *   optionExtras mapping is reused.
 * - an add-on's group is fixed at create: the update ignores addOnCategoryId (the form locks it).
 * - 2026-10-27 (product decision): add-ons take no packaging fee - packagingCharges is always
 *   sent as 0 (create and update), so a fee saved earlier is reset on the next edit.
 */

export interface AddonGroup {
    addOnId: number;
    categoryName: string;
    minCustomizationSelection: number;
    maxCustomizationSelection: number;
    isMandatory: boolean;
    isActive: boolean;
}

export interface Addon {
    variantId: number;
    addOnCategoryId: number;
    name: string;
    description: string;
    /** Public URL for display (never send back). */
    imageUrl?: string;
    foodType: FoodType;
    price: number;
    taxPercentage: number;
    isActive: boolean;
    /** Locked by an admin; the brand can't lift it. */
    isAdminDeactivated: boolean;
    /** In stock - the default for brand users, their own outlet's for outlet users. */
    isAvailable: boolean;
    extras: OptionExtras;
}

/** What the add-on form edits. */
export interface AddonFormValues {
    addOnCategoryId: number;
    name: string;
    description: string;
    foodType: FoodType;
    price: number;
    taxPercentage: number;
    isActive: boolean;
    extras: OptionExtras;
}

interface AddonDTO extends OptionExtrasDTO {
    variantId: number;
    addOnCategoryId: number;
    variantName: string;
    variantDescription?: string | null;
    itemImage?: string | null;
    foodType?: string | null;
    price?: number | null;
    taxPercentage?: number | null;
    isActive?: boolean | null;
    isAdminDeactivated?: boolean | null;
}

const FOOD_TYPES: FoodType[] = ['VEG', 'NON_VEG', 'CONTAINS_EGG'];

const toAddon = (dto: AddonDTO): Addon => ({
    variantId: dto.variantId,
    addOnCategoryId: dto.addOnCategoryId,
    name: dto.variantName,
    description: dto.variantDescription ?? '',
    imageUrl: dto.itemImage || undefined,
    foodType: FOOD_TYPES.find(f => f === dto.foodType?.toUpperCase()) ?? 'VEG',
    price: dto.price ?? 0,
    taxPercentage: dto.taxPercentage ?? 5,
    isActive: dto.isActive ?? true,
    isAdminDeactivated: dto.isAdminDeactivated ?? false,
    isAvailable: dto.isAvailable ?? true,
    extras: optionExtrasFromDTO(dto),
});

export const addonToFormValues = (addon: Addon): AddonFormValues => ({
    addOnCategoryId: addon.addOnCategoryId,
    name: addon.name,
    description: addon.description,
    foodType: addon.foodType,
    price: addon.price,
    taxPercentage: addon.taxPercentage,
    isActive: addon.isActive,
    extras: addon.extras,
});

export const emptyAddonFormValues = (addOnCategoryId: number): AddonFormValues => ({
    addOnCategoryId,
    name: '',
    description: '',
    foodType: 'VEG',
    price: 0,
    // Most restaurant food is 5% GST; the form's tax picker shows the slabs.
    taxPercentage: 5,
    isActive: true,
    extras: emptyOptionExtras(),
});

// --- Groups ---

export const fetchAddonGroups = async (): Promise<AddonGroup[]> => {
    // No brandId: a restro token's brand is used (outlet tokens get their brand's groups).
    const { data } = await api.get<AddonGroup[]>('/api/v1/menu/addons/categories');
    return data ?? [];
};

export interface AddonGroupValues {
    categoryName: string;
    minCustomizationSelection: number;
    maxCustomizationSelection: number;
    isActive: boolean;
}

// isMandatory is derived, not a setting: the backend rejects a value that disagrees with min > 0.
const groupBody = (values: AddonGroupValues) => ({
    ...values,
    categoryName: values.categoryName.trim(),
    isMandatory: values.minCustomizationSelection > 0,
});

export const createAddonGroup = async (values: AddonGroupValues): Promise<AddonGroup> => {
    const { data } = await api.post<AddonGroup>('/api/v1/menu/addons/categories', groupBody(values));
    return data;
};

export const updateAddonGroup = async (groupId: number, values: AddonGroupValues): Promise<AddonGroup> => {
    const { data } = await api.patch<AddonGroup>(`/api/v1/menu/addons/categories/${groupId}`, groupBody(values));
    return data;
};

/** Deletes the group, its add-ons, and its links to dishes. */
export const deleteAddonGroup = async (groupId: number): Promise<void> => {
    await api.delete(`/api/v1/menu/addons/categories/${groupId}`);
};

// --- Add-ons ---

/** Add-ons of a group: defaults for brand users; the backend scopes outlet tokens to their outlet. */
export const fetchGroupAddons = async (groupId: number): Promise<Addon[]> => {
    const { data } = await api.get<AddonDTO[]>(`/api/v1/menu/addons/categories/${groupId}/variants`);
    return (data ?? []).map(toAddon);
};

export const fetchAddon = async (addonId: number): Promise<Addon> => {
    const { data } = await api.get<AddonDTO>(`/api/v1/menu/addons/${addonId}`);
    return toAddon(data);
};

/**
 * Create/update body. `imageKey`: undefined = unchanged (left out), an S3 key = new upload,
 * "" = remove. Everything else is sent every time: price/availability edits only change
 * the default row (outlet and dish overrides keep their values), so resending an unchanged value
 * changes nothing.
 */
const addonBody = (values: AddonFormValues, imageKey: string | undefined) => ({
    addOnCategoryId: values.addOnCategoryId,
    variantName: values.name.trim(),
    variantDescription: values.description.trim(),
    foodType: values.foodType,
    itemPrice: values.price,
    // No packaging on add-ons (product decision) - always 0.
    packagingCharges: 0,
    taxAmount: values.taxPercentage,
    isActive: values.isActive,
    ...optionExtrasToNode(values.extras),
    ...(imageKey !== undefined && { itemImage: imageKey }),
});

export const createAddon = async (values: AddonFormValues, imageKey: string | undefined): Promise<void> => {
    await api.post('/api/v1/menu/addons', addonBody(values, imageKey));
};

export const updateAddon = async (
    addonId: number,
    values: AddonFormValues,
    imageKey: string | undefined,
): Promise<void> => {
    await api.patch(`/api/v1/menu/addons/${addonId}`, addonBody(values, imageKey));
};

export const deleteAddon = async (addonId: number): Promise<void> => {
    await api.delete(`/api/v1/menu/addons/${addonId}`);
};

/**
 * Outlet users only: in stock at their own outlet. The backend takes the outlet from the token
 * and accepts nothing but availability from it.
 */
export const setOutletAddonStock = async (addonId: number, isAvailable: boolean): Promise<void> => {
    await api.patch(`/api/v1/menu/addons/${addonId}`, { isAvailable });
};
