import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StatMetric, Order } from '../api/mockDashboard';

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

interface RestaurantState {
    name: string;
    details: RestaurantDetails | null;
    addresses: Address[];
    selectedAddressId: string | null;

    // Dashboard Data
    statuses: Record<string, RestaurantStatus>;
    stats: Record<string, StatMetric[]>;
    recentOrders: Record<string, Order[]>;

    // Actions
    setRestaurantName: (name: string) => void;
    setRestaurantDetails: (details: RestaurantDetails) => void;
    updateStatus: (addressId: string, status: RestaurantStatus) => void;
    setAddresses: (addresses: Address[]) => void;
    addAddress: (address: Address) => void;
    removeAddress: (id: string) => void;
    setSelectedAddressId: (id: string) => void;
    setStats: (addressId: string, stats: StatMetric[]) => void;
    setRecentOrders: (addressId: string, orders: Order[]) => void;
    reset: () => void;
}

const initialState = {
    name: '',
    details: null,
    statuses: {},
    addresses: [],
    selectedAddressId: null,
    stats: {},
    recentOrders: {},
};

export const useRestaurantStore = create<RestaurantState>()(
    persist(
        (set) => ({
            ...initialState,
            setRestaurantName: (name) => set({ name }),
            setRestaurantDetails: (details) => set({ details }),
            updateStatus: (addressId, status) => set((state) => ({
                statuses: { ...state.statuses, [addressId]: status }
            })),
            setAddresses: (addresses) => set({ addresses }),
            addAddress: (address) => set((state) => ({
                addresses: [...state.addresses, address]
            })),
            removeAddress: (id) => set((state) => ({
                addresses: state.addresses.filter((addr) => addr.id !== id)
            })),
            setSelectedAddressId: (id) => set({ selectedAddressId: id }),
            setStats: (addressId, stats) => set((state) => ({
                stats: { ...state.stats, [addressId]: stats }
            })),
            setRecentOrders: (addressId, orders) => set((state) => ({
                recentOrders: { ...state.recentOrders, [addressId]: orders }
            })),
            reset: () => set(initialState),
        }),
        {
            name: 'restaurant-storage-v2',
        }
    )
);
