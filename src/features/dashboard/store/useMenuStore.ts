import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Category, type MenuItem } from '../../../types/menuTypes';
import { fetchMenuScore, updateMenu, fetchCategories, fetchCategoryItems, createCategory, createMenuItem, patchCategory, deleteCategory, toggleCategoryStatus, deleteMenuItem } from '../api/menuApi';

/**
 * Interface representing the state and actions for the Menu Store.
 */
export interface MenuStore {
    // --- Menu Editor State ---
    /** Array of menu categories */
    categories: Category[];
    /** Map of modified items: Key is Item ID, Value is { original, current } */
    updatedItems: Record<number, {
        original: MenuItem;
        current: MenuItem;
        modifiedByAddressId?: string | null;
        isNewItem?: boolean;
        scheduledDate?: string | null;
        addToStockImmediately?: boolean;
    }>;
    /** ID of the currently selected category */
    selectedCategoryId: number | null;
    /** Current search query for filtering menu items */
    searchQuery: string;
    /** Current filters for menu items */
    filters: {
        stock: ('in_stock' | 'out_of_stock')[];
        foodType: ('VEG' | 'NON_VEG' | 'CONTAINS_EGG')[];
        discounted: boolean | null;
    };
    /** Tracks if any changes have been made since the last submission */
    isDirty: boolean;
    /** Indicates if a submission is currently in progress */
    isSubmitting: boolean;
    /** Loading state for categories fetching */
    isCategoriesLoading: boolean;
    /** Loading state for items within categories (mapped by categoryId) */
    isItemsLoading: Record<number, boolean>;
    /** Timestamp of the last successful categories fetch */
    lastCategoriesFetch: number | null;

