
// Simulating API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface Cuisine {
    cuisineId: number;
    cuisineName: string;
    cuisineDescription: string;
}

const CACHE_KEY_CUISINES = 'ustart_cuisines_data';
const CACHE_KEY_TIMESTAMP = 'ustart_cuisines_timestamp';
const CACHE_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const MOCK_CUISINES: Cuisine[] = [
    { cuisineId: 1, cuisineName: 'North Indian', cuisineDescription: 'Curries, Tandoori, and Naan' },
    { cuisineId: 2, cuisineName: 'Chinese', cuisineDescription: 'Noodles, Fried Rice, and Dim Sums' },
    { cuisineId: 3, cuisineName: 'South Indian', cuisineDescription: 'Dosa, Idli, and Sambhar' },
    { cuisineId: 4, cuisineName: 'Italian', cuisineDescription: 'Pizza, Pasta, and Risotto' },
    { cuisineId: 5, cuisineName: 'Continental', cuisineDescription: 'Steaks, Salads, and Grills' },
    { cuisineId: 6, cuisineName: 'Mughlai', cuisineDescription: 'Rich curries and Kebabs' },
    { cuisineId: 7, cuisineName: 'Fast Food', cuisineDescription: 'Burgers, Fries, and Sandwiches' },
    { cuisineId: 8, cuisineName: 'Beverages', cuisineDescription: 'Coffee, Tea, and Shakes' },
    { cuisineId: 9, cuisineName: 'Desserts', cuisineDescription: 'Cakes, Ice Creams, and Sweets' },
    { cuisineId: 10, cuisineName: 'Biryani', cuisineDescription: 'Aromatic Rice Dishes' },
];

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

        // In a real scenario, we might verify if the data has actually changed via ETag or hash
        // For this mock, we assume fetching always gives us the fresh (or same) data.
        // We will store it.
        const freshData = MOCK_CUISINES;

        // 3. Update Cache
        // Logic: "don't update if its same else replace"
        // Since we parsed the string above, we can compare strings, or objects.
        // String comparison is fastest for simple JSONs.
        if (cachedData !== JSON.stringify(freshData)) {
            localStorage.setItem(CACHE_KEY_CUISINES, JSON.stringify(freshData));
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
            console.log('Cache updated');
        } else {
            // Even if data is same, we might want to extend timestamp? 
            // The user said "revlidate... don't update if its same". 
            // Usually this means we don't trigger a write/render if data is identical.
            // But we should update timestamp to reset the 2-day timer if it's still valid/fresh?
            // Let's just update timestamp to confirm revalidation.
            localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
            console.log('Data unchanged, timestamp updated');
        }

        return freshData;
    },

    getContactSupport: async () => {
        await delay(500);
        return {
            email: 'partners@ustart.com',
            phone: '+91 7827234027',
            supportId: 'UST-8829-XJ'
        };
    }
};
