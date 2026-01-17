/**
 * Represents a single item in the restaurant menu.
 */
export interface MenuItem {
    /** Unique identifier for the menu item */
    id: string;
    /** Display name of the item */
    name: string;
    /** Price of the item in the local currency */
    price: number;
    /** URL of the image representing the item */
    image: string;
    /** Indicates if the item is vegetarian */
    isVeg: boolean;
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
    /** Total number of items in this category */
    itemCount: number;
    /** List of menu items belonging to this category */
    items: MenuItem[];
}
