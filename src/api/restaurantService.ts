import { api } from './axios';
import { type Restaurant, type PaginatedResponse } from '@/types/restaurantTypes';

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
    }
};
