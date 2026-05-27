import { api } from '@/api/axios';
import type { AddOnCategory, AddOnVariant, FoodType } from '@/types/menuTypes';

/**
 * Fetches all add-on categories.
 * @returns {Promise<AddOnCategory[]>}
 */
export const fetchAddonCategories = async (brandId?: string): Promise<AddOnCategory[]> => {
    const params = brandId ? `?brandId=${brandId}` : '';
    const response = await api.get<AddOnCategory[]>(`/api/v1/menu/addons/categories${params}`);
    return response.data || [];
};

/**
 * Creates a new add-on category.
 * @param {Partial<AddOnCategory>} data
 * @returns {Promise<{ success: boolean; category: AddOnCategory }>}
 */
export const createAddonCategory = async (
    data: {
        categoryName: string;
        minCustomizationSelection?: number;
        maxCustomizationSelection?: number;
        isMandatory?: boolean;
        isActive?: boolean;
        menuItemIds?: number[];
    },
    brandIdParam?: string
): Promise<{ success: boolean; category: AddOnCategory }> => {
    const params = brandIdParam ? `?brandIdParam=${brandIdParam}` : '';
    const response = await api.post<AddOnCategory>(`/api/v1/menu/addons/categories${params}`, {
        categoryName: data.categoryName,
        minCustomizationSelection: data.minCustomizationSelection ?? 1,
        maxCustomizationSelection: data.maxCustomizationSelection ?? 1,
        isMandatory: data.isMandatory ?? false,
        isActive: data.isActive ?? true,
        menuItemIds: data.menuItemIds ?? [],
    });
    return { success: true, category: response.data };
};

/**
 * Updates an existing add-on category.
 * @param {number} categoryId
 * @param {Partial<AddOnCategory>} data
 * @returns {Promise<{ success: boolean; category: AddOnCategory }>}
 */
export const patchAddonCategory = async (
    categoryId: number,
    data: {
        categoryName?: string;
        minCustomizationSelection?: number;
        maxCustomizationSelection?: number;
        isMandatory?: boolean;
        isActive?: boolean;
        menuItemIds?: number[];
    },
    brandIdParam?: string
): Promise<{ success: boolean; category: AddOnCategory }> => {
    const params = brandIdParam ? `?brandIdParam=${brandIdParam}` : '';
    const response = await api.patch<AddOnCategory>(
        `/api/v1/menu/addons/categories/${categoryId}${params}`,
        data
    );
    return { success: true, category: response.data };
};

/**
 * Deletes an add-on category.
 * @param {number} categoryId
 * @returns {Promise<{ success: boolean; category: AddOnCategory }>}
 */
export const deleteAddonCategory = async (categoryId: number): Promise<{ success: boolean; category: AddOnCategory }> => {
    const response = await api.delete<AddOnCategory>(`/api/v1/menu/addons/categories/${categoryId}`);
    return { success: true, category: response.data };
};

/**
 * Fetches all add-on variants under a specific category.
 * @param {number} categoryId
 * @param {string} [restaurantId]
 * @returns {Promise<AddOnVariant[]>}
 */
export const fetchCategoryVariants = async (
    categoryId: number,
    restaurantId?: string
): Promise<AddOnVariant[]> => {
    const params = restaurantId ? `?restaurantId=${restaurantId}` : '';
    const response = await api.get<AddOnVariant[]>(
        `/api/v1/menu/addons/categories/${categoryId}/variants${params}`
    );
    return response.data || [];
};

/**
 * Creates a new add-on variant under a category.
 * @param {Partial<AddOnVariant>} data
 * @returns {Promise<{ success: boolean; variant: AddOnVariant }>}
 */
export const createAddonVariant = async (
    data: {
        addOnCategoryId: number;
        variantName: string;
        variantDescription?: string | null;
        itemImage?: string | null;
        itemPrice?: number;
        packagingCharges?: number;
        taxAmount?: number;
        isActive?: boolean;
        isAvailable?: boolean;
        availability?: {
            allDay: boolean;
            startTime?: string | null;
            endTime?: string | null;
        };
        foodType: FoodType;
    },
    brandIdParam?: string
): Promise<{ success: boolean; variant: AddOnVariant }> => {
    const params = brandIdParam ? `?brandIdParam=${brandIdParam}` : '';
    const payload = {
        addOnCategoryId: data.addOnCategoryId,
        variantName: data.variantName,
        variantDescription: data.variantDescription ?? null,
        itemImage: data.itemImage || '',
        itemPrice: data.itemPrice ?? 0.0,
        packagingCharges: data.packagingCharges ?? 0.0,
        taxAmount: data.taxAmount ?? 5.0,
        isActive: data.isActive ?? true,
        isAvailable: data.isAvailable ?? true,
        availability: data.availability ?? { allDay: true },
        foodType: data.foodType,

        // Conforming to addon.md updated schema: keep all other fields null/empty
        menuItemId: null,
        serves: null,
        portionSize: null,
        weight: null,
        maxQuantity: null,
        isFrosting: null,
        spiceLevel: null,
        itemType: [],
        tags: [],
        allergens: [],
        nutritionalInfo: null
    };
    const response = await api.post<AddOnVariant>(`/api/v1/menu/addons${params}`, payload);
    return { success: true, variant: response.data };
};

/**
 * Updates an existing add-on variant.
 * Supports outlet specific overrides via restaurantId parameter.
 * @param {number} variantId
 * @param {Partial<AddOnVariant>} data
 * @param {string} [restaurantId]
 * @returns {Promise<{ success: boolean; variant: AddOnVariant }>}
 */
export const patchAddonVariant = async (
    variantId: number,
    data: {
        variantName?: string;
        variantDescription?: string | null;
        itemImage?: string | null;
        itemPrice?: number;
        packagingCharges?: number;
        taxAmount?: number;
        isActive?: boolean;
        isAvailable?: boolean;
        availability?: {
            allDay: boolean;
            startTime?: string | null;
            endTime?: string | null;
        };
        foodType?: FoodType;
    },
    restaurantId?: string,
    brandIdParam?: string
): Promise<{ success: boolean; variant: AddOnVariant }> => {
    const queryParams = new URLSearchParams();
    if (restaurantId) queryParams.append('restaurantId', restaurantId);
    if (brandIdParam) queryParams.append('brandIdParam', brandIdParam);

    const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const payload: any = {};
    if (data.variantName !== undefined) payload.variantName = data.variantName;
    if (data.variantDescription !== undefined) payload.variantDescription = data.variantDescription;
    if (data.itemImage !== undefined) payload.itemImage = data.itemImage || '';
    if (data.itemPrice !== undefined) payload.itemPrice = data.itemPrice;
    if (data.packagingCharges !== undefined) payload.packagingCharges = data.packagingCharges;
    if (data.taxAmount !== undefined) payload.taxAmount = data.taxAmount;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.isAvailable !== undefined) payload.isAvailable = data.isAvailable;
    if (data.availability !== undefined) payload.availability = data.availability;
    if (data.foodType !== undefined) payload.foodType = data.foodType;

    const response = await api.patch<AddOnVariant>(
        `/api/v1/menu/addons/${variantId}${qStr}`,
        payload
    );
    return { success: true, variant: response.data };
};

/**
 * Deletes an add-on variant.
 * @param {number} variantId
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteAddonVariant = async (variantId: number, brandIdParam?: string): Promise<{ success: boolean }> => {
    const params = brandIdParam ? `?brandIdParam=${brandIdParam}` : '';
    await api.delete(`/api/v1/menu/addons/${variantId}${params}`);
    return { success: true };
};
