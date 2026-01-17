import { create } from 'zustand';
import { type Category } from '../../../types/menuTypes';
import { MOCK_CATEGORIES } from '../api/data/mockMenuData';
import { fetchMenuScore } from '../api/menuApi';

export interface MenuStore {
    // Menu Editor State
    categories: Category[];
    selectedCategoryId: string | null;
    searchQuery: string;
    setCategories: (categories: Category[]) => void;
    setSelectedCategoryId: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    getSelectedCategory: () => Category | undefined;

    // Menu Score State
    score: number;
    thresholdScore: number;
    status: string;
    lastUpdated: string;
    isLoading: boolean;
    fetchScore: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
    // Initial Menu Editor State
    categories: MOCK_CATEGORIES,
    selectedCategoryId: MOCK_CATEGORIES[0].id,
    searchQuery: '',

    setCategories: (categories) => set({ categories }),
    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    getSelectedCategory: () => {
        const { categories, selectedCategoryId } = get();
        return categories.find(cat => cat.id === selectedCategoryId);
    },

    // Initial Menu Score State
    score: 0,
    thresholdScore: 0,
    status: '',
    lastUpdated: '',
    isLoading: false,

    fetchScore: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
            const data = await fetchMenuScore();
            set({
                score: data.score,
                thresholdScore: data.thresholdScore,
                status: data.status,
                lastUpdated: data.lastUpdated,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch menu score:', error);
            set({ isLoading: false });
        }
    }
}));
