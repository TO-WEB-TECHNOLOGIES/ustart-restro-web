export type RestaurantStatus = 'open' | 'closed' | 'busy';

export const ALL_LOCATIONS_ID = 'all';

export interface Address {
    id: string;
    label: string;
    address: string;
    isDefault?: boolean;
}

export interface RestaurantDetails {
    id: string;
    email?: string;
    contact?: string;
    description?: string;
    cuisineTypes?: string[];
}
