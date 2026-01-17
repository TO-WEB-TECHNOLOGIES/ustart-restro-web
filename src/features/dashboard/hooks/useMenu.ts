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
     * Recursively flattens all items from a category and its subcategories.
     */
    const getAllItems = (cat: Category): MenuItem[] => {
        // Ensure items is an array before spreading (defensive against corrupted state)
        const currentItems = Array.isArray(cat.items) ? cat.items : [];
        let items = [...currentItems];

        if (cat.subCategories && cat.subCategories.length > 0) {
            cat.subCategories.forEach(sub => {
                items = [...items, ...getAllItems(sub)];
            });
        }
        return items;
    };

    /** All items including those from subcategories if a parent is selected */
    const allItems = selectedCategory ? getAllItems(selectedCategory) : [];

    return {
        categories,
        selectedCategory,
        selectedCategoryId,
        searchQuery,
        filters,
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
        fetchCategories,
        fetchNextPage
    };
};
