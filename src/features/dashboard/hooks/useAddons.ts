import { useCallback } from 'react';
import { useAddonStore } from '../store/useAddonStore';
import { useAuth } from '@/context/AuthContext';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';
import type { AddOnVariant } from '@/types/menuTypes';

/**
 * Custom hook to interact with the Addon Store.
 * Automatically injects authentication role permissions and restaurant selection contexts.
 */
export const useAddons = () => {
    const { user } = useAuth();
    const { selectedAddressId } = useRestaurantStore();

    const {
        addonCategories,
        selectedCategoryId,
        searchQuery,
        filters,
        updatedVariants,
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        isVariantsLoading,
        setSelectedCategoryId,
        setSearchQuery,
        setFilters,
        clearFilters,
        fetchCategories,
        fetchCategoryVariants,
        updateAddonVariant,
        addNewVariantLocally,
        submitChanges,
        revertChanges,
        addCategory,
        updateCategory,
        deleteCategory,
        deleteVariant
    } = useAddonStore();

    // 1. Resolve role and access permissions
    // Brand users have no restroId in JWT claims or have brandId and full CRUD rights.
    // Outlet users have restroId present, limiting them to Price and Stock updates.
    const isOutletUser = !!user?.restroId;
    const canManageMetadata = !isOutletUser; // Can CRUD category and variant definitions globally

    // 2. Resolve Restaurant/Address Override Context
    const activeAddressId = selectedAddressId === ALL_LOCATIONS_ID ? null : selectedAddressId;

    // 3. Find selected category
    const selectedCategory = addonCategories.find(c => c.addOnId === selectedCategoryId);
    const isCurrentCategoryVariantsLoading = selectedCategoryId ? !!isVariantsLoading[selectedCategoryId] : false;

    // 4. Compute draft-aware search-filtered and stock-filtered variants
    const allVariants = selectedCategory?.variants || [];
    
    const filteredVariants = allVariants.filter((variant: AddOnVariant) => {
        // Apply Query Filter
        if (searchQuery && !variant.variantName.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        // Apply Stock Filter
        if (filters.stock.length > 0) {
            const inStock = variant.isAvailable;
            if (filters.stock.includes('in_stock') && !inStock) return false;
            if (filters.stock.includes('out_of_stock') && inStock) return false;
        }

        return true;
    });

    /**
     * Stable wrapper for fetching categories
     */
    const handleFetchCategories = useCallback((force?: boolean) => {
        return fetchCategories(user?.brandId, force);
    }, [fetchCategories, user?.brandId]);

    /**
     * Stable wrapper for fetching category variants
     */
    const handleFetchCategoryVariants = useCallback((categoryId: number) => {
        return fetchCategoryVariants(categoryId, activeAddressId || undefined);
    }, [fetchCategoryVariants, activeAddressId]);

    /**
     * Submission helper that wraps the store's submit changes and binds the correct IDs.
     */
    const handleSave = useCallback(() => {
        return submitChanges(activeAddressId, user?.brandId);
    }, [submitChanges, activeAddressId, user?.brandId]);

    /**
     * Category add wrapper binding brand id
     */
    const handleAddCategory = useCallback((data: {
        categoryName: string;
        minCustomizationSelection?: number;
        maxCustomizationSelection?: number;
        isMandatory?: boolean;
        isActive?: boolean;
        menuItemIds?: number[];
    }) => {
        return addCategory(data, user?.brandId);
    }, [addCategory, user?.brandId]);

    /**
     * Category update wrapper binding brand id
     */
    const handleUpdateCategory = useCallback((categoryId: number, data: Parameters<typeof updateCategory>[1]) => {
        return updateCategory(categoryId, data, user?.brandId);
    }, [updateCategory, user?.brandId]);

    /**
     * Delete variant wrapper binding brand id
     */
    const handleDeleteVariant = useCallback((categoryId: number, variantId: number) => {
        return deleteVariant(categoryId, variantId, user?.brandId);
    }, [deleteVariant, user?.brandId]);

    return {
        addonCategories,
        selectedCategory,
        selectedCategoryId,
        searchQuery,
        filters,
        updatedVariants,
        variants: filteredVariants,
        isDirty,
        isSubmitting,
        isCategoriesLoading,
        isCurrentCategoryVariantsLoading,
        isOutletUser,
        canManageMetadata,
        activeAddressId,
        brandId: user?.brandId,

        setSelectedCategoryId,
        setSearchQuery,
        setFilters,
        clearFilters,
        fetchCategories: handleFetchCategories,
        fetchCategoryVariants: handleFetchCategoryVariants,
        updateAddonVariant,
        addNewVariantLocally,
        submitChanges: handleSave,
        revertChanges,
        addCategory: handleAddCategory,
        updateCategory: handleUpdateCategory,
        deleteCategory,
        deleteVariant: handleDeleteVariant
    };
};
