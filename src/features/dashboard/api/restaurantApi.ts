import { ALL_ADDRESSES, delay } from './data/mockData';

export const restaurantApi = {
    getRestaurantDetails: async (): Promise<{ name: string; addresses: { id: string; label: string; address: string }[] }> => {
        await delay(800);
        console.log("Fetching restaurant details...");
        return {
            name: "Spicy Bites Pvt Lts.",
            addresses: ALL_ADDRESSES.slice(0, 5) // Return first 5 by default
        };
    },

    searchAddresses: async (query: string = '', page: number = 1, limit: number = 5): Promise<{ addresses: { id: string; label: string; address: string }[], total: number, totalPages: number }> => {
        await delay(500);
        console.log(`Searching addresses: "${query}", Page: ${page}, Limit: ${limit}`);

        const filtered = ALL_ADDRESSES.filter(addr =>
            addr.label.toLowerCase().includes(query.toLowerCase()) ||
            addr.address.toLowerCase().includes(query.toLowerCase())
        );

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filtered.slice(start, end);

        return {
            addresses: paginated,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit)
        };
    },
};
