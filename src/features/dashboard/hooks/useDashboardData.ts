import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    mockDashboardService,
    type StatMetric,
    type Order,
    type OutletStatus
} from '../api/mockDashboard';
import { useRestaurantStore, ALL_LOCATIONS_ID, type RestaurantStatus } from '../store/useRestaurantStore';

export type { StatMetric, Order, OutletStatus };

const EMPTY_ARRAY: any[] = [];

export const useOutletStatus = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const setLoading = useRestaurantStore(state => state.setLoading);
    const [aggregateData, setAggregateData] = useState<{ openCount: number; closedCount: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const storeStatus = useRestaurantStore(
        useShallow(state =>
            selectedAddressId && state.statuses[selectedAddressId]
                ? state.statuses[selectedAddressId]
                : 'open'
        )
    );
    const isLoading = useRestaurantStore(
        useShallow(state => selectedAddressId ? state.loading.status[selectedAddressId] : false)
    );
    const updateStoreStatus = useRestaurantStore(state => state.updateStatus);

    // Derived status object for components
    const status: OutletStatus = {
        isOpen: storeStatus === 'open',
        openCount: selectedAddressId === ALL_LOCATIONS_ID ? aggregateData?.openCount : undefined,
        closedCount: selectedAddressId === ALL_LOCATIONS_ID ? aggregateData?.closedCount : undefined
    };

    useEffect(() => {
        if (!selectedAddressId) return;

        const revalidate = async () => {
            setError(null);
            setLoading('status', selectedAddressId, true);
            try {
                const remoteStatus = await mockDashboardService.getOutletStatus(selectedAddressId);

                if ('openCount' in remoteStatus && remoteStatus.openCount !== undefined) {
                    setAggregateData({
                        openCount: remoteStatus.openCount ?? 0,
                        closedCount: remoteStatus.closedCount ?? 0
                    });
                } else {
                    const mappedStatus: RestaurantStatus = remoteStatus.isOpen ? 'open' : 'closed';
                    updateStoreStatus(selectedAddressId, mappedStatus);
                }
            } catch (err) {
                console.error("Failed to revalidate status", err);
                setError("Failed to load status. Please try again.");
            } finally {
                setLoading('status', selectedAddressId, false);
            }
        };
        revalidate();
    }, [selectedAddressId]);

    const toggleStatus = async () => {
        if (!selectedAddressId) return;

        setError(null);
        setLoading('status', selectedAddressId, true);
        try {
            const newStatus = await mockDashboardService.updateOutletStatus(selectedAddressId, !status.isOpen);
            console.log(selectedAddressId, newStatus.isOpen)
            updateStoreStatus(selectedAddressId, newStatus.isOpen ? 'open' : 'closed');
        } catch (err) {
            console.error("Failed to update status", err);
            setError("Failed to update status. Please try again.");
        } finally {
            setLoading('status', selectedAddressId, false);
        }
    };

    return { status, toggleStatus, isLoading, error };
};

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




