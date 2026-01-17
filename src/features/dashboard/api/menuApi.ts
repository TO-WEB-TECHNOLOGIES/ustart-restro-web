import type { Category } from '@/types/menuTypes';
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
 * Fetches the current menu categories and items.
 * @returns {Promise<Category[]>}
 */
export const fetchCategories = async (): Promise<Category[]> => {
    await delay(800); // Simulate network delay
    return [...MOCK_CATEGORIES];
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
