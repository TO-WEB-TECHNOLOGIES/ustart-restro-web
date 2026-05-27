import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AddOnCategory, AddOnVariant } from '@/types/menuTypes';
import {
    fetchAddonCategories,
    fetchCategoryVariants,
    createAddonCategory,
    patchAddonCategory,
    deleteAddonCategory,
    createAddonVariant,
    patchAddonVariant,
    deleteAddonVariant
} from '../api/addonApi';

export interface AddonStore {
    addonCategories: AddOnCategory[];
    selectedCategoryId: number | null;
    searchQuery: string;
    filters: {
        stock: ('in_stock' | 'out_of_stock')[];
    };
    updatedVariants: Record<number, {
        original: AddOnVariant;
        current: AddOnVariant;
        isNew?: boolean;
    }>;
    isDirty: boolean;
    isSubmitting: boolean;
    isCategoriesLoading: boolean;
    isVariantsLoading: Record<number, boolean>;
    lastCategoriesFetch: number | null;

    setAddonCategories: (categories: AddOnCategory[]) => void;
    setSelectedCategoryId: (id: number | null) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<AddonStore['filters']>) => void;
    clearFilters: () => void;
    
    fetchCategories: (brandId?: string, force?: boolean) => Promise<void>;
    fetchCategoryVariants: (categoryId: number, restaurantId?: string) => Promise<void>;
    
    updateAddonVariant: (categoryId: number, variantId: number, updates: Partial<AddOnVariant>) => void;
    addNewVariantLocally: (categoryId: number, variant: AddOnVariant) => void;
    
    submitChanges: (restaurantId?: string | null, brandId?: string) => Promise<void>;
    revertChanges: () => void;
    
    addCategory: (data: {
        categoryName: string;
        minCustomizationSelection?: number;
        maxCustomizationSelection?: number;
        isMandatory?: boolean;
        isActive?: boolean;
        menuItemIds?: number[];
    }, brandId?: string) => Promise<void>;
    
    updateCategory: (categoryId: number, updates: {
        categoryName?: string;
        minCustomizationSelection?: number;
        maxCustomizationSelection?: number;
        isMandatory?: boolean;
        isActive?: boolean;
        menuItemIds?: number[];
    }, brandId?: string) => Promise<void>;
    
    deleteCategory: (categoryId: number) => Promise<void>;
    deleteVariant: (categoryId: number, variantId: number, brandId?: string) => Promise<void>;
}

