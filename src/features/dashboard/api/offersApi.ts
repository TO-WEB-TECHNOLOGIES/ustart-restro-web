import { MOCK_OFFERS_DATA, delay } from './data/mockData';

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
    }
};
