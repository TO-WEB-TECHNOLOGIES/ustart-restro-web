import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StatMetric } from '../api/mockDashboard';
import { type Address, type RestaurantDetails, type RestaurantStatus } from '@/types/storeTypes';


interface RestaurantState {
    name: string;
    details: RestaurantDetails | null;
    addresses: Address[];
    selectedAddressId: string | null;

    // Dashboard Data
    statuses: Record<string, RestaurantStatus>;
    stats: Record<string, StatMetric[]>;

    // Granular Loading States
    loading: {
        status: Record<string, boolean>;
        stats: Record<string, boolean>;
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
    setLoading: (type: 'status' | 'stats', id: string, isLoading: boolean) => void;
    reset: () => void;
}

const initialState = {
    name: '',
    details: null,
    statuses: {},
    addresses: [],
    selectedAddressId: null,
    stats: {},
    loading: {
        status: {},
        stats: {},
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
            setLoading: (type, id, isLoading) => set((state) => ({
                loading: {
                    ...state.loading,
                    [type]: { ...state.loading[type], [id]: isLoading }
                }
            })),
            reset: () => set(initialState),
        }),
        {
            name: 'restaurant-storage-v5', // Incrementing version to invalidate old state with orders
        }
    )
);