export const useAddonStore = create<AddonStore>()(
    persist(
        (set, get) => ({
            addonCategories: [],
            selectedCategoryId: null,
            searchQuery: '',
            filters: {
                stock: []
            },
            updatedVariants: {},
            isDirty: false,
            isSubmitting: false,
            isCategoriesLoading: false,
            isVariantsLoading: {},
            lastCategoriesFetch: null,

            setAddonCategories: (addonCategories) => {
                set({ addonCategories, isDirty: true });
            },

            setSelectedCategoryId: (id) => {
                set({ selectedCategoryId: id });
                if (id) {
                    const category = get().addonCategories.find(c => c.addOnId === id);
                    if (category && (!category.variants || category.variants.length === 0)) {
                        get().fetchCategoryVariants(id);
                    }
                }
            },

            setSearchQuery: (searchQuery) => {
                set({ searchQuery });
            },

            setFilters: (newFilters) => {
                set(state => ({
                    filters: { ...state.filters, ...newFilters }
                }));
            },

            clearFilters: () => {
                set({
                    filters: { stock: [] }
                });
            },

            fetchCategories: async (brandId, force = false) => {
                const { addonCategories, lastCategoriesFetch, isCategoriesLoading, isDirty } = get();
                const REVALIDATE_TIME = 30 * 1000;

                if (isCategoriesLoading) return;

                const isFresh = !force && lastCategoriesFetch && (Date.now() - lastCategoriesFetch < REVALIDATE_TIME);

                if (isFresh && addonCategories.length > 0) {
                    return;
                }

                if (isDirty && addonCategories.length > 0 && !force) {
                    return;
                }

                set({ isCategoriesLoading: true });

                try {
                    const data = await fetchAddonCategories(brandId);
                    set({
                        addonCategories: data,
                        isCategoriesLoading: false,
                        lastCategoriesFetch: Date.now()
                    });
                } catch (error) {
                    console.error('Addon Store: Failed to fetch addon categories:', error);
                    set({ isCategoriesLoading: false });
                }
            },

            fetchCategoryVariants: async (categoryId, restaurantId) => {
                const { isVariantsLoading, addonCategories } = get();
                if (isVariantsLoading[categoryId]) return;

                set(state => ({
                    isVariantsLoading: { ...state.isVariantsLoading, [categoryId]: true }
                }));

                try {
                    const variants = await fetchCategoryVariants(categoryId, restaurantId);

                    // Merge session-stored local edits into API variants
                    const { updatedVariants } = get();
                    const mergedVariants = variants.map(v => {
                        if (updatedVariants[v.variantId]) {
                            return updatedVariants[v.variantId].current;
                        }
                        return v;
                    });

                    // Add local new variants
                    const localNewVariants = Object.values(updatedVariants)
                        .filter(entry => entry.isNew && entry.current.addOnCategoryId === categoryId)
                        .map(entry => entry.current);

                    const finalVariants = [...localNewVariants, ...mergedVariants];

                    const updatedCategories = addonCategories.map(cat => {
                        if (cat.addOnId === categoryId) {
                            return { ...cat, variants: finalVariants };
                        }
                        return cat;
                    });

                    set(state => ({
                        addonCategories: updatedCategories,
                        isVariantsLoading: { ...state.isVariantsLoading, [categoryId]: false }
                    }));
                } catch (error) {
                    console.error(`Addon Store: Failed to fetch variants for category ${categoryId}:`, error);
                    set(state => ({
                        isVariantsLoading: { ...state.isVariantsLoading, [categoryId]: false }
                    }));
                }
            },

            updateAddonVariant: (categoryId, variantId, updates) => {
                const { addonCategories, updatedVariants } = get();
                const newUpdatedVariants = { ...updatedVariants };

                let currentVariantState: AddOnVariant | undefined = newUpdatedVariants[variantId]?.current;
                let originalBaseline: AddOnVariant | undefined = newUpdatedVariants[variantId]?.original;

                if (!originalBaseline) {
                    const cat = addonCategories.find(c => c.addOnId === categoryId);
                    if (cat?.variants) {
                        const found = cat.variants.find(v => v.variantId === variantId);
                        if (found) {
                            originalBaseline = found;
                            currentVariantState = found;
                        }
                    }
                }

                if (!originalBaseline || !currentVariantState) {
                    console.warn(`Addon Store: Variant ${variantId} not found in category ${categoryId}`);
                    return;
                }

                const updatedVariant = { ...currentVariantState, ...updates };

                newUpdatedVariants[variantId] = {
                    original: originalBaseline,
                    current: updatedVariant,
                    isNew: newUpdatedVariants[variantId]?.isNew || false
                };

                // Remove from tracking if identical to baseline
                if (!newUpdatedVariants[variantId].isNew && JSON.stringify(originalBaseline) === JSON.stringify(updatedVariant)) {
                    delete newUpdatedVariants[variantId];
                }

                set({
                    updatedVariants: newUpdatedVariants,
                    isDirty: Object.keys(newUpdatedVariants).length > 0
                });
            },

            addNewVariantLocally: (categoryId, variant) => {
                const { addonCategories, updatedVariants } = get();
                
                const tempId = -Date.now();
                const newVariant = {
                    ...variant,
                    variantId: tempId,
                    addOnCategoryId: categoryId
                };

                const emptyOriginal: AddOnVariant = {
                    variantId: tempId,
                    menuItemId: null,
                    addOnCategoryId: categoryId,
                    variantName: '',
                    variantDescription: '',
                    itemImage: '',
                    variantType: 'ADD_ON',
                    price: 0,
                    discount: 0,
                    finalPrice: 0,
                    packagingFees: 0,
                    taxPercentage: 5,
                    isActive: true,
                    isAvailable: true,
                    isBlocked: false,
                    blockedReason: null,
                    startTime: null,
                    endTime: null,
                    allDay: true,
                    foodType: variant.foodType
                };

                const newUpdatedVariants = {
                    ...updatedVariants,
                    [tempId]: {
                        original: emptyOriginal,
                        current: newVariant,
                        isNew: true
                    }
                };

                const updatedCategories = addonCategories.map(cat => {
                    if (cat.addOnId === categoryId) {
                        return {
                            ...cat,
                            variants: [newVariant, ...(cat.variants || [])]
                        };
                    }
                    return cat;
                });

                set({
                    updatedVariants: newUpdatedVariants,
                    addonCategories: updatedCategories,
                    isDirty: true
                });
            },

            submitChanges: async (restaurantId, brandId) => {
                const { updatedVariants, isDirty, isSubmitting } = get();
                if (!isDirty || isSubmitting) return;

                set({ isSubmitting: true });

                const updates = Object.values(updatedVariants);
                const toCreate = updates.filter(u => u.isNew);
                const toUpdate = updates.filter(u => !u.isNew);

                try {
                    // 1. Create new variants
                    const creationPromises = toCreate.map(async ({ current }) => {
                        return createAddonVariant({
                            addOnCategoryId: current.addOnCategoryId,
                            variantName: current.variantName,
                            variantDescription: current.variantDescription,
                            itemImage: current.itemImage,
                            itemPrice: current.price,
                            packagingCharges: current.packagingFees,
                            taxAmount: current.taxPercentage,
                            isActive: current.isActive,
                            isAvailable: current.isAvailable,
                            availability: {
                                allDay: current.allDay,
                                startTime: current.startTime,
                                endTime: current.endTime
                            },
                            foodType: current.foodType
                        }, brandId);
                    });

                    // 2. Update existing variants
                    const updatePromises = toUpdate.map(async ({ original, current }) => {
                        const changes: any = {};
                        (Object.keys(current) as Array<keyof AddOnVariant>).forEach(key => {
                            if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
                                if (key === 'price') changes.itemPrice = current.price;
                                else if (key === 'packagingFees') changes.packagingCharges = current.packagingFees;
                                else if (key === 'taxPercentage') changes.taxAmount = current.taxPercentage;
                                else if (key === 'variantName') changes.variantName = current.variantName;
                                else if (key === 'variantDescription') changes.variantDescription = current.variantDescription;
                                else if (key === 'itemImage') changes.itemImage = current.itemImage;
                                else if (key === 'isActive') changes.isActive = current.isActive;
                                else if (key === 'isAvailable') changes.isAvailable = current.isAvailable;
                                else if (key === 'foodType') changes.foodType = current.foodType;
                                else if (key === 'allDay' || key === 'startTime' || key === 'endTime') {
                                    changes.availability = {
                                        allDay: current.allDay,
                                        startTime: current.startTime,
                                        endTime: current.endTime
                                    };
                                }
                            }
                        });

                        return patchAddonVariant(
                            current.variantId,
                            changes,
                            restaurantId || undefined,
                            brandId
                        );
                    });

                    await Promise.all([...creationPromises, ...updatePromises]);

                    set({
                        isDirty: false,
                        updatedVariants: {},
                        isSubmitting: false,
                        lastCategoriesFetch: null
                    });

                    // Force refetch to sync all items and IDs
                    await get().fetchCategories(brandId, true);
                    const selectedId = get().selectedCategoryId;
                    if (selectedId) {
                        await get().fetchCategoryVariants(selectedId, restaurantId || undefined);
                    }
                } catch (error) {
                    console.error('Failed to submit addon changes:', error);
                    set({ isSubmitting: false });
                    alert('Failed to submit changes. Please try again.');
                }
            },

            revertChanges: () => {
                const { addonCategories, updatedVariants } = get();

                const revertedCategories = addonCategories.map(cat => {
                    if (cat.variants) {
                        const revertedVariants = cat.variants
                            .filter(v => !updatedVariants[v.variantId]?.isNew) // remove new items
                            .map(v => {
                                if (updatedVariants[v.variantId]) {
                                    return updatedVariants[v.variantId].original;
                                }
                                return v;
                            });
                        return { ...cat, variants: revertedVariants };
                    }
                    return cat;
                });

                set({
                    addonCategories: revertedCategories,
                    updatedVariants: {},
                    isDirty: false
                });
            },

            addCategory: async (data, brandId) => {
                set({ isSubmitting: true });
                try {
                    const response = await createAddonCategory(data, brandId);
                    if (response.success) {
                        const { addonCategories } = get();
                        set({
                            addonCategories: [...addonCategories, { ...response.category, variants: [] }]
                        });
                    }
                } catch (error) {
                    console.error('Failed to create addon category:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            updateCategory: async (categoryId, updates, brandId) => {
                set({ isSubmitting: true });
                try {
                    const response = await patchAddonCategory(categoryId, updates, brandId);
                    if (response.success) {
                        const { addonCategories } = get();
                        const updatedCategories = addonCategories.map(cat => {
                            if (cat.addOnId === categoryId) {
                                return {
                                    ...cat,
                                    ...response.category,
                                    variants: cat.variants // preserve loaded variants
                                };
                            }
                            return cat;
                        });
                        set({ addonCategories: updatedCategories });
                    }
                } catch (error) {
                    console.error('Failed to update addon category:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            deleteCategory: async (categoryId) => {
                set({ isSubmitting: true });
                try {
                    const response = await deleteAddonCategory(categoryId);
                    if (response.success) {
                        const { addonCategories, selectedCategoryId } = get();
                        const updated = addonCategories.filter(c => c.addOnId !== categoryId);
                        set({
                            addonCategories: updated,
                            selectedCategoryId: selectedCategoryId === categoryId ? null : selectedCategoryId
                        });
                    }
                } catch (error) {
                    console.error('Failed to delete addon category:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            },

            deleteVariant: async (categoryId, variantId, brandId) => {
                const { updatedVariants, addonCategories } = get();
                
                // If it is a local unsaved variant, just delete it locally
                if (updatedVariants[variantId]?.isNew) {
                    const newUpdated = { ...updatedVariants };
                    delete newUpdated[variantId];

                    const updatedCategories = addonCategories.map(cat => {
                        if (cat.addOnId === categoryId && cat.variants) {
                            return {
                                ...cat,
                                variants: cat.variants.filter(v => v.variantId !== variantId)
                            };
                        }
                        return cat;
                    });

                    set({
                        updatedVariants: newUpdated,
                        addonCategories: updatedCategories,
                        isDirty: Object.keys(newUpdated).length > 0
                    });
                    return;
                }

                set({ isSubmitting: true });
                try {
                    const response = await deleteAddonVariant(variantId, brandId);
                    if (response.success) {
                        const updatedCategories = addonCategories.map(cat => {
                            if (cat.addOnId === categoryId && cat.variants) {
                                return {
                                    ...cat,
                                    variants: cat.variants.filter(v => v.variantId !== variantId)
                                };
                            }
                            return cat;
                        });

                        const newUpdated = { ...updatedVariants };
                        delete newUpdated[variantId];

                        set({
                            addonCategories: updatedCategories,
                            updatedVariants: newUpdated,
                            isDirty: Object.keys(newUpdated).length > 0
                        });
                    }
                } catch (error) {
                    console.error('Failed to delete addon variant:', error);
                } finally {
                    set({ isSubmitting: false });
                }
            }
        }),
        {
            name: 'ustart-addon-storage',
            partialize: (state) => ({
                updatedVariants: state.updatedVariants,
                isDirty: state.isDirty
            })
        }
    )
);
