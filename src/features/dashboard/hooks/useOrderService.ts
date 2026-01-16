import { useEffect, useRef } from 'react';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { useOrderStore } from '../store/useOrderStore';
import { mockDashboardService } from '../api/mockDashboard';

/**
 * Service hook to handle background order fetching and synchronization.
 * Runs in DashboardLayout to ensure data is always fresh across the feature.
 */
export const useOrderService = () => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const setRecentOrders = useOrderStore(state => state.setRecentOrders);
    const setLoading = useOrderStore(state => state.setLoading);
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOrders = async (silent = false) => {
        if (!selectedAddressId) return;

        if (!silent) setLoading(selectedAddressId, true);

        try {
            // Fetch a larger set for live tracking (e.g., first 50 orders)
            const data = await mockDashboardService.getRecentOrders(selectedAddressId, 1, 50);
            setRecentOrders(selectedAddressId, data.orders);

            // We can also sync pagination if needed, but background service 
            // usually focuses on keeping the "live" set updated.
        } catch (err) {
            console.error("Background Order Fetch Failed:", err);
        } finally {
            if (!silent) setLoading(selectedAddressId, false);
        }
    };

    useEffect(() => {
        if (!selectedAddressId) return;

        // Fresh fetch on address change
        fetchOrders();

        // Setup Polling (every 30 seconds for mock, in real app might be WebSocket)
        pollInterval.current = setInterval(() => {
            fetchOrders(true);
        }, 30000);

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
            }
        };
    }, [selectedAddressId]);

    return {
        refresh: fetchOrders
    };
};
