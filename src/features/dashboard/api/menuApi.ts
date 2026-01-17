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
 * @param {string} categoryId 
 * @param {number} page 
 * @param {number} limit 
 * @param {string} searchQuery
 * @param {any} filters
 * @returns {Promise<PaginatedItems>}
 */
export const fetchCategoryItems = async (
    categoryId: string,
    page = 1,
    limit = 5,
    searchQuery = '',
    filters: any = {}
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
        if (filters.stock && filters.stock.length > 0) {
            allItems = allItems.filter(item => {
                if (filters.stock.includes('in_stock') && item.inStock) return true;
                if (filters.stock.includes('out_of_stock') && !item.inStock) return true;
                return false;
            });
        }

        if (filters.foodType && filters.foodType.length > 0) {
            allItems = allItems.filter(item => filters.foodType.includes(item.foodType));
        }

        if (filters.discounted !== null) {
            allItems = allItems.filter(item => item.hasDiscount === filters.discounted);
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
 * @param {Category[]} categories - The updated list of categories and items.
 * @returns {Promise<{ success: boolean }>}
 */
export const updateMenu = async (categories: Category[]): Promise<{ success: boolean }> => {
    console.log('API Call: Updating menu with data:', categories);
    await delay(1500); // Simulate network delay
    return { success: true };
};
