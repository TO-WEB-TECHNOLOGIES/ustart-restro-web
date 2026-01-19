import type { Category, MenuItem } from '@/types/menuTypes';
import { delay, MOCK_MENU_SCORE } from './data/mockData';
import { MOCK_CATEGORIES } from './data/mockMenuData';

/**
 * Data representing menu health metrics.
 */
export interface MenuScoreData {
    score: number;
    thresholdScore: number;
    status: string;
    lastUpdated: string;
}

/**
 * Fetches the current menu categories.
 * Returns categories with itemCount but without the items list.
 * @returns {Promise<Category[]>}
 */
export const fetchCategories = async (): Promise<Category[]> => {
    await delay(800); // Simulate network delay
    // Strip items and inject itemCount for simulation
    return MOCK_CATEGORIES.map(cat => ({
        ...cat,
        itemCount: (cat.items || []).length,
        items: undefined
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
    foodType?: ('veg' | 'non_veg' | 'contains_egg')[];
    discounted?: boolean | null;
}

export const fetchCategoryItems = async (
    categoryId: number,
    page = 1,
    limit = 5,
    searchQuery = '',
    filters: MenuFilters = {}
): Promise<PaginatedItems> => {
    await delay(500); // Faster delay for specific item fetch
    const category = MOCK_CATEGORIES.find(c => c.id === categoryId || c.parentCategoryId === categoryId);
    let allItems = category?.items || [];

    // Simulate Server-Side Search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allItems = allItems.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        );
    }

    // Simulate Server-Side Filtering
    if (filters) {
        const { stock, foodType, discounted } = filters;

        if (stock && stock.length > 0) {
            allItems = allItems.filter(item => {
                const stockValues = Object.values(item.inStock || {});
                const isAvailableAnywhere = stockValues.some(v => v === true);
                const isUnavailableAnywhere = stockValues.some(v => v === false);

                if (stock.includes('in_stock') && isAvailableAnywhere) return true;
                if (stock.includes('out_of_stock') && isUnavailableAnywhere) return true;
                return false;
            });
        }

        if (foodType && foodType.length > 0) {
            allItems = allItems.filter(item => foodType.includes(item.foodType));
        }

        if (discounted !== null && discounted !== undefined) {
            allItems = allItems.filter(item => item.hasDiscount === discounted);
        }
    }

    // Calculate pagination
    const totalPages = Math.ceil(allItems.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    return {
        items: paginatedItems,
        totalPages,
        currentPage: page
    };
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
 * Submits menu changes to the server.
 * @param {Record<string, unknown>[]} updates - The array of item updates.
 * @returns {Promise<{ success: boolean }>}
 */
export const updateMenu = async (updates: Record<string, unknown>[]): Promise<{ success: boolean }> => {
    console.log('API Call: Updating menu with data:', updates);
    await delay(1500); // Simulate network delay
    return { success: true };
};
