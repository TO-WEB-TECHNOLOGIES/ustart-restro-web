import { api } from '@/api/axios';
import type { Cuisine, PosProvider } from '../../../types/onboardingTypes';

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
     * Fetches a paginated and searchable list of POS providers from the production API -
     * a DB-seeded master list, same shape/pattern as getCuisines.
     */
    getPosProviders: async (params: { search?: string; page?: number; size?: number } = {}): Promise<PageResponse<PosProvider>> => {
        const { search = '', page = 0, size = 20 } = params;
        try {
            const response = await api.get('/api/v1/pos-providers', {
                params: {
                    search,
                    page,
                    size
                }
            });
            return response.data;
        } catch (error) {
            console.error('[MasterData] Fetch POS providers error:', error);
            throw error;
        }
    },
};


