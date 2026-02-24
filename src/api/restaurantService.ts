import { api } from './axios';
import { 
    type Restaurant, 
    type PaginatedResponse, 
    type RestaurantRequestDTO, 
    type RestaurantResponse 
} from '@/types/restaurantTypes';

export const restaurantService = {
    /**
     * Fetches all restaurants for the authenticated user/brand with pagination.
     * GET /api/v1/restaurants
     */
    getRestaurants: async (page = 0, size = 10): Promise<PaginatedResponse<Restaurant>> => {
        try {
            const response = await api.get<PaginatedResponse<Restaurant>>('/api/v1/restaurants', {
                params: { page, size }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            throw error;
        }
    },

    /**
     * Create a new restaurant.
     * POST /api/v1/restaurants
     */
    createRestaurant: async (payload: RestaurantRequestDTO): Promise<RestaurantResponse> => {
        try {
            const response = await api.post<RestaurantResponse>('/api/v1/restaurants', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating restaurant:', error);
            throw error;
        }
    }
};
