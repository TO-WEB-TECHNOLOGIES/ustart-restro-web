import { api } from './axios';
import { 
    type Restaurant, 
    type PaginatedResponse, 
    type RestaurantRequestDTO, 
    type RestaurantResponse,
    type AssociatedUser 
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
    },

    /**
     * Fetches all users associated with the current brand/restaurant.
     * GET /api/v1/restaurants/associated-users
     */
    getAssociatedUsers: async (params?: { brandId?: string; restaurantId?: string }): Promise<AssociatedUser[]> => {
        try {
            const response = await api.get<AssociatedUser[]>('/api/v1/restaurants/associated-users', {
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching associated users:', error);
            throw error;
        }
    },

    /**
     * Update an associated user's profile.
     * PATCH /api/v1/restaurants/users/{userId}
     */
    updateAssociatedUser: async (userId: string, payload: {
        name?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
        isBlocked?: boolean;
        whatsappNumber?: string;
    }): Promise<{ restroId: string; restroName: string; message: string }> => {
        try {
            const response = await api.patch<{ restroId: string; restroName: string; message: string }>(
                `/api/v1/restaurants/users/${userId}`,
                payload
            );
            return response.data;
        } catch (error) {
            console.error('Error updating associated user:', error);
            throw error;
        }
    }
};
