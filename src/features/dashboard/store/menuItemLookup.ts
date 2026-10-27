import type { Category, MenuItem } from '../../../types/menuTypes';

/**
 * 2026-10-26: item lookups that understand variants. The category tree holds parents only, with
 * saved variants nested in `productVariants`; new (unsaved) variants exist only in the store's
 * `updatedItems` overlay. Shared by useMenuStore, VariantRow, AddItemPage and ModifiedItemCard so
 * they all resolve "an item" the same way.
 */

type Overlay = Record<number, { current: MenuItem; isNewItem?: boolean }>;

/** Finds a parent or a saved variant anywhere in the tree (baseline values, no overlay). */
export const findItemInTree = (categories: Category[], itemId: number): MenuItem | undefined => {
    for (const cat of categories) {
        for (const item of Array.isArray(cat.items) ? cat.items : []) {
            if (item.id === itemId) return item;
            const variant = item.productVariants?.find(v => v.id === itemId);
            if (variant) return variant;
        }
        const found = cat.subCategories ? findItemInTree(cat.subCategories, itemId) : undefined;
        if (found) return found;
    }
    return undefined;
};

/** An item with its pending local edits applied (or the new local item itself). */
export const resolveItem = (categories: Category[], overlay: Overlay, itemId: number): MenuItem | undefined =>
    overlay[itemId]?.current ?? findItemInTree(categories, itemId);

/**
 * A parent's variants as the user should see them: saved ones with pending edits applied, then
 * new local ones (in the order they were added - temp ids are -Date.now(), so descending).
 */
export const getVariants = (parent: MenuItem, overlay: Overlay): MenuItem[] => {
    const saved = (parent.productVariants ?? []).map(v => overlay[v.id]?.current ?? v);
    const added = Object.values(overlay)
        .filter(entry => entry.isNewItem && entry.current.originalProductId === parent.id)
        .map(entry => entry.current)
        .sort((a, b) => b.id - a.id);
    return [...saved, ...added];
};
