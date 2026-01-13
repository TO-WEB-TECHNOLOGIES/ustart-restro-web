import { useState, useEffect } from 'react';
import {
    mockDashboardService,
    type StatMetric,
    type Order,
    type OutletStatus
} from '../api/mockDashboard';
import { useRestaurantStore, type RestaurantStatus } from '../store/useRestaurantStore';

export type { StatMetric, Order, OutletStatus };

// Helper to map store status to OutletStatus
const mapStatusToOutletStatus = (status: RestaurantStatus): OutletStatus => ({
    isOpen: status === 'open'
});

const EMPTY_ARRAY: any[] = [];

export const useOutletStatus = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);

    // Select status safely
    const storeStatus = useRestaurantStore(state =>
        selectedAddressId && state.statuses[selectedAddressId]
            ? state.statuses[selectedAddressId]
            : 'open' // Default fallback
    );
    const updateStoreStatus = useRestaurantStore(state => state.updateStatus);

    // Initialize with store data
    const [status, setStatus] = useState<OutletStatus>(mapStatusToOutletStatus(storeStatus));
    const [isLoading, setIsLoading] = useState(false);

    // Sync local state when store changes
    useEffect(() => {
        setStatus(mapStatusToOutletStatus(storeStatus));
    }, [storeStatus]);

    // Revalidate on mount & when address changes
    useEffect(() => {
        if (!selectedAddressId) return;

        const revalidate = async () => {
            setIsLoading(true);
            try {
                const remoteStatus = await mockDashboardService.getOutletStatus(selectedAddressId);

                // If it's an aggregate response (has openCount), we update local state directly 
                // because our store structure assumes a simple status string for 'statuses'.
                // Ideally, we'd refactor the store to hold richer status objects, 
                // but for now, we'll bypass the store for the aggregate view or force a status.

                if ('openCount' in remoteStatus && remoteStatus.openCount !== undefined) {
                    // It's an aggregate status
                    setStatus({
                        isOpen: remoteStatus.isOpen, // General open status
                        openCount: remoteStatus.openCount,
                        closedCount: remoteStatus.closedCount
                    });
                } else {
                    // Regular status
                    const mappedStatus: RestaurantStatus = remoteStatus.isOpen ? 'open' : 'closed';
                    // Update store only for single outlets to keep other components in sync
                    updateStoreStatus(selectedAddressId, mappedStatus);
                    setStatus(mapStatusToOutletStatus(mappedStatus));
                }

            } catch (error) {
                console.error("Failed to revalidate status", error);
            } finally {
                setIsLoading(false);
            }
        };
        revalidate();
    }, [selectedAddressId]); // Depend on addressId only

    const toggleStatus = async () => {
        if (!selectedAddressId) return;

        setIsLoading(true);
        try {
            const newStatus = await mockDashboardService.updateOutletStatus(selectedAddressId, !status.isOpen);
            updateStoreStatus(selectedAddressId, newStatus.isOpen ? 'open' : 'closed');
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { status, toggleStatus, isLoading };
};

export const useStats = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const stats = useRestaurantStore(state =>
        selectedAddressId ? state.stats[selectedAddressId] || EMPTY_ARRAY : EMPTY_ARRAY
    );
    const setStats = useRestaurantStore(state => state.setStats);
    const [isLoading, setIsLoading] = useState(stats.length === 0);

    useEffect(() => {
        if (!selectedAddressId) return;

        const fetchStats = async () => {
            try {
                const data = await mockDashboardService.getStats(selectedAddressId);
                // Simple check to avoid unnecessary updates if deep equal
                if (JSON.stringify(data) !== JSON.stringify(stats)) {
                    setStats(selectedAddressId, data);
                }
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [selectedAddressId]); // stats omitted from deps intentionally

    return { stats: stats as StatMetric[], isLoading };
};

export const useRecentOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const orders = useRestaurantStore(state =>
        selectedAddressId ? state.recentOrders[selectedAddressId] || EMPTY_ARRAY : EMPTY_ARRAY
    );
    const setRecentOrders = useRestaurantStore(state => state.setRecentOrders);
    const [isLoading, setIsLoading] = useState(orders.length === 0);

    useEffect(() => {
        if (!selectedAddressId) return;

        const fetchOrders = async () => {
            try {
                const data = await mockDashboardService.getRecentOrders(selectedAddressId);
                if (JSON.stringify(data) !== JSON.stringify(orders)) {
                    setRecentOrders(selectedAddressId, data);
                }
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [selectedAddressId]);

    return { orders: orders as Order[], isLoading };
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
