import { delay, MOCK_MENU_SCORE } from './data/mockData';

export interface MenuScoreData {
    score: number;
    thresholdScore: number;
    status: string;
    lastUpdated: string;
}

export const fetchMenuScore = async (): Promise<MenuScoreData> => {
    await delay(800); // Simulate network delay
    return { ...MOCK_MENU_SCORE };
};
