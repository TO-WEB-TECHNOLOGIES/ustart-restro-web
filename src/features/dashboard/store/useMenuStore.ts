import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Category, type MenuItem } from '../../../types/menuTypes';
import { fetchMenuScore, updateMenu, fetchCategories, fetchCategoryItems } from '../api/menuApi';

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
    /** Loading state for items within categories (mapped by categoryId) */
    isItemsLoading: Record<string, boolean>;
    /** Timestamp of the last successful categories fetch */
    lastCategoriesFetch: number | null;

    /** Updates the categories in the store */
    setCategories: (categories: Category[]) => void;
    /** Updates the selected category ID and fetches items if needed */
    setSelectedCategoryId: (id: string | null) => void;
    /** Updates the search query string */
    setSearchQuery: (query: string) => void;
    /** Updates a specific menu item */
    updateMenuItem: (categoryId: string, itemId: string, updates: Partial<MenuItem>) => void;
    /** Helper function to get the full category object for the selected ID */
    getSelectedCategory: () => Category | undefined;
    /** Submits all local changes to the API */
    submitChanges: () => Promise<void>;
    /** Fetches categories from the API with caching and revalidation */
    fetchCategories: (force?: boolean) => Promise<void>;
    /** Fetches items for a specific category on demand (initial or refresh) */
    fetchCategoryItems: (categoryId: string) => Promise<void>;
    /** Fetches the next page of items for infinite scroll */
    fetchNextPage: (categoryId: string) => Promise<void>;

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
 * Helper to transform a flat list of categories into a tree structure.
 * Uses itemCount provided by the API and maintains hierarchy.
 */
const buildCategoryTree = (flatCategories: Category[]): Category[] => {
    const categoryMap: Record<string, Category> = {};
    const roots: Category[] = [];

    // Initialize map
    flatCategories.forEach(cat => {
        categoryMap[cat.id] = {
            ...cat,
            items: cat.items || undefined,
            subCategories: [],
            itemCount: cat.itemCount || 0,
            currentPage: 0,
            totalPages: 1
        };
    });

    // Link children to parents
    flatCategories.forEach(cat => {
        if (cat.parentCategoryId && categoryMap[cat.parentCategoryId]) {
            categoryMap[cat.parentCategoryId].subCategories?.push(categoryMap[cat.id]);
        } else {
            roots.push(categoryMap[cat.id]);
        }
    });

    return roots;
};

/**
 * Helper to update a single category within the hierarchical tree.
 */
const updateCategoryInTree = (categories: Category[], categoryId: string, updates: Partial<Category>): Category[] => {
    return categories.map(cat => {
        if (cat.id === categoryId) {
            return { ...cat, ...updates };
        }
        if (cat.subCategories && cat.subCategories.length > 0) {
            return {
                ...cat,
                subCategories: updateCategoryInTree(cat.subCategories, categoryId, updates)
            };
        }
        return cat;
    });
};

