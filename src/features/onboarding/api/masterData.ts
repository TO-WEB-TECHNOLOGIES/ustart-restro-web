import { api } from '@/api/axios';
import type { Cuisine, ContactSupport } from '../../../types/onboardingTypes';
import { SUPPORT_CONFIG, simulateNetworkDelay } from './data/onboardingConfig';

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

    /**
     * Fetches support contact details.
     * NOTE: Currently using static configuration as per system requirements.
     */
    getContactSupport: async (): Promise<ContactSupport> => {
        try {
            // Simulating API delay for consistent UX
            await simulateNetworkDelay(400);
            return SUPPORT_CONFIG;
        } catch (error) {
            console.error('[MasterData] Fetch support error:', error);
            throw error;
        }
    }
};


