import type { BogoState, SaveBogoRequest } from '../../../api/restaurantOffersApi';

/**
 * 2026-11-11: the BOGO page's ticks. Product rules (user, 2026-11-11):
 * - the page is a toggle board for the outlet's one BOGO; it opens with what's applied ticked;
 * - "Select all" = every dish, including dishes added later;
 * - a ticked category covers its dishes and its sub-categories, so those show ticked and locked;
 * - Save sends the whole selection; nothing ticked ends the BOGO.
 * Pure functions (no React) so the rules are easy to read and test.
 */
export interface BogoDraft {
    allDishes: boolean;
    categoryIds: number[];
    itemIds: number[];
    // Category of each dish ticked on this page, so ticking that category can drop the dish
    // (the category covers it). Dishes that came ticked from the server have no entry; the backend
    // drops any dish whose category is also ticked anyway.
    itemCategory: Record<number, number>;
}

export const draftFromServer = (state: BogoState): BogoDraft => ({
    allDishes: state.allDishes,
    categoryIds: [...state.categoryIds],
    itemIds: [...state.itemIds],
    itemCategory: {},
});

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));

export const isDraftDirty = (draft: BogoDraft, server: BogoState) =>
    draft.allDishes !== server.allDishes
    || (!draft.allDishes && (!sameSet(draft.categoryIds, server.categoryIds) || !sameSet(draft.itemIds, server.itemIds)));

export const isDraftEmpty = (draft: BogoDraft) =>
    !draft.allDishes && draft.categoryIds.length === 0 && draft.itemIds.length === 0;

export interface Coverage {
    checked: boolean;
    locked: boolean; // covered by "all dishes" or by a ticked parent, so it can't be unticked on its own
}

/** A category: ticked itself, or covered by all-dishes / a ticked ancestor. */
export const categoryCoverage = (draft: Pick<BogoDraft, 'allDishes' | 'categoryIds'>, categoryId: number, ancestors: number[]): Coverage => {
    if (draft.allDishes) return { checked: true, locked: true };
    if (ancestors.some((id) => draft.categoryIds.includes(id))) return { checked: true, locked: true };
    return { checked: draft.categoryIds.includes(categoryId), locked: false };
};

/** A dish: ticked itself, or covered by all-dishes / its category (or that category's ancestors). */
export const itemCoverage = (
    draft: Pick<BogoDraft, 'allDishes' | 'categoryIds' | 'itemIds'>,
    itemId: number,
    categoryChain: number[], // the dish's category first, then its ancestors
): Coverage => {
    if (draft.allDishes) return { checked: true, locked: true };
    if (categoryChain.some((id) => draft.categoryIds.includes(id))) return { checked: true, locked: true };
    return { checked: draft.itemIds.includes(itemId), locked: false };
};

export const toggleAll = (draft: BogoDraft, on: boolean): BogoDraft =>
    // Turning "all" off clears everything, so the board doesn't jump back to an older selection.
    on ? { ...draft, allDishes: true } : { allDishes: false, categoryIds: [], itemIds: [], itemCategory: {} };

/** subtree = the category and all its sub-categories (they're sent too, so each is covered). */
export const toggleCategory = (draft: BogoDraft, subtree: number[], on: boolean): BogoDraft => {
    const categoryIds = draft.categoryIds.filter((id) => !subtree.includes(id));
    if (!on) return { ...draft, categoryIds };
    // Dishes of these categories ticked one by one are now covered by the category.
    const itemIds = draft.itemIds.filter((id) => !subtree.includes(draft.itemCategory[id]));
    return { ...draft, categoryIds: [...categoryIds, ...subtree], itemIds };
};

export const toggleItem = (draft: BogoDraft, itemId: number, categoryId: number, on: boolean): BogoDraft => {
    const itemIds = draft.itemIds.filter((id) => id !== itemId);
    return on
        ? { ...draft, itemIds: [...itemIds, itemId], itemCategory: { ...draft.itemCategory, [itemId]: categoryId } }
        : { ...draft, itemIds };
};

export const toSaveRequest = (draft: BogoDraft, restroId: string): SaveBogoRequest => ({
    restroId,
    allDishes: draft.allDishes,
    categoryIds: draft.allDishes ? [] : draft.categoryIds,
    itemIds: draft.allDishes ? [] : draft.itemIds,
});
