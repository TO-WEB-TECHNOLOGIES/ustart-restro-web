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
    orderPages: Record<string, { current: number; total: number }>;

    // Granular Loading States
    loading: {
        status: Record<string, boolean>;
        stats: Record<string, boolean>;
        orders: Record<string, boolean>;
    };

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
    setOrderPagination: (addressId: string, pagination: { current: number; total: number }) => void;
    setLoading: (type: 'status' | 'stats' | 'orders', id: string, isLoading: boolean) => void;
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
    orderPages: {},
    loading: {
        status: {},
        stats: {},
        orders: {},
    },
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
            setOrderPagination: (addressId, pagination) => set((state) => ({
                orderPages: { ...state.orderPages, [addressId]: pagination }
            })),
            setLoading: (type, id, isLoading) => set((state) => ({
                loading: {
                    ...state.loading,
                    [type]: { ...state.loading[type], [id]: isLoading }
                }
            })),
            reset: () => set(initialState),
        }),
        {
            name: 'restaurant-storage-v4', // Incremented version after removing aggregateStatus
        }
    )
);
