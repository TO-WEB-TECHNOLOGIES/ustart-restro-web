import { useMenuStore } from '../store/useMenuStore';

export const useMenu = () => {
    const {
        categories,
        selectedCategoryId,
        searchQuery,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery,
        getSelectedCategory
    } = useMenuStore();

    const selectedCategory = getSelectedCategory();

    return {
        categories,
        selectedCategory,
        selectedCategoryId,
        searchQuery,
        setCategories,
        setSelectedCategoryId,
        setSearchQuery
    };
};
