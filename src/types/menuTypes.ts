/**
 * Represents the dietary type of a menu item.
 */
export type FoodType = 'veg' | 'non_veg' | 'contains_egg';

/**
 * Represents a single item in the restaurant menu.
 */
export interface MenuItem {
    /** Unique identifier for the menu item */
    id: number;
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
    /** Map of restaurant IDs (address IDs) to their stock status */
    inStock: Record<string, boolean>;
    /** Tax amount applicable to this item */
    taxAmount: number;
    /** Packaging charges for the item */
    packagingCharges: number;
    /** Whether the discount is an absolute value (true) or a percentage (false) */
    discountIsAbsolute: boolean;
    /** Tracks if the item is marked for deletion in local edits */
    isDeleted?: boolean;
    /** Current status of the item (e.g., 'active', 'inactive', 'blocked') */
    status?: string;
}

/**
 * Represents a category of menu items (e.g., Starters, Main Course).
 */
export interface Category {
    /** Unique identifier for the category */
    id: number;
    /** Display name of the category */
    name: string;
    /** Detailed description of the category */
    description?: string;
    /** ID of the parent category if this is a subcategory */
    parentCategoryId?: number | null;
    /** List of child categories (populated on frontend) */
    subCategories?: Category[];
    /** Total number of items in this category (Calculated on frontend) */
    itemCount?: number;
    /** Current page of items loaded */
    currentPage?: number;
    /** Total number of pages available for items */
    totalPages?: number;
    /** List of menu items belonging to this category (optional, loaded on demand) */
    items?: MenuItem[];
    /** Status of the category */
    status?: 'active' | 'inactive';
}
