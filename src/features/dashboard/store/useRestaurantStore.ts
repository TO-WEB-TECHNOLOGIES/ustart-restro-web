import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
    id: string;
    label: string;
    address: string;
}

interface RestaurantState {
    name: string;
    details: {
        id: string;
        address?: string;
        contact?: string;
        status: 'open' | 'closed';
    } | null;
    addresses: Address[];
    selectedAddressId: string | null;

    // Actions
    setRestaurantName: (name: string) => void;
    setRestaurantDetails: (details: any) => void;
    setAddresses: (addresses: Address[]) => void;
    setSelectedAddressId: (id: string) => void;
    reset: () => void;
}

const initialState = {
    name: '',
    details: null,
    addresses: [],
    selectedAddressId: null,
};

export const useRestaurantStore = create<RestaurantState>()(
    persist(
        (set) => ({
            ...initialState,
            setRestaurantName: (name) => set({ name }),
            setRestaurantDetails: (details) => set({ details }),
            setAddresses: (addresses) => set({ addresses }),
            setSelectedAddressId: (id) => set({ selectedAddressId: id }),
            reset: () => set(initialState),
        }),
        {
            name: 'restaurant-storage',
        }
    )
);
