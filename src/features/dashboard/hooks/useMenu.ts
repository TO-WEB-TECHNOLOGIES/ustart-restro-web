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
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        isItemsLoading,
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

    /** Indicates if items for the currently selected category are loading */
    const isCurrentCategoryItemsLoading = selectedCategoryId ? isItemsLoading[selectedCategoryId] : false;

    /**
     * Recursively flattens all items from a category and its subcategories.
     */
    const getAllItems = (cat: Category): MenuItem[] => {
        let items = [...(cat.items || [])];
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
        allItems,
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        isItemsLoading,
        isCurrentCategoryItemsLoading,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery,
        updateMenuItem,
        submitChanges,
        fetchCategories
    };
};
