import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    mockDashboardService,
    type StatMetric,
    type Order,
    type OutletStatus
} from '../api/mockDashboard';
import { useRestaurantStore } from '../store/useRestaurantStore';

export type { StatMetric, Order, OutletStatus };

const EMPTY_ARRAY: any[] = [];

// 2026-11-12: useOutletStatus (mock open/closed) removed; the header and home card read the real
// status through hooks/useOutletStatus.ts.

export const useStats = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const stats = useRestaurantStore(
        useShallow(state =>
            selectedAddressId ? state.stats[selectedAddressId] || EMPTY_ARRAY : EMPTY_ARRAY
        )
    );
    const setStats = useRestaurantStore(state => state.setStats);
    const setLoading = useRestaurantStore(state => state.setLoading);
    const isLoading = useRestaurantStore(
        useShallow(state => selectedAddressId ? state.loading.stats[selectedAddressId] : false)
    );

    useEffect(() => {
        if (!selectedAddressId) return;

        const fetchStats = async () => {
            setLoading('stats', selectedAddressId, true);
            try {
                const data = await mockDashboardService.getStats(selectedAddressId);
                if (JSON.stringify(data) !== JSON.stringify(stats)) {
                    setStats(selectedAddressId, data);
                }
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading('stats', selectedAddressId, false);
            }
        };
        fetchStats();
    }, [selectedAddressId]);

    return { stats: stats as StatMetric[], isLoading };
};


export const useRestaurantDetails = () => {
    const { setRestaurantName, setAddresses } = useRestaurantStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await mockDashboardService.getRestaurantDetails();
                setRestaurantName(data.name);
                setAddresses(data.addresses);
            } catch (err) {
                console.error("Failed to fetch restaurant details", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, []);
    return { isLoading };
};

export const useAddressSearch = () => {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [results, setResults] = useState<{ id: string; label: string; address: string }[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            setIsLoading(true);
            try {
                const data = await mockDashboardService.searchAddresses(query, page, 5);
                setResults(data.addresses);
                setTotalPages(data.totalPages);
            } catch (err) {
                console.error("Failed to search addresses", err);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce search
        const timer = setTimeout(() => {
            fetchAddresses();
        }, query ? 300 : 0);

        return () => clearTimeout(timer);
    }, [query, page]);

    return {
        query,
        setQuery,
        page,
        setPage,
        results,
        totalPages,
        isLoading
    };
};