    /** Updates the categories in the store */
    setCategories: (categories: Category[]) => void;
    /** Updates the selected category ID and fetches items if needed */
    setSelectedCategoryId: (id: number | null) => void;
    /** Updates the search query string */
    setSearchQuery: (query: string) => void;
    /** Updates the filters */
    setFilters: (filters: Partial<MenuStore['filters']>) => void;
    /** Clears all filters */
    clearFilters: () => void;
    /** Updates a specific menu item */
    updateMenuItem: (categoryId: number, itemId: number, updates: Partial<MenuItem>, addressId?: string | null) => void;
    /** Helper function to get the full category object for the selected ID */
    getSelectedCategory: () => Category | undefined;
    /** Submits all local changes to the API */
    submitChanges: () => Promise<void>;
    /** Fetches categories from the API with caching and revalidation */
    fetchCategories: (force?: boolean) => Promise<void>;
    /** Fetches items for a specific category on demand (initial or refresh) */
    fetchCategoryItems: (categoryId: number) => Promise<void>;
    /** Fetches the next page of items for infinite scroll */
    fetchNextPage: (categoryId: number) => Promise<void>;
    /** Reverts all local changes for updated items */
    revertChanges: () => void;
    /** Directly adds a new category via API */
    addCategory: (category: { name: string; description?: string; parentCategoryId?: number | null }) => Promise<void>;
    /** Directly updates an existing category via API */
    updateCategory: (categoryId: number, updates: { name: string; description?: string; parentCategoryId?: number | null }) => Promise<void>;
    /** Directly deletes a category via API */
    deleteCategory: (categoryId: number) => Promise<void>;
    /** Directly toggles category status via API */
    toggleCategoryStatus: (categoryId: number, status: 'active' | 'inactive') => Promise<void>;
    /** Directly adds a new item via API */
    addMenuItem: (categoryId: number, item: Partial<MenuItem>) => Promise<void>;
    /** Directly deletes a menu item via API */
    deleteMenuItem: (categoryId: number, itemId: number) => Promise<void>;
    /** Adds a new item locally to updatedItems without calling API */
    addNewItemLocally: (categoryId: number, item: MenuItem, options?: { addToStockImmediately?: boolean; scheduledDate?: string | null }) => void;
    /** Updates scheduling options for a tracked item */
    updateItemScheduling: (itemId: number, options: { addToStockImmediately?: boolean; scheduledDate?: string | null }) => void;

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
    const categoryMap: Record<number, Category> = {};
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
const updateCategoryInTree = (categories: Category[], categoryId: number, updates: Partial<Category>): Category[] => {
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
 * Helper to add a new category to the hierarchical tree locally.
 */
const addCategoryToTree = (categories: Category[], parentId: number | null, newCategory: Category): Category[] => {
    if (!parentId) {
        return [newCategory, ...categories];
    }
    return categories.map(cat => {
        if (cat.id === parentId) {
            return {
                ...cat,
                subCategories: [newCategory, ...(cat.subCategories || [])]
            };
        }
        if (cat.subCategories && cat.subCategories.length > 0) {
            return {
                ...cat,
                subCategories: addCategoryToTree(cat.subCategories, parentId, newCategory)
            };
        }
        return cat;
    });
};

/**
 * Helper to remove a category from the tree.
 */
const removeCategoryFromTree = (categories: Category[], categoryId: number): { updatedTree: Category[], removedCategory: Category | null } => {
    let removedCategory: Category | null = null;
    const updatedTree = categories.filter(cat => {
        if (cat.id === categoryId) {
            removedCategory = cat;
            return false;
        }
        return true;
    }).map(cat => {
        if (cat.subCategories && cat.subCategories.length > 0) {
            const result = removeCategoryFromTree(cat.subCategories, categoryId);
            if (result.removedCategory) removedCategory = result.removedCategory;
            return { ...cat, subCategories: result.updatedTree };
        }
        return cat;
    });
    return { updatedTree, removedCategory };
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
            updatedItems: {},
            selectedCategoryId: null,
            searchQuery: '',
            filters: {
                stock: [],
                foodType: [],
                discounted: null,
            },
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

            setSearchQuery: (searchQuery) => {
                set({ searchQuery });
                const id = get().selectedCategoryId;
                if (id) {
                    get().fetchCategoryItems(id);
                }
            },

            setFilters: (newFilters) => {
                const updatedFilters = { ...get().filters, ...newFilters };
                set({ filters: updatedFilters });
                const id = get().selectedCategoryId;
                if (id) {
                    get().fetchCategoryItems(id);
                }
            },

            clearFilters: () => {
                set({
                    filters: {
                        stock: [],
                        foodType: [],
                        discounted: null,
                    }
                });
                const id = get().selectedCategoryId;
                if (id) {
                    get().fetchCategoryItems(id);
                }
            },

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

                    set({
                        categories: treeData,
                        isCategoriesLoading: false,
                        lastCategoriesFetch: Date.now()
                    });
                } catch (error) {
                    console.error('Menu Store: Failed to fetch categories:', error);
                    set({ isCategoriesLoading: false });
                }
            },

