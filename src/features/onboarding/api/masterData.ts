import type { Cuisine } from '../../../types/onboardingTypes';
import { MOCK_CUISINES, MOCK_SUPPORT_DATA, delay } from './data/mockOnboardingData';

const CACHE_KEY_CUISINES = 'ustart_cuisines_data';
const CACHE_KEY_TIMESTAMP = 'ustart_cuisines_timestamp';
const CACHE_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export const masterDataService = {
    getCuisines: async (): Promise<Cuisine[]> => {
        // 1. Check Cache
        const cachedData = localStorage.getItem(CACHE_KEY_CUISINES);
        const cachedTimestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);

        if (cachedData && cachedTimestamp) {
            const age = Date.now() - parseInt(cachedTimestamp, 10);
            if (age < CACHE_DURATION_MS) {
                console.log('Returning cached cuisines');
                return JSON.parse(cachedData);
            }
        }

        // 2. Fetch from "API" if cache invalid/missing
        await delay(800); // Simulate network delay
        console.log('Fetching cuisines from API');

        const freshData = MOCK_CUISINES;

        // 3. Update Cache
        if (cachedData !== JSON.stringify(freshData)) {
            localStorage.setItem(CACHE_KEY_CUISINES, JSON.stringify(freshData));
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
            console.log('Cache updated');
        } else {
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
            console.log('Data unchanged, timestamp updated');
        }

        return freshData;
    },

    getContactSupport: async () => {
        await delay(500);
        return MOCK_SUPPORT_DATA;
    }
};

