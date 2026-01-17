import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Category, type MenuItem } from '../../../types/menuTypes';
import { fetchMenuScore, updateMenu, fetchCategories } from '../api/menuApi';

/**
 * Interface representing the state and actions for the Menu Store.
 */
export interface MenuStore {
    // --- Menu Editor State ---
    /** Array of menu categories */
    categories: Category[];
    /** ID of the currently selected category */
    selectedCategoryId: string | null;
    /** Current search query for filtering menu items */
    searchQuery: string;
    /** Tracks if any changes have been made since the last submission */
    isDirty: boolean;
    /** Indicates if a submission is currently in progress */
    isSubmitting: boolean;
    /** Loading state for categories fetching */
    isCategoriesLoading: boolean;

    /** Updates the categories in the store */
    setCategories: (categories: Category[]) => void;
    /** Updates the selected category ID */
    setSelectedCategoryId: (id: string | null) => void;
    /** Updates the search query string */
    setSearchQuery: (query: string) => void;
    /** Updates a specific menu item */
    updateMenuItem: (categoryId: string, itemId: string, updates: Partial<MenuItem>) => void;
    /** Helper function to get the full category object for the selected ID */
    getSelectedCategory: () => Category | undefined;
    /** Submits all local changes to the API */
    submitChanges: () => Promise<void>;
    /** Fetches categories from the API */
    fetchCategories: () => Promise<void>;

    // --- Menu Score State ---
    /** Overall health score of the menu */
    score: number;
    /** Target score threshold for optimal performance */
    thresholdScore: number;
    /** Human-readable status string (e.g., 'Exemplary') */
    status: string;
    /** ISO string of the last time the score was calculated */
    lastUpdated: string;
    /** loading state for score fetching */
    isLoading: boolean;
    /** Fetches the latest menu score from the API */
    fetchScore: () => Promise<void>;
}

/**
 * Zustand store for managing menu data with SessionStorage persistence.
 * Logic is decoupled from mock data; interact always through the API layer.
 */
export const useMenuStore = create<MenuStore>()(
    persist(
        (set, get) => ({
            // --- Initial Menu Editor State ---
            categories: [],
            selectedCategoryId: null,
            searchQuery: '',
            isDirty: false,
            isSubmitting: false,
            isCategoriesLoading: false,

            setCategories: (categories) => set({ categories, isDirty: true }),
            setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
            setSearchQuery: (searchQuery) => set({ searchQuery }),

            /**
             * Fetches categories from the API and initializes the store.
             */
            fetchCategories: async () => {
                if (get().isCategoriesLoading) return;
                set({ isCategoriesLoading: true });
                try {
                    const categories = await fetchCategories();
                    set({
                        categories,
                        isCategoriesLoading: false,
                        // Set first category as selected if none selected
                        selectedCategoryId: get().selectedCategoryId || (categories.length > 0 ? categories[0].id : null)
                    });
                } catch (error) {
                    console.error('Failed to fetch categories:', error);
                    set({ isCategoriesLoading: false });
                }
            },

            /**
             * Updates a menu item locally and marks the store as dirty.
             */
            updateMenuItem: (categoryId, itemId, updates) => {
                const { categories } = get();
                const updatedCategories = categories.map(cat => {
                    if (cat.id !== categoryId) return cat;
                    return {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === itemId ? { ...item, ...updates } : item
                        )
                    };
                });
                set({ categories: updatedCategories, isDirty: true });
            },

            getSelectedCategory: () => {
                const { categories, selectedCategoryId } = get();
                return categories.find(cat => cat.id === selectedCategoryId);
            },

            /**
             * Performs an API call to sync local changes with the server.
             * Resets the isDirty flag upon success.
             */
            submitChanges: async () => {
                const { categories, isDirty, isSubmitting } = get();
                if (!isDirty || isSubmitting) return;

                set({ isSubmitting: true });
                try {
                    const response = await updateMenu(categories);
                    if (response.success) {
                        set({ isDirty: false, isSubmitting: false });
                        alert('Changes submitted successfully!');
                    }
                } catch (error) {
                    console.error('Failed to submit menu changes:', error);
                    set({ isSubmitting: false });
                    alert('Failed to submit changes. Please try again.');
                }
            },

            // --- Initial Menu Score State ---
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
        }),
        {
            name: 'menu-editor-storage',
            storage: createJSONStorage(() => sessionStorage),
            // Only persist editor-related state
            partialize: (state) => ({
                categories: state.categories,
                selectedCategoryId: state.selectedCategoryId,
                isDirty: state.isDirty,
            }),
        }
    )
);
