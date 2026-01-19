import { useMenuStore } from '../store/useMenuStore';
import { type MenuItem, type Category } from '../../../types/menuTypes';

/**
 * Custom hook to interact with the Menu Store.
 * Provides access to categories, selection state, search query, and their respective setters.
 * Also handles submission of changes and tracking of dirty/submitting states.
 * 
 * @returns {Object} Menu state and utility functions
 */
export const useMenu = () => {
    const {
        categories,
        selectedCategoryId,
        searchQuery,
        filters,
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        isItemsLoading,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery,
        setFilters,
        clearFilters,
        updateMenuItem,
        getSelectedCategory,
        submitChanges,
        fetchCategories,
        fetchNextPage
    } = useMenuStore();

    /** The full category object corresponding to the current selectedCategoryId */
    const selectedCategory = getSelectedCategory();

    /** Indicates if items for the currently selected category are loading */
    const isCurrentCategoryItemsLoading = selectedCategoryId ? isItemsLoading[selectedCategoryId] : false;

    /** Pagination helper for the selected category */
    const hasMore = selectedCategory
        ? (selectedCategory.currentPage || 0) < (selectedCategory.totalPages || 0)
        : false;

    /**
     * Recursively flattens all items and applies draft changes from updatedItems.
     */
    const getAllItems = (cat: Category): MenuItem[] => {
        const currentItems = Array.isArray(cat.items) ? cat.items : [];
        const mergedItems = currentItems.map(item => {
            const draft = useMenuStore.getState().updatedItems[item.id];
            return draft ? draft.current : item;
        });

        let items = [...mergedItems];

        if (cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach(sub => {
                items = [...items, ...getAllItems(sub)];
            });
        }
        return items;
    };

    /** All items including those from subcategories if a parent is selected */
    const allItems = selectedCategory ? getAllItems(selectedCategory) : [];

    /** Draft-aware selected category */
    const draftSelectedCategory = selectedCategory ? {
        ...selectedCategory,
        items: selectedCategory.items?.map(item => {
            const draft = useMenuStore.getState().updatedItems[item.id];
            return draft ? draft.current : item;
        })
    } : undefined;

    return {
        categories,
        selectedCategory: draftSelectedCategory,
        selectedCategoryId,
        searchQuery,
        filters,
        updatedItems: useMenuStore().updatedItems,
        allItems,
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        isItemsLoading,
        isCurrentCategoryItemsLoading,
        hasMore,
        currentPage: selectedCategory?.currentPage || 0,
        totalPages: selectedCategory?.totalPages || 0,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery,
        setFilters,
        clearFilters,
        updateMenuItem,
        submitChanges,
        revertChanges: useMenuStore().revertChanges,
        fetchCategories,
        fetchNextPage
    };
};
