import { restaurantService } from '@/api/restaurantService';
import { type Restaurant } from '@/types/restaurantTypes';

export const restaurantApi = {
    getRestaurantDetails: async (): Promise<{ name: string; addresses: { id: string; label: string; address: string }[] }> => {
        console.log("Fetching real restaurant details...");
        const response = await restaurantService.getRestaurants();
        const restaurants = response.content;
        
        return {
            name: restaurants[0]?.restroName || "My Restaurant",
            addresses: restaurants.map((r: Restaurant) => ({
                id: r.restroId,
                label: r.restroName,
                address: r.address
            }))
        };
    },

    searchAddresses: async (query: string = '', page: number = 1, limit: number = 5): Promise<{ addresses: { id: string; label: string; address: string }[], total: number, totalPages: number }> => {
        console.log(`Searching real addresses: "${query}", Page: ${page}, Limit: ${limit}`);
        
        const response = await restaurantService.getRestaurants(page - 1, limit);
        const restaurants = response.content;
        
        const filtered = restaurants
            .filter((r: Restaurant) =>
                r.restroName.toLowerCase().includes(query.toLowerCase()) ||
                r.address.toLowerCase().includes(query.toLowerCase())
            )
            .map((r: Restaurant) => ({
                id: r.restroId,
                label: r.restroName,
                address: r.address
            }));

        return {
            addresses: filtered,
            total: response.totalElements,
            totalPages: response.totalPages
        };
    },
};
