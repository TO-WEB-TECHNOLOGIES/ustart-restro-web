/**
 * Represents the dietary type of a menu item.
 */
export type FoodType = 'veg' | 'non_veg' | 'contains_egg';

/**
 * Represents a single item in the restaurant menu.
 */
export interface MenuItem {
    /** Unique identifier for the menu item */
    id: string;
    /** Display name of the item */
    name: string;
    /** Detailed description of the item */
    description?: string;
    /** Base price of the item before discount */
    itemPrice: number;
    /** Applied discount amount */
    discountAmount: number;
    /** Price of the item in the local currency (Deprecated in favor of itemPrice - discountAmount) */
    price?: number;
    /** URL of the image representing the item (optional) */
    image?: string;
    /** Dietary classification of the item */
    foodType: FoodType;
    /** Indicates if the item has customization options */
    isCustomisable: boolean;
    /** Optional flag indicating if the item currently has a discount */
    hasDiscount?: boolean;
}

/**
 * Represents a category of menu items (e.g., Starters, Main Course).
 */
export interface Category {
    /** Unique identifier for the category */
    id: string;
    /** Display name of the category */
    name: string;
    /** Detailed description of the category */
    description?: string;
    /** ID of the parent category if this is a subcategory */
    parentCategoryId?: string | null;
    /** List of child categories (populated on frontend) */
    subCategories?: Category[];
    /** Total number of items in this category (Calculated on frontend) */
    itemCount?: number;
    /** List of menu items belonging to this category (optional, loaded on demand) */
    items?: MenuItem[];
}
