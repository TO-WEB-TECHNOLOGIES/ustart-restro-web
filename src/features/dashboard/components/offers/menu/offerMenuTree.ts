import type { Category } from '@/types/menuTypes';

/**
 * 2026-11-11: the category list comes back flat (parentCategoryId); the offer pages show it as a
 * tree. Helpers live in a .ts file (react-refresh rule: components-only .tsx files).
 */
export interface CategoryTree {
    roots: Category[];
    childrenOf: Map<number, Category[]>;
}

export const buildCategoryTree = (categories: Category[]): CategoryTree => {
    const ids = new Set(categories.map((c) => c.id));
    const childrenOf = new Map<number, Category[]>();
    const roots: Category[] = [];
    for (const category of categories) {
        const parent = category.parentCategoryId;
        // A parent missing from the list (e.g. deleted) would hide the child; show it as a root.
        if (parent != null && ids.has(parent)) {
            childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), category]);
        } else {
            roots.push(category);
        }
    }
    return { roots, childrenOf };
};

/** The category and every sub-category below it. */
export const withDescendants = (categoryId: number, childrenOf: Map<number, Category[]>): number[] => {
    const out = [categoryId];
    for (const child of childrenOf.get(categoryId) ?? []) {
        out.push(...withDescendants(child.id, childrenOf));
    }
    return out;
};

/** Ancestors of a category, nearest first. */
export const ancestorsOf = (categoryId: number, categories: Category[]): number[] => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const out: number[] = [];
    let parent = byId.get(categoryId)?.parentCategoryId ?? null;
    while (parent != null && byId.has(parent) && !out.includes(parent)) {
        out.push(parent);
        parent = byId.get(parent)?.parentCategoryId ?? null;
    }
    return out;
};
