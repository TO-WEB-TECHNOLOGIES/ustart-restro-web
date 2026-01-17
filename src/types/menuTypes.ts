export interface MenuItem {
    id: string;
    name: string;
    price: number;
    image: string;
    isVeg: boolean;
    isCustomisable: boolean;
    hasDiscount?: boolean;
}

export interface Category {
    id: string;
    name: string;
    itemCount: number;
    items: MenuItem[];
}
