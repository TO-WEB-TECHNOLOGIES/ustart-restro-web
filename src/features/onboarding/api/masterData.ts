import { api } from '@/api/axios';
import type { Cuisine } from '../../../types/onboardingTypes';

export interface PageResponse<T> {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}

/**
 * MasterDataService provides access to global configuration and helper data 
 * required across the onboarding flow.
 */
export const masterDataService = {
    /**
     * Fetches a paginated and searchable list of cuisines from the production API.
     */
    getCuisines: async (params: { search?: string; page?: number; size?: number } = {}): Promise<PageResponse<Cuisine>> => {
        const { search = '', page = 0, size = 10 } = params;
        try {
            const response = await api.get('/api/v1/cuisines', {
                params: {
                    search,
                    page,
                    size
                }
            });
            return response.data;
        } catch (error) {
            console.error('[MasterData] Fetch cuisines error:', error);
            throw error;
        }
    },
};


