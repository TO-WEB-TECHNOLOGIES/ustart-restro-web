import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    mockDashboardService,
    type Order
} from '../api/mockDashboard';
import { useRestaurantStore } from '../store/useRestaurantStore';

const EMPTY_ARRAY: any[] = [];

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

export const usePendingOrders = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const orders = useRestaurantStore(
        useShallow(state =>
            selectedAddressId ? state.recentOrders[selectedAddressId] || (EMPTY_ARRAY as Order[]) : (EMPTY_ARRAY as Order[])
        )
    );

    const pendingCount = orders.filter(o => o.status === 'ORDER_CREATED_BY_CUSTOMER').length;

    return {
        hasPendingOrders: pendingCount > 0,
        pendingCount
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
