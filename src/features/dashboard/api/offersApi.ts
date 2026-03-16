import { MOCK_OFFERS_DATA, MOCK_DAY_DEALS, delay } from './data/mockData';

const STORAGE_SESSION_KEY = "ustart_flat_deals_data";

export const offersApi = {
    getFlatDealsData: async (): Promise<Record<string, number[]>> => {
        const cachedData = sessionStorage.getItem(STORAGE_SESSION_KEY);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        await delay(1500); // Simulate network latency
        sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(MOCK_OFFERS_DATA));
        return MOCK_OFFERS_DATA;
    },

    getDayDeals: async (type: string, lang: string): Promise<any[]> => {
        await delay(800); // Simulate network latency
        const langData = MOCK_DAY_DEALS[lang] || MOCK_DAY_DEALS['en'];
        return langData[type] || [];
    }
};
