import { useMenuStore } from '../store/useMenuStore';

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
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery,
        updateMenuItem,
        getSelectedCategory,
        submitChanges,
        fetchCategories
    } = useMenuStore();

    /** The full category object corresponding to the current selectedCategoryId */
    const selectedCategory = getSelectedCategory();

    return {
        categories,
        selectedCategory,
        selectedCategoryId,
        searchQuery,
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery,
        updateMenuItem,
        submitChanges,
        fetchCategories
    };
};
