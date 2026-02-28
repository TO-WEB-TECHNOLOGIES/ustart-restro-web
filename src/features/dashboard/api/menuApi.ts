import type { Category, MenuItem } from '@/types/menuTypes';
import { delay, MOCK_MENU_SCORE } from './data/mockData';

/**
 * Data representing menu health metrics.
 */
export interface MenuScoreData {
    score: number;
    thresholdScore: number;
    status: string;
    lastUpdated: string;
}

import { api } from '@/api/axios';

/**
 * Backend DTO for a Menu Category.
 */
export interface CategoryResponseDTO {
    id: number;
    categoryName: string;
    description?: string;
    isActive: boolean;
    discount: number;
    isAbsolute: boolean;
    itemCount: number;
    parentCategoryId?: number | null;
}

/**
 * Backend DTO for a Menu Item.
 */
export interface MenuItemResponseDTO {
    id: number;
    name: string;
    description?: string;
    image?: string;
    imageTag?: string;
    categoryId: number;
    categoryName: string;
    brandId: string;
    restroId?: string;
    isActive: boolean;
    servingOptions: string;
    status: string;
    isCustomizable: boolean;
    variantCount: number;
    originalProductId?: number | null;
    foodType: string;
    servCount: number;
    spiceLevel: string;
    portionSize: string;
    weight: string;
    maxQuantityPerOrder: number;
    frostingType: string;
    isPromoted: boolean;
    itemTypes: string[];
    tags: string[];
    allergyWarnings: string[];
    
    // Price Fields (Restaurant Context Only)
    price?: number;
    discount?: number;
    finalPrice?: number;
    packagingFees?: number;
    taxPercentage?: number;

    // Availability Fields (Restaurant Context Only)
    isAvailable?: boolean;
    isBlocked?: boolean;
    blockedReason?: string | null;

    // Brand Summary Fields
    unavailableRestaurantCount?: number;
}

/**
 * Fetches the current menu categories.
 * Returns categories mapped to the internal `Category` type.
 * @returns {Promise<Category[]>}
 */
export const fetchCategories = async (): Promise<Category[]> => {
    // Note: Assuming a non-paginated or large page fetch for the initial category tree.
    // Replace with standard pagination logic if the backend requires strict pagination for categories.
    const response = await api.get<{ content: CategoryResponseDTO[] }>('/api/v1/menu/categories/?size=100');
    
    // Fallback to empty array if content is missing
    const content = response.data?.content || [];

    return content.map((dto: CategoryResponseDTO) => ({
        id: dto.id,
        name: dto.categoryName,
        description: dto.description,
        status: dto.isActive ? 'active' : 'inactive',
        itemCount: dto.itemCount,
        parentCategoryId: dto.parentCategoryId,
        items: undefined, // Items are fetched on demand
    }));
};

/**
 * Paginated response for menu items.
 */
export interface PaginatedItems {
    items: MenuItem[];
    totalPages: number;
    currentPage: number;
}

/**
 * Fetches items for a specific category with pagination.
 * @param {number} categoryId 
 * @param {number} page 
 * @param {number} limit 
 * @param {string} searchQuery
 * @param {any} filters
 * @returns {Promise<PaginatedItems>}
 */
export interface MenuFilters {
    stock?: ('in_stock' | 'out_of_stock')[];
    foodType?: ('VEG' | 'NON_VEG' | 'CONTAINS_EGG')[];
    discounted?: boolean | null;
}

