import { useState, useEffect, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Order } from '../api/mockDashboard';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { useOrderStore, ORDER_STATUS_GROUPS } from '../store/useOrderStore';


const EMPTY_ARRAY: any[] = [];

export const useRecentOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const orders = useOrderStore(
        useShallow(state =>
            selectedAddressId ? state.recentOrders[selectedAddressId] || EMPTY_ARRAY : EMPTY_ARRAY
        )
    );
    const pagination = useOrderStore(
        useShallow(state =>
            selectedAddressId ? state.orderPages[selectedAddressId] || { current: 1, total: 1 } : { current: 1, total: 1 }
        )
    );
    const isLoading = useOrderStore(
        useShallow(state => selectedAddressId ? state.loading[selectedAddressId] : false)
    );
    const fetchOrders = useOrderStore(state => state.fetchOrders);

    useEffect(() => {
        // Only fetch if data is missing or we are on a different page than what's available
        if (selectedAddressId && !orders.length) {
            fetchOrders(selectedAddressId, pagination.current);
        }
    }, [selectedAddressId, pagination.current, orders.length, fetchOrders]);

    const goToPage = (page: number) => {
        if (selectedAddressId) {
            fetchOrders(selectedAddressId, page);
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

export const usePendingOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    return useOrderStore(
        useShallow(state => {
            const orders = selectedAddressId ? state.recentOrders[selectedAddressId] || (EMPTY_ARRAY as Order[]) : (EMPTY_ARRAY as Order[]);
            const pendingCount = orders.filter(o => ORDER_STATUS_GROUPS.New.includes(o.status as any)).length;
            return {
                hasPendingOrders: pendingCount > 0,
                pendingCount
            };
        })
    );
};

export type OrderTab = 'New' | 'Preparing' | 'Ready' | 'Completed';

export const useLiveOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const recentOrders = useOrderStore(
        useShallow(state =>
            selectedAddressId ? state.recentOrders[selectedAddressId] || (EMPTY_ARRAY as Order[]) : (EMPTY_ARRAY as Order[])
        )
    );

    // Actions from store
    const acceptOrderStore = useOrderStore(state => state.acceptOrder);
    const rejectOrderStore = useOrderStore(state => state.rejectOrder);
    const markReadyStore = useOrderStore(state => state.markReady);
    const markCompletedStore = useOrderStore(state => state.markCompleted);
    const cancelOrderStore = useOrderStore(state => state.cancelOrder);
    const extendTimeStore = useOrderStore(state => state.extendTime);

    const [activeTab, setActiveTab] = useState<OrderTab>('New');

    // Shared status group checks
    const isNew = (s: string) => (ORDER_STATUS_GROUPS.New as readonly string[]).includes(s);
    const isPreparing = (s: string) => (ORDER_STATUS_GROUPS.Preparing as readonly string[]).includes(s);
    const isReady = (s: string) => (ORDER_STATUS_GROUPS.Ready as readonly string[]).includes(s);
    const isCompleted = (s: string) => (ORDER_STATUS_GROUPS.Completed as readonly string[]).includes(s);

    // Counts for tabs - Centralized from store logic
    const counts = useMemo(() => ({
        New: recentOrders.filter(o => isNew(o.status)).length,
        Preparing: recentOrders.filter(o => isPreparing(o.status)).length,
        Ready: recentOrders.filter(o => isReady(o.status)).length,
        Completed: recentOrders.filter(o => isCompleted(o.status)).length,
    }), [recentOrders]);

    // Filtered orders based on active tab
    const filteredOrders = useMemo(() => {
        return recentOrders.filter(order => {
            if (activeTab === 'New') return isNew(order.status);
            if (activeTab === 'Preparing') return isPreparing(order.status);
            if (activeTab === 'Ready') return isReady(order.status);
            if (activeTab === 'Completed') return isCompleted(order.status);
            return false;
        });
    }, [recentOrders, activeTab]);

    const acceptOrder = useCallback(async (orderId: string, prepTime: number, giftMessage?: string) => {
        if (selectedAddressId) {
            await acceptOrderStore(selectedAddressId, orderId, prepTime, giftMessage);
        }
    }, [selectedAddressId, acceptOrderStore]);

    const rejectOrder = useCallback(async (orderId: string, reason: string) => {
        if (selectedAddressId) {
            await rejectOrderStore(selectedAddressId, orderId, reason);
        }
    }, [selectedAddressId, rejectOrderStore]);

    const markReady = useCallback(async (orderId: string) => {
        if (selectedAddressId) {
            await markReadyStore(selectedAddressId, orderId);
        }
    }, [selectedAddressId, markReadyStore]);

    const markCompleted = useCallback(async (orderId: string) => {
        if (selectedAddressId) {
            await markCompletedStore(selectedAddressId, orderId);
        }
    }, [selectedAddressId, markCompletedStore]);

    const cancelOrder = useCallback(async (orderId: string, reason: string) => {
        if (selectedAddressId) {
            await cancelOrderStore(selectedAddressId, orderId, reason);
        }
    }, [selectedAddressId, cancelOrderStore]);

    const extendTime = useCallback(async (orderId: string, additionalMinutes: number) => {
        if (selectedAddressId) {
            await extendTimeStore(selectedAddressId, orderId, additionalMinutes);
        }
    }, [selectedAddressId, extendTimeStore]);

    const actions = useMemo(() => ({
        acceptOrder,
        rejectOrder,
        markReady,
        markCompleted,
        cancelOrder,
        extendTime
    }), [acceptOrder, rejectOrder, markReady, markCompleted, cancelOrder, extendTime]);

    return {
        activeTab,
        setActiveTab,
        orders: filteredOrders,
        counts,
        actions
    };
};
