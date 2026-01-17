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
 * Fetches items for a specific category.
 * @param {string} categoryId 
 * @returns {Promise<MenuItem[]>}
 */
export const fetchCategoryItems = async (categoryId: string): Promise<MenuItem[]> => {
    await delay(500); // Faster delay for specific item fetch
    const category = MOCK_CATEGORIES.find(c => c.id === categoryId);
    return category?.items || [];
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