export const fetchCategoryItems = async (
    categoryId: number,
    page = 1,
    limit = 5,
    searchQuery = '',
    filters: MenuFilters = {}
): Promise<PaginatedItems> => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('categoryId', categoryId.toString());
        queryParams.append('page', (page - 1).toString()); // Backend is 0-indexed
        queryParams.append('size', limit.toString());
        
        if (searchQuery) queryParams.append('searchQuery', searchQuery);
        
        if (filters) {
            if (filters.foodType && filters.foodType.length > 0) {
                // Map frontend food types to backend enum format (e.g., 'veg' -> 'VEG')
                filters.foodType.forEach(ft => queryParams.append('foodType', ft.toUpperCase()));
            }
            if (filters.stock && filters.stock.length > 0) {
                // We map 'in_stock' to isAvailable=true, 'out_of_stock' to isAvailable=false.
                // Assuming the backend handles these mutually exclusive, or we simplify for the first active filter.
                if (filters.stock.includes('in_stock')) queryParams.append('isAvailable', 'true');
                else if (filters.stock.includes('out_of_stock')) queryParams.append('isAvailable', 'false');
            }
            if (filters.discounted !== null && filters.discounted !== undefined) {
                // Approximate 'hasDiscount' to 'isPromoted' based on DTO mapping
                queryParams.append('isPromoted', filters.discounted.toString());
            }
        }

        const response = await api.get<{ content: MenuItemResponseDTO[], totalPages: number, pageable: { pageNumber: number } }>(`/api/v1/menu/items?${queryParams.toString()}`);
        
        const mappedItems: MenuItem[] = (response.data.content || []).map(dto => ({
            id: dto.id,
            name: dto.name,
            description: dto.description || '',
            itemPrice: dto.price || 0, // Fallback if no restro context
            discountAmount: dto.discount || 0,
            price: dto.finalPrice || 0, // Deprecated field mapping for safety
            image: dto.image || '',
            foodType: (dto.foodType?.toUpperCase() || 'VEG') as any, // 'veg' -> 'VEG'
            isCustomisable: dto.isCustomizable,
            inStock: { 'default': dto.isAvailable ?? true }, // Map global availability to local structure
            taxAmount: dto.taxPercentage || 0,
            packagingCharges: dto.packagingFees || 0,
            discountIsAbsolute: true, // Assuming default since API doesn't expose it here explicitly
            status: dto.isActive ? 'active' : 'inactive',
            categoryId: dto.categoryId,
            tags: (dto.tags?.map(t => t.toUpperCase()) || []) as any,
            itemType: (dto.itemTypes?.map(t => t.toUpperCase()) || []) as any,
            serviceType: (dto.servingOptions?.toUpperCase() || 'BOTH') as any,
        }));

        return {
            items: mappedItems,
            totalPages: response.data.totalPages || 1,
            // Convert back to 1-indexed for frontend
            currentPage: (response.data.pageable?.pageNumber || 0) + 1
        };
    } catch (error) {
        console.error(`API Call: Error fetching items for category ${categoryId}:`, error);
        throw error;
    }
};

/**
 * Fetches the current menu score from the server.
 * @returns {Promise<MenuScoreData>}
 */
export const fetchMenuScore = async (): Promise<MenuScoreData> => {
    await delay(800); // Simulate network delay
    return { ...MOCK_MENU_SCORE };
};

/**
 * Submits menu changes to the server concurrently (Batch to Concurrent PATCH).
 * @param {Record<string, unknown>[]} updates - The array of item updates.
 * @returns {Promise<{ success: boolean }>}
 */
export const updateMenu = async (updates: Record<string, unknown>[]): Promise<{ success: boolean }> => {
    try {
        console.log('API Call: Concurrently updating menu items with data:', updates);
        
        // Map batch updates to individual PATCH requests
        const patchPromises = updates.map(update => {
            const { itemId, restroId, ...changes } = update;
            
            // Convert internal fields back to backend payload fields if needed
            const payload: any = { ...changes };
            if (payload.itemPrice !== undefined) payload.itemPrice = payload.itemPrice;
            if (payload.packagingCharges !== undefined) payload.packagingCharges = payload.packagingCharges;
            if (payload.taxAmount !== undefined) payload.taxAmount = payload.taxAmount;
            if (payload.foodType !== undefined) payload.foodType = payload.foodType;
            if (payload.status !== undefined) payload.isActive = payload.status === 'active';
            
            // Remove frontend specific fields that shouldn't go to backend
            delete payload.status;
            delete payload.inStock;
            delete payload.discountIsAbsolute;
            delete payload.price; // Read-only on backend
            delete payload.isCustomisable; // Read-only on backend

            const queryParams = new URLSearchParams();
            queryParams.append('itemId', String(itemId));
            if (restroId) queryParams.append('restaurantId', String(restroId));

            return api.patch(`/api/v1/menu/items?${queryParams.toString()}`, payload);
        });

        await Promise.all(patchPromises);
        return { success: true };
    } catch (error) {
        console.error('API Call: Error updating menu items incrementally:', error);
        throw error;
    }
};

/**
 * Creates a new category on the server.
 * @returns {Promise<{ success: boolean, category: Category }>}
 */
export const createCategory = async (data: { name: string; description?: string; parentCategoryId?: number | null }): Promise<{ success: boolean; category: Category }> => {
    try {
        const payload = {
            categoryName: data.name,
            categoryDescription: data.description,
            parentCategoryId: data.parentCategoryId,
            isActive: true,
            discount: 0,
            isAbsoluteDiscount: true,
        };
        const response = await api.post<CategoryResponseDTO>('/api/v1/menu/categories', payload);
        const dto = response.data;
        const newCategory: Category = {
            id: dto.id,
            name: dto.categoryName,
            description: dto.description,
            parentCategoryId: dto.parentCategoryId,
            subCategories: [],
            itemCount: dto.itemCount || 0,
            currentPage: 1,
            totalPages: 1,
            items: [],
            status: dto.isActive ? 'active' : 'inactive',
        };
        return { success: true, category: newCategory };
    } catch (error) {
        console.error('API Call: Error creating category:', error);
        throw error;
    }
};

