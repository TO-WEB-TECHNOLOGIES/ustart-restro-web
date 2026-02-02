import { api } from '@/api/axios';
import type { Cuisine } from '../../../types/onboardingTypes';
import { MOCK_SUPPORT_DATA, delay } from './data/mockOnboardingData';

export interface PageResponse<T> {
    content: T[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export const masterDataService = {
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
            console.error('[MasterData] Fetch error:', error);
            throw error;
        }
    },

    getContactSupport: async () => {
        await delay(500);
        return MOCK_SUPPORT_DATA;
    }
};


