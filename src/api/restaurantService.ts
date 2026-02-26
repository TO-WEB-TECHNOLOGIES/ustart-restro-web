import { api } from './axios';
import { 
    type Restaurant, 
    type PaginatedResponse, 
    type RestaurantRequestDTO, 
    type RestaurantResponse,
    type AssociatedUser,
    type RestroDay,
    type RestroScheduleDto
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
     * Fetches a single restaurant by ID.
     * GET /api/v1/restaurants/{restroId}
     */
    getRestaurantById: async (restroId: string): Promise<Restaurant> => {
        try {
            const response = await api.get<Restaurant>(`/api/v1/restaurants/${restroId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching restaurant:', error);
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
     * Update an existing restaurant.
     * PATCH /api/v1/restaurants/{restroId}
     */
    updateRestaurant: async (restroId: string, payload: Partial<RestaurantRequestDTO>): Promise<RestaurantResponse> => {
        try {
            const response = await api.patch<RestaurantResponse>(`/api/v1/restaurants/${restroId}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating restaurant:', error);
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
    },

    /**
     * Fetches schedule for a single restaurant.
     * GET /api/v1/schedules/{restroId}
     */
    getSchedule: async (restroId: string): Promise<{ data: { restroId: string, restroName: string, days: RestroDay[] } }> => {
        try {
            const response = await api.get<{ status: string, data: { restroId: string, restroName: string, days: RestroDay[] } }>(`/api/v1/schedules/${restroId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching schedule:', error);
            throw error;
        }
    },

    /**
     * Create a new schedule for a restaurant.
     * POST /api/v1/schedules
     */
    createSchedule: async (payload: RestroScheduleDto): Promise<{ status: string, data: { restroId: string, restroName: string, days: RestroDay[] } }> => {
        try {
            const response = await api.post<{ status: string, data: { restroId: string, restroName: string, days: RestroDay[] } }>('/api/v1/schedules', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating schedule:', error);
            throw error;
        }
    },

    /**
     * Update an existing schedule for a restaurant.
     * PATCH /api/v1/schedules/{restroId}
     */
    updateSchedule: async (restroId: string, payload: { days: RestroDay[] }): Promise<{ status: string, data: { restroId: string, restroName: string, days: RestroDay[] } }> => {
        try {
            const response = await api.patch<{ status: string, data: { restroId: string, restroName: string, days: RestroDay[] } }>(`/api/v1/schedules/${restroId}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating schedule:', error);
            throw error;
        }
    },

    /**
     * Fetches all schedules for a specific brand.
     * GET /api/v1/schedules/brand/{brandId}
     */
    getBrandSchedules: async (brandId: string): Promise<{ status: string, data: { brandId: string, brandName: string, restaurants: { restroId: string, restroName: string, days: RestroDay[] }[] } }> => {
        try {
            const response = await api.get<{ status: string, data: { brandId: string, brandName: string, restaurants: { restroId: string, restroName: string, days: RestroDay[] }[] } }>(`/api/v1/schedules/brand/${brandId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching brand schedules:', error);
            throw error;
        }
    },

    /**
     * Soft-delete a restaurant.
     * DELETE /api/v1/restaurants/{restroId}
     */
    deleteRestaurant: async (restroId: string): Promise<{ restroId: string; restroName: string; message: string }> => {
        try {
            const response = await api.delete<{ restroId: string; restroName: string; message: string }>(
                `/api/v1/restaurants/${restroId}`
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting restaurant:', error);
            throw error;
        }
    },

    /**
     * Update brand details.
     * PATCH /api/v1/brands
     */
    updateBrand: async (payload: {
        isMultipleRestro?: boolean;
        companyName?: string;
        brandName?: string;
        primaryImage?: string;
        cinNumber?: string;
        panNumber?: string;
        gstNumber?: string;
        fssaiLicenseImage?: string;
        address?: string;
        description?: string;
        pocName?: string;
        pocMobileNumber?: string;
        pocEmailAddress?: string;
    }): Promise<{ status: string, message: string, brandId: string }> => {
        try {
            const response = await api.patch<{ status: string, message: string, brandId: string }>('/api/v1/brands', payload);
            return response.data;
        } catch (error) {
            console.error('Error updating brand:', error);
            throw error;
        }
    }
};