/**
 * Creates a new menu item on the server.
 * @returns {Promise<{ success: boolean; item: MenuItem }>}
 */
export const createMenuItem = async (categoryId: number, itemData: Partial<MenuItem>): Promise<{ success: boolean; item: MenuItem }> => {
    try {
        const payload = {
            categoryId: categoryId,
            name: itemData.name || 'New Item',
            itemPrice: itemData.itemPrice || 0,
            packagingCharges: itemData.packagingCharges || 0,
            taxAmount: itemData.taxAmount || 5, // Default tax
            foodType: itemData.foodType || 'VEG',
            serviceType: itemData.serviceType || 'BOTH',
            itemType: itemData.itemType || ['SOLID'],
            isFrosting: itemData.isFrosting || 'NO',
            spiceLevel: itemData.spiceLevel || 1,
            description: itemData.description || '',
            serves: itemData.serves || 1,
            portionSize: itemData.portionSize || 1,
            weight: itemData.weight || '',
            maxQuantity: itemData.maxQuantity || 10,
            tags: itemData.tags || [],
            allergens: itemData.allergens || [],
            availability: itemData.availability || { startTime: "00:00", endTime: "23:59", allDay: true },
            isAvailable: true,
            image: itemData.image || '',
            isAiGeneratedImage: itemData.isAiGeneratedImage || false,
        };

        const response = await api.post<{ menuItemId: number, name: string }>('/api/v1/menu/items', payload);
        
        // Reconstruct local representation for the store since the POST doesn't return the full DTO
        const newItem: MenuItem = {
            id: response.data.menuItemId,
            name: response.data.name,
            description: payload.description,
            itemPrice: payload.itemPrice,
            discountAmount: 0,
            image: payload.image,
            foodType: payload.foodType as any,
            isCustomisable: false,
            inStock: { 'default': true },
            taxAmount: payload.taxAmount,
            packagingCharges: payload.packagingCharges,
            discountIsAbsolute: true,
            categoryId: categoryId,
            serviceType: payload.serviceType as any,
            itemType: payload.itemType as any,
        };

        return { success: true, item: newItem };
    } catch (error) {
        console.error(`API Call: Error creating item in category ${categoryId}:`, error);
        throw error;
    }
};

/**
 * Updates an exisiting category on the server.
 * @returns {Promise<{ success: boolean, category: Category }>}
 */
export const patchCategory = async (categoryId: number, data: { name?: string; description?: string; parentCategoryId?: number | null }): Promise<{ success: boolean; category: Category }> => {
    try {
        const payload: any = {};
        if (data.name !== undefined) payload.categoryName = data.name;
        if (data.description !== undefined) payload.categoryDescription = data.description;
        if (data.parentCategoryId !== undefined) payload.parentCategoryId = data.parentCategoryId;

        const response = await api.patch<CategoryResponseDTO>(`/api/v1/menu/categories/?id=${categoryId}`, payload);
        const dto = response.data;
        
        const updatedCategory: Category = {
            id: dto.id,
            name: dto.categoryName,
            description: dto.description,
            parentCategoryId: dto.parentCategoryId,
            subCategories: [], // Usually subcategories aren't part of a single row update but let's keep it consistent
            itemCount: dto.itemCount || 0,
            currentPage: 1,
            totalPages: 1,
            items: [],
            status: dto.isActive ? 'active' : 'inactive',
        };
        return { success: true, category: updatedCategory };
    } catch (error) {
        console.error(`API Call: Error patching category ${categoryId}:`, error);
        throw error;
    }
};
/**
 * Deletes a category from the server.
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteCategory = async (categoryId: number): Promise<{ success: boolean }> => {
    try {
        await api.delete(`/api/v1/menu/categories/?id=${categoryId}`);
        return { success: true };
    } catch (error) {
        console.error(`API Call: Error deleting category ${categoryId}:`, error);
        throw error;
    }
};

/**
 * Deletes a menu item from the server.
 * @returns {Promise<{ success: boolean }>}
 */
export const deleteMenuItem = async (itemId: number): Promise<{ success: boolean }> => {
    try {
        await api.delete(`/api/v1/menu/items?itemId=${itemId}`);
        return { success: true };
    } catch (error) {
        console.error(`API Call: Error deleting menu item ${itemId}:`, error);
        throw error;
    }
};

/**
 * Toggles the status of a category (active/inactive).
 * @returns {Promise<{ success: boolean }>}
 */
export const toggleCategoryStatus = async (categoryId: number, status: 'active' | 'inactive'): Promise<{ success: boolean }> => {
    try {
        await api.patch(`/api/v1/menu/categories/?id=${categoryId}`, {
            isActive: status === 'active'
        });
        return { success: true };
    } catch (error) {
        console.error(`API Call: Error toggling category ${categoryId} status:`, error);
        throw error;
    }
};