/**
 * Zustand store for managing menu data with SessionStorage persistence.
 * Implements a stale-while-revalidate caching strategy.
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
            isItemsLoading: {},
            lastCategoriesFetch: null,

            setCategories: (categories) => {
                set({ categories, isDirty: true });
            },

            setSelectedCategoryId: (id) => {
                set({ selectedCategoryId: id });
                if (id) {
                    const findSelected = (list: Category[]): Category | undefined => {
                        for (const cat of list) {
                            if (cat.id === id) return cat;
                            if (cat.subCategories) {
                                const found = findSelected(cat.subCategories);
                                if (found) return found;
                            }
                        }
                    };
                    const category = findSelected(get().categories);
                    // If no items are loaded yet (currentPage starts at 0 or items is undefined)
                    if (category && (!category.items || (category.currentPage || 0) === 0)) {
                        get().fetchCategoryItems(id);
                    }
                }
            },

            setSearchQuery: (searchQuery) => set({ searchQuery }),

            fetchCategories: async (force = false) => {
                const { categories, lastCategoriesFetch, isCategoriesLoading, isDirty } = get();
                const REVALIDATE_TIME = 30 * 1000;

                if (isCategoriesLoading) return;

                const isFresh = !force && lastCategoriesFetch && (Date.now() - lastCategoriesFetch < REVALIDATE_TIME);

                if (isFresh && categories.length > 0) {
                    return;
                }

                if (isDirty && categories.length > 0 && !force) {
                    return;
                }

                set({ isCategoriesLoading: true });

                try {
                    const flatData = await fetchCategories();
                    const treeData = buildCategoryTree(flatData);

                    const finalSelectedId = get().selectedCategoryId || (treeData.length > 0 ? treeData[0].id : null);

                    set({
                        categories: treeData,
                        isCategoriesLoading: false,
                        lastCategoriesFetch: Date.now(),
                        selectedCategoryId: finalSelectedId
                    });

                    if (finalSelectedId) {
                        get().fetchCategoryItems(finalSelectedId);
                    }
                } catch (error) {
                    console.error('Menu Store: Failed to fetch categories:', error);
                    set({ isCategoriesLoading: false });
                }
            },

            /**
             * Initial items fetch for a category.
             */
            fetchCategoryItems: async (categoryId: string) => {
                const { isItemsLoading, categories } = get();
                if (isItemsLoading[categoryId]) return;

                set(state => ({
                    isItemsLoading: { ...state.isItemsLoading, [categoryId]: true }
                }));

                try {
                    const response = await fetchCategoryItems(categoryId, 1, 5); // Start with page 1
                    const updatedCategories = updateCategoryInTree(categories, categoryId, {
                        items: response.items,
                        currentPage: response.currentPage,
                        totalPages: response.totalPages
                    });

                    set(state => ({
                        categories: updatedCategories,
                        isItemsLoading: { ...state.isItemsLoading, [categoryId]: false }
                    }));
                } catch (error) {
                    console.error(`Menu Store: Failed to fetch items for category ${categoryId}:`, error);
                    set(state => ({
                        isItemsLoading: { ...state.isItemsLoading, [categoryId]: false }
                    }));
                }
            },

            /**
             * Infinite scroll next page fetch.
             */
            fetchNextPage: async (categoryId: string) => {
                const { isItemsLoading, categories } = get();
                if (isItemsLoading[categoryId]) return;

                const findRecursive = (list: Category[]): Category | undefined => {
                    for (const cat of list) {
                        if (cat.id === categoryId) return cat;
                        if (cat.subCategories) {
                            const found = findRecursive(cat.subCategories);
                            if (found) return found;
                        }
                    }
                };

                const currentCategory = findRecursive(categories);
                if (!currentCategory) return;

                const nextPage = (currentCategory.currentPage || 0) + 1;
                const totalPages = currentCategory.totalPages || 1;

                if (nextPage > totalPages) return;

                set(state => ({
                    isItemsLoading: { ...state.isItemsLoading, [categoryId]: true }
                }));

                try {
                    const response = await fetchCategoryItems(categoryId, nextPage, 5);
                    const baseItems = Array.isArray(currentCategory.items) ? currentCategory.items : [];
                    const updatedItems = [...baseItems, ...response.items];

                    const updatedCategories = updateCategoryInTree(categories, categoryId, {
                        items: updatedItems,
                        currentPage: response.currentPage,
                        totalPages: response.totalPages
                    });

                    set(state => ({
                        categories: updatedCategories,
                        isItemsLoading: { ...state.isItemsLoading, [categoryId]: false }
                    }));
                } catch (error) {
                    console.error(`Menu Store: Failed to fetch next page for category ${categoryId}:`, error);
                    set(state => ({
                        isItemsLoading: { ...state.isItemsLoading, [categoryId]: false }
                    }));
                }
            },

            updateMenuItem: (categoryId, itemId, updates) => {
                const { categories } = get();

                const updateRecursive = (list: Category[]): Category[] => {
                    return list.map(cat => {
                        if (cat.id === categoryId && Array.isArray(cat.items)) {
                            const updatedItems = cat.items.map(item =>
                                item.id === itemId ? { ...item, ...updates } : item
                            );
                            return {
                                ...cat,
                                items: updatedItems
                            };
                        }
                        if (cat.subCategories && cat.subCategories.length > 0) {
                            return {
                                ...cat,
                                subCategories: updateRecursive(cat.subCategories)
                            };
                        }
                        return cat;
                    });
                };

                set({ categories: updateRecursive(categories), isDirty: true });
            },

            getSelectedCategory: () => {
                const { categories, selectedCategoryId } = get();
                if (!selectedCategoryId) return undefined;

                const findRecursive = (list: Category[]): Category | undefined => {
                    for (const cat of list) {
                        if (cat.id === selectedCategoryId) return cat;
                        if (cat.subCategories && cat.subCategories.length > 0) {
                            const found = findRecursive(cat.subCategories);
                            if (found) return found;
                        }
                    }
                    return undefined;
                };

                return findRecursive(categories);
            },

            submitChanges: async () => {
                const { categories, isDirty, isSubmitting } = get();
                if (!isDirty || isSubmitting) return;

                set({ isSubmitting: true });
                try {
                    const response = await updateMenu(categories);
                    if (response.success) {
                        set({
                            isDirty: false,
                            isSubmitting: false,
                            lastCategoriesFetch: null
                        });
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
            partialize: (state) => ({
                categories: state.categories,
                selectedCategoryId: state.selectedCategoryId,
                isDirty: state.isDirty,
                lastCategoriesFetch: state.lastCategoriesFetch,
            }),
        }
    )
);
