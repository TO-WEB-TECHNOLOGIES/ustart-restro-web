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

export const useRecentOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const orders = useRestaurantStore(
        useShallow(state =>
            selectedAddressId ? state.recentOrders[selectedAddressId] || EMPTY_ARRAY : EMPTY_ARRAY
        )
    );
    const pagination = useRestaurantStore(
        useShallow(state =>
            selectedAddressId ? state.orderPages[selectedAddressId] || { current: 1, total: 1 } : { current: 1, total: 1 }
        )
    );
    const setRecentOrders = useRestaurantStore(state => state.setRecentOrders);
    const setOrderPagination = useRestaurantStore(state => state.setOrderPagination);
    const setLoading = useRestaurantStore(state => state.setLoading);
    const isLoading = useRestaurantStore(
        useShallow(state => selectedAddressId ? state.loading.orders[selectedAddressId] : false)
    );

    const fetchOrders = async (page: number) => {
        if (!selectedAddressId) return;

        setLoading('orders', selectedAddressId, true);
        try {
            const data = await mockDashboardService.getRecentOrders(selectedAddressId, page, 5);
            setRecentOrders(selectedAddressId, data.orders);
            setOrderPagination(selectedAddressId, { current: page, total: data.totalPages });
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading('orders', selectedAddressId, false);
        }
    };

    useEffect(() => {
        if (selectedAddressId) {
            fetchOrders(pagination.current);
        }
    }, [selectedAddressId, pagination.current]);

    const goToPage = (page: number) => {
        if (selectedAddressId) {
            setOrderPagination(selectedAddressId, { ...pagination, current: page });
        }
    };

    return {
        orders: orders as Order[],
        isLoading,
        currentPage: pagination.current,
        totalPages: pagination.total,
        goToPage
    };
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

export const usePendingOrders = () => {
    const recentOrders = useRestaurantStore(
        useShallow(state => state.recentOrders)
    );

    // Filter to get only "New" orders across all branches
    // We use a Set of order IDs to avoid duplicate counting if an order appears in both 'all' and a specific branch
    const newOrderIds = new Set<string>();

    Object.values(recentOrders).forEach(orders => {
        orders.forEach(order => {
            if (order.status === 'ORDER_CREATED_BY_CUSTOMER') {
                newOrderIds.add(order.id);
            }
        });
    });

    return {
        hasPendingOrders: newOrderIds.size > 0,
        pendingCount: newOrderIds.size
    };
};

export type OrderTab = 'New' | 'Preparing' | 'Ready' | 'Completed';

export const useLiveOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const recentOrders = useRestaurantStore(
        useShallow(state =>
            selectedAddressId ? state.recentOrders[selectedAddressId] || (EMPTY_ARRAY as Order[]) : (EMPTY_ARRAY as Order[])
        )
    );
    const setRecentOrders = useRestaurantStore(state => state.setRecentOrders);
    const updateOrder = useRestaurantStore(state => state.updateOrder);
    const [activeTab, setActiveTab] = useState<OrderTab>('New');

    // Helper functions for status grouping
    const isNew = (s: string) => ['ORDER_CREATED_BY_CUSTOMER'].includes(s);

    const isPreparing = (s: string) => [
        'ORDER_APPROVED_BY_RESTRO',
        'DELIVERY_PARTNER_ASSIGNED',
        'TIME_EXTENDED_BY_RESTRO',
        'DELIVERY_PARTNER_AT_RESTRO'
    ].includes(s);

    const isReady = (s: string) => ['ORDER_READY_BY_RESTRO'].includes(s);

    const isCompleted = (s: string) => [
        'ORDER_PICKED',
        'DELIVERY_PARTNER_AT_STATION',
        'DELIVERED',
        'CUSTOMER_NOT_RESPONDING',
        'UNDELIVERABLE_BY_DELIVER_PARTNER'
    ].includes(s);

    // Counts for tabs
    const counts = {
        New: recentOrders.filter(o => isNew(o.status)).length,
        Preparing: recentOrders.filter(o => isPreparing(o.status)).length,
        Ready: recentOrders.filter(o => isReady(o.status)).length,
        Completed: recentOrders.filter(o => isCompleted(o.status)).length,
    };

    // Filtered orders based on active tab
    const filteredOrders = recentOrders.filter(order => {
        if (activeTab === 'New') return isNew(order.status);
        if (activeTab === 'Preparing') return isPreparing(order.status);
        if (activeTab === 'Ready') return isReady(order.status);
        if (activeTab === 'Completed') return isCompleted(order.status);
        return false;
    });

    const refreshOrders = async () => {
        if (!selectedAddressId) return;
        const data = await mockDashboardService.getRecentOrders(selectedAddressId, 1, 100);
        setRecentOrders(selectedAddressId, data.orders);
    };

    useEffect(() => {
        refreshOrders();
    }, [selectedAddressId]);

    const acceptOrder = async (orderId: string, prepTime: number, giftMessage?: string) => {
        updateOrder(orderId, { status: 'ORDER_APPROVED_BY_RESTRO', prepTime });
        const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_APPROVED_BY_RESTRO', prepTime, giftMessage);
        if (success) refreshOrders();
    };

    const rejectOrder = async (orderId: string, reason: string) => {
        if (selectedAddressId) useRestaurantStore.getState().removeOrder(selectedAddressId, orderId);
        const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_REJECTED_BY_RESTRO', undefined, undefined, reason);
        if (success) refreshOrders();
    };

    const markReady = async (orderId: string) => {
        updateOrder(orderId, { status: 'ORDER_READY_BY_RESTRO' });
        setActiveTab('Ready');
        const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_READY_BY_RESTRO');
        if (success) refreshOrders();
    };

    const markCompleted = async (orderId: string) => {
        updateOrder(orderId, { status: 'ORDER_PICKED' });
        const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_PICKED');
        if (success) refreshOrders();
    };

    const cancelOrder = async (orderId: string, reason: string) => {
        if (selectedAddressId) useRestaurantStore.getState().removeOrder(selectedAddressId, orderId);
        const success = await mockDashboardService.updateOrderStatus(orderId, 'CANCELLED_BY_RESTRO', undefined, undefined, reason);
        if (success) refreshOrders();
    };

    const extendTime = async (orderId: string, additionalMinutes: number) => {
        const success = await mockDashboardService.updateOrderStatus(orderId, 'TIME_EXTENDED_BY_RESTRO', additionalMinutes);
        if (success) refreshOrders();
    };

    return {
        activeTab,
        setActiveTab,
        orders: filteredOrders,
        counts,
        actions: {
            acceptOrder,
            rejectOrder,
            markReady,
            markCompleted,
            cancelOrder,
            extendTime
        }
    };
};