            /**
             * Initial items fetch for a category.
             */
            fetchCategoryItems: async (categoryId: number) => {
                const { isItemsLoading, categories, filters, searchQuery } = get();
                if (isItemsLoading[categoryId]) return;

                set(state => ({
                    isItemsLoading: { ...state.isItemsLoading, [categoryId]: true }
                }));

                try {
                    const response = await fetchCategoryItems(
                        categoryId,
                        1,
                        5,
                        searchQuery,
                        filters
                    );

                    // 1. Merge session-stored local edits into API items
                    const { updatedItems } = get();
                    const mergedItems = response.items.map(item => {
                        if (updatedItems[item.id]) {
                            return updatedItems[item.id].current;
                        }
                        return item;
                    });

                    // 2. Prepend local NEW items belonging to this category from session storage
                    const localNewItems = Object.values(updatedItems)
                        .filter(entry => {
                            const item = entry.current;
                            if (!entry.isNewItem || item.categoryId !== categoryId) return false;

                            // Apply Query Filter
                            if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

                            // Apply FoodType Filter
                            if (filters.foodType.length > 0 && !filters.foodType.includes(item.foodType)) return false;

                            return true;
                        })
                        .map(entry => entry.current);

                    const finalItems = [...localNewItems, ...mergedItems];

                    const updatedCategories = updateCategoryInTree(categories, categoryId, {
                        items: finalItems,
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
            fetchNextPage: async (categoryId: number) => {
                const { isItemsLoading, categories, filters, searchQuery } = get();
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
                    const response = await fetchCategoryItems(
                        categoryId,
                        nextPage,
                        5,
                        searchQuery,
                        filters
                    );

                    // Merge session-stored local edits into NEW API items being appended
                    const { updatedItems } = get();
                    const mergedItems = response.items.map(item => {
                        if (updatedItems[item.id]) {
                            return updatedItems[item.id].current;
                        }
                        return item;
                    });

                    const baseItems = Array.isArray(currentCategory.items) ? currentCategory.items : [];
                    const finalUpdatedItemsList = [...baseItems, ...mergedItems];

                    const updatedCategories = updateCategoryInTree(categories, categoryId, {
                        items: finalUpdatedItemsList,
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

            updateMenuItem: (categoryId: number, itemId: number, updates: Partial<MenuItem>, addressId?: string | null) => {
                const { categories, updatedItems } = get();
                const newUpdatedItems = { ...updatedItems };

                // 1. Find the item in the baseline categories if not already tracked
                let currentItemState: MenuItem | undefined = newUpdatedItems[itemId]?.current;
                let originalBaseline: MenuItem | undefined = newUpdatedItems[itemId]?.original;

                if (!originalBaseline) {
                    // Item not tracked yet, find it in the current categories tree
                    const findItem = (list: Category[]): MenuItem | undefined => {
                        for (const cat of list) {
                            if (cat.id === categoryId && Array.isArray(cat.items)) {
                                const found = cat.items.find(i => i.id === itemId);
                                if (found) return found;
                            }
                            if (cat.subCategories) {
                                const found = findItem(cat.subCategories);
                                if (found) return found;
                            }
                        }
                    };
                    originalBaseline = findItem(categories);
                    currentItemState = originalBaseline;
                }

                if (!originalBaseline || !currentItemState) {
                    console.warn(`Menu Store: Item ${itemId} not found in category ${categoryId}.`);
                    return;
                }

                // 2. Apply updates to the current state
                const updatedItem = { ...currentItemState, ...updates };

                // 3. Update the tracking map
                newUpdatedItems[itemId] = {
                    original: originalBaseline,
                    current: updatedItem,
                    modifiedByAddressId: addressId
                };

                // 4. Self-Correction: If reverted to original, remove from tracking
                if (JSON.stringify(originalBaseline) === JSON.stringify(updatedItem)) {
                    delete newUpdatedItems[itemId];
                }

                // 5. Update state (categories remains untouched baseline)
                set({
                    updatedItems: newUpdatedItems,
                    isDirty: Object.keys(newUpdatedItems).length > 0
                });
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
                const { updatedItems, isDirty, isSubmitting } = get();
                if (!isDirty || isSubmitting) return;

                set({ isSubmitting: true });

                const updates = Object.values(updatedItems);
                
                // Separate items into "Create" (new) and "Update" (existing modified)
                const itemsToCreate = updates.filter(u => u.isNewItem);
                const itemsToUpdate = updates.filter(u => !u.isNewItem);

                try {
                    // 1. Handle New Items (Creations)
                    const creationPromises = itemsToCreate.map(async ({ current }) => {
                        const { id, ...itemData } = current;
                        return createMenuItem(current.categoryId, itemData);
                    });

                    // 2. Handle Existing Items (Updates)
                    const updatePayload = itemsToUpdate.map(({ original, current, modifiedByAddressId }) => {
                        const changes: Record<string, unknown> = { itemId: current.id };
                        if (modifiedByAddressId) changes['restroId'] = modifiedByAddressId;

                        (Object.keys(current) as Array<keyof MenuItem>).forEach(key => {
                            if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
                                changes[key] = current[key];
                            }
                        });
                        return changes;
                    });

                    // Fire all API calls concurrently
                    const results = await Promise.all([
                        ...creationPromises,
                        updatePayload.length > 0 ? updateMenu(updatePayload) : Promise.resolve({ success: true })
                    ]);

                    const allSuccessful = results.every(r => r.success);

                    if (allSuccessful) {
                        // 3. Apply changes to local 'categories' state (make them permanent)
                        // Note: New items will have new IDs from the backend, but for simplicity 
                        // in this unified "Save" we might need a re-fetch or ID mapping.
                        // Here we just clear the dirty state and reset.
                        
                        set({
                            isDirty: false,
                            updatedItems: {},
                            isSubmitting: false,
                            lastCategoriesFetch: null // Force re-fetch on next access to get real IDs
                        });
                        
                        // Immediately re-fetch to sync IDs and baseline
                        await get().fetchCategories(true);
                    } else {
                        throw new Error('Some changes failed to save');
                    }
                } catch (error) {
                    console.error('Failed to submit menu changes:', error);
                    set({ isSubmitting: false });
                    alert('Failed to submit changes. Please try again.');
                }
            },

            revertChanges: () => {
                const { categories, updatedItems } = get();

                // Helper to revert items recursively
                const revertRecursive = (list: Category[]): Category[] => {
                    return list.map(cat => {
                        let newItems = cat.items;
                        if (Array.isArray(cat.items)) {
                            newItems = cat.items.map(item => {
                                if (updatedItems[item.id]) {
                                    return updatedItems[item.id].original;
                                }
                                return item;
                            });
                        }
                        return {
                            ...cat,
                            items: newItems,
                            subCategories: cat.subCategories ? revertRecursive(cat.subCategories) : []
                        };
                    });
                };

                set({
                    categories: revertRecursive(categories),
                    updatedItems: {},
                    isDirty: false
                });
            },

            addCategory: async (newCatData) => {
                set({ isSubmitting: true });
                try {
                    const response = await createCategory(newCatData);
                    if (response.success) {
                        const { categories } = get();
                        set({
                            categories: addCategoryToTree(categories, newCatData.parentCategoryId || null, response.category)
                        });
                    }
                } catch (error) {
                    console.error('Failed to create category:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            updateCategory: async (categoryId, updates) => {
                set({ isSubmitting: true });
                try {
                    const response = await patchCategory(categoryId, updates);
                    if (response.success) {
                        const { categories } = get();

                        // 1. Remove it from its current position
                        const { updatedTree, removedCategory } = removeCategoryFromTree(categories, categoryId);

                        if (removedCategory) {
                            // 2. Combine API response with existing children/items
                            const updatedCategory = {
                                ...response.category,
                                subCategories: removedCategory.subCategories,
                                items: removedCategory.items,
                                itemCount: removedCategory.itemCount // Preserve local counts/states
                            };

                            // 3. Re-insert it at the new parent position (from the API response)
                            set({
                                categories: addCategoryToTree(updatedTree, updatedCategory.parentCategoryId || null, updatedCategory)
                            });
                        }
                    }
                } catch (error) {
                    console.error('Failed to update category:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            addMenuItem: async (categoryId, itemData) => {
                set({ isSubmitting: true });
                try {
                    const response = await createMenuItem(categoryId, itemData);
                    if (response.success) {
                        const { categories } = get();

                        // Helper to find and update category with new item
                        const addItemRecursive = (list: Category[]): Category[] => {
                            return list.map(cat => {
                                if (cat.id === categoryId) {
                                    return {
                                        ...cat,
                                        items: [response.item, ...(cat.items || [])],
                                        itemCount: (cat.itemCount || 0) + 1
                                    };
                                }
                                if (cat.subCategories) {
                                    return {
                                        ...cat,
                                        subCategories: addItemRecursive(cat.subCategories)
                                    };
                                }
                                return cat;
                            });
                        };

                        set({
                            categories: addItemRecursive(categories)
                        });
                    }
                } catch (error) {
                    console.error('Failed to add menu item:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            updateItemScheduling: (itemId: number, options: { addToStockImmediately?: boolean; scheduledDate?: string | null }) => {
                const { updatedItems } = get();
                // Only update if the item is already being tracked
                if (updatedItems[itemId]) {
                    set({
                        updatedItems: {
                            ...updatedItems,
                            [itemId]: {
                                ...updatedItems[itemId],
                                addToStockImmediately: options.addToStockImmediately,
                                scheduledDate: options.scheduledDate
                            }
                        }
                    });
                }
            },

            addNewItemLocally: (categoryId: number, item: MenuItem, options?: { addToStockImmediately?: boolean; scheduledDate?: string | null }) => {
                const { updatedItems, categories } = get();

                // Generate a temporary negative ID to avoid conflicts with real IDs
                const tempId = -Date.now();

                // discountAmount/discountIsAbsolute are not in the AddItemPage form or
                // Zod schema, so they arrive as undefined — causing NaN in price display.
                // Nullish coalescing after the spread gives defaults without TypeScript TS2783.
                const newItem: MenuItem = {
                    ...item,
                    id: tempId,
                    categoryId: categoryId,
                    discountAmount: item.discountAmount ?? 0,
                    discountIsAbsolute: item.discountIsAbsolute ?? true,
                };

                // Create an empty original to indicate this is a new item
                const emptyOriginal: MenuItem = {
                    id: tempId,
                    name: '',
                    itemPrice: 0,
                    discountAmount: 0,
                    foodType: 'VEG',
                    isCustomisable: false,
                    inStock: {},
                    taxAmount: 0,
                    packagingCharges: 0,
                    discountIsAbsolute: false,
                    categoryId: categoryId,
                };

                // Add to updatedItems with scheduling options
                const newUpdatedItems = {
                    ...updatedItems,
                    [tempId]: {
                        original: emptyOriginal,
                        current: newItem,
                        modifiedByAddressId: null,
                        isNewItem: true,
                        addToStockImmediately: options?.addToStockImmediately ?? true,
                        scheduledDate: options?.scheduledDate ?? null
                    }
                };

                // Also add to categories for immediate display
                const addItemRecursive = (list: Category[]): Category[] => {
                    return list.map(cat => {
                        if (cat.id === categoryId) {
                            return {
                                ...cat,
                                items: [newItem, ...(cat.items || [])],
                                itemCount: (cat.itemCount || 0) + 1
                            };
                        }
                        if (cat.subCategories) {
                            return {
                                ...cat,
                                subCategories: addItemRecursive(cat.subCategories)
                            };
                        }
                        return cat;
                    });
                };

                set({
                    updatedItems: newUpdatedItems,
                    categories: addItemRecursive(categories),
                    isDirty: true
                });
            },

            deleteCategory: async (categoryId) => {
                set({ isSubmitting: true });
                try {
                    const response = await deleteCategory(categoryId);
                    if (response.success) {
                        const { categories, selectedCategoryId } = get();
                        const { updatedTree } = removeCategoryFromTree(categories, categoryId);

                        set({
                            categories: updatedTree,
                            selectedCategoryId: selectedCategoryId === categoryId ? null : selectedCategoryId
                        });
                    }
                } catch (error) {
                    console.error('Failed to delete category:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            deleteMenuItem: async (categoryId, itemId) => {
                set({ isSubmitting: true });
                try {
                    const response = await deleteMenuItem(itemId);
                    if (response.success) {
                        const { categories } = get();

                        const deleteItemRecursive = (list: Category[]): Category[] => {
                            return list.map(cat => {
                                if (cat.id === categoryId) {
                                    return {
                                        ...cat,
                                        items: (cat.items || []).filter(item => item.id !== itemId),
                                        itemCount: Math.max(0, (cat.itemCount || 1) - 1)
                                    };
                                }
                                if (cat.subCategories && cat.subCategories.length > 0) {
                                    return {
                                        ...cat,
                                        subCategories: deleteItemRecursive(cat.subCategories)
                                    };
                                }
                                return cat;
                            });
                        };

                        set({
                            categories: deleteItemRecursive(categories)
                        });
                    }
                } catch (error) {
                    console.error('Failed to delete menu item:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            toggleCategoryStatus: async (categoryId, status) => {
                set({ isSubmitting: true });
                try {
                    const response = await toggleCategoryStatus(categoryId, status);
                    if (response.success) {
                        const { categories } = get();
                        set({
                            categories: updateCategoryInTree(categories, categoryId, { status })
                        });
                    }
                } catch (error) {
                    console.error('Failed to toggle category status:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },
            // --- Menu Score State ---
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
                updatedItems: state.updatedItems,
                isDirty: state.isDirty,
                lastCategoriesFetch: state.lastCategoriesFetch,
            }),
        }
    )
);
