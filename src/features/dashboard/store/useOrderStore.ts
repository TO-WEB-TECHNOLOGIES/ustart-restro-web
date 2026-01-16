import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Order, mockDashboardService } from '../api/mockDashboard';

interface OrderState {
    recentOrders: Record<string, Order[]>; // Keyed by addressId
    orderPages: Record<string, { current: number; total: number }>;
    loading: Record<string, boolean>; // Keyed by addressId

    // Data Setters
    setRecentOrders: (addressId: string, orders: Order[]) => void;
    setOrderPagination: (addressId: string, pagination: { current: number; total: number }) => void;
    setLoading: (addressId: string, isLoading: boolean) => void;
    updateOrder: (orderId: string, updates: Partial<Order>) => void;
    removeOrder: (addressId: string, orderId: string) => void;
    reset: () => void;

    // Async Actions
    fetchOrders: (addressId: string, page: number, limit?: number) => Promise<void>;
    acceptOrder: (addressId: string, orderId: string, prepTime: number, giftMessage?: string) => Promise<void>;
    rejectOrder: (addressId: string, orderId: string, reason: string) => Promise<void>;
    markReady: (addressId: string, orderId: string) => Promise<void>;
    markCompleted: (addressId: string, orderId: string) => Promise<void>;
    cancelOrder: (addressId: string, orderId: string, reason: string) => Promise<void>;
    extendTime: (addressId: string, orderId: string, additionalMinutes: number) => Promise<void>;
}

const initialState = {
    recentOrders: {},
    orderPages: {},
    loading: {},
};

export const ORDER_STATUS_GROUPS = {
    New: ['ORDER_CREATED_BY_CUSTOMER'],
    Preparing: ['ORDER_APPROVED_BY_RESTRO', 'DELIVERY_PARTNER_ASSIGNED', 'TIME_EXTENDED_BY_RESTRO', 'DELIVERY_PARTNER_AT_RESTRO'],
    Ready: ['ORDER_READY_BY_RESTRO'],
    Completed: ['ORDER_PICKED', 'DELIVERY_PARTNER_AT_STATION', 'DELIVERED', 'COMPLETED', 'CUSTOMER_NOT_RESPONDING', 'UNDELIVERABLE_BY_DELIVER_PARTNER']
} as const;

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            ...initialState,
            setRecentOrders: (addressId, orders) => set((state) => ({
                recentOrders: { ...state.recentOrders, [addressId]: orders }
            })),
            setOrderPagination: (addressId, pagination) => set((state) => ({
                orderPages: { ...state.orderPages, [addressId]: pagination }
            })),
            setLoading: (addressId, isLoading) => set((state) => ({
                loading: { ...state.loading, [addressId]: isLoading }
            })),
            removeOrder: (_addressId, orderId) => set((state) => {
                const updatedOrders = { ...state.recentOrders };
                // More robust removal: remove from EVERY potential key in the store
                Object.keys(updatedOrders).forEach(key => {
                    updatedOrders[key] = (updatedOrders[key] || []).filter(o => o.id !== orderId);
                });
                return { recentOrders: updatedOrders };
            }),
            updateOrder: (orderId, updates) => set((state) => {
                const updatedOrders = { ...state.recentOrders };
                Object.keys(updatedOrders).forEach(key => {
                    updatedOrders[key] = (updatedOrders[key] || []).map(o => {
                        if (o.id === orderId) {
                            const newOrder = { ...o, ...updates };
                            // Add log entry if status is updating
                            if (updates.status) {
                                const newLog = { status: updates.status, timestamp: Date.now() };
                                newOrder.logs = [...(o.logs || []), newLog];
                            }
                            return newOrder;
                        }
                        return o;
                    });
                });
                return { recentOrders: updatedOrders };
            }),
            reset: () => set(initialState),

            // Async Actions Implementation
            fetchOrders: async (addressId, page, limit = 5) => {
                if (!addressId) return;
                get().setLoading(addressId, true);
                try {
                    const data = await mockDashboardService.getRecentOrders(addressId, page, limit);
                    get().setRecentOrders(addressId, data.orders);
                    get().setOrderPagination(addressId, { current: page, total: data.totalPages });
                } catch (err) {
                    console.error("Failed to fetch orders", err);
                } finally {
                    get().setLoading(addressId, false);
                }
            },

            acceptOrder: async (addressId, orderId, prepTime, giftMessage) => {
                const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_APPROVED_BY_RESTRO', prepTime, giftMessage);
                if (success) {
                    // Update local store only after success
                    get().updateOrder(orderId, { status: 'ORDER_APPROVED_BY_RESTRO', prepTime });
                    // Refresh data to ensure consistency
                    await get().fetchOrders(addressId, 1, 50);
                }
            },

            rejectOrder: async (addressId, orderId, reason) => {
                console.log(`[Store] Rejecting order ${orderId} for address ${addressId}. Reason: ${reason}`);
                const success = await mockDashboardService.rejectOrder(orderId, reason);
                if (success) {
                    get().removeOrder(addressId, orderId);
                    console.log(`[Store] Successfully rejected ${orderId}. Refreshing data for ${addressId}...`);
                    await get().fetchOrders(addressId, 1, 50);
                }
            },

            markReady: async (addressId, orderId) => {
                const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_READY_BY_RESTRO');
                if (success) {
                    // Update local store only after success
                    get().updateOrder(orderId, { status: 'ORDER_READY_BY_RESTRO' });
                    await get().fetchOrders(addressId, 1, 50);
                }
            },

            markCompleted: async (addressId, orderId) => {
                const success = await mockDashboardService.updateOrderStatus(orderId, 'ORDER_PICKED');
                if (success) {
                    // Update local store only after success
                    get().updateOrder(orderId, { status: 'ORDER_PICKED' });
                    await get().fetchOrders(addressId, 1, 50);
                }
            },

            cancelOrder: async (addressId, orderId, reason) => {
                const success = await mockDashboardService.updateOrderStatus(orderId, 'CANCELLED_BY_RESTRO', undefined, undefined, reason);
                if (success) {
                    // Remove from local store only after success
                    get().removeOrder(addressId, orderId);
                    await get().fetchOrders(addressId, 1, 50);
                }
            },

            extendTime: async (addressId, orderId, additionalMinutes) => {
                const success = await mockDashboardService.updateOrderStatus(orderId, 'TIME_EXTENDED_BY_RESTRO', additionalMinutes);
                if (success) {
                    const orders = get().recentOrders[addressId] || [];
                    const currentOrder = orders.find(o => o.id === orderId);
                    if (currentOrder) {
                        get().updateOrder(orderId, {
                            status: 'TIME_EXTENDED_BY_RESTRO',
                            prepTime: (currentOrder.prepTime || 0) + additionalMinutes
                        });
                    }
                    await get().fetchOrders(addressId, 1, 50);
                }
            },
        }),
        {
            name: 'order-storage',
        }
    )
);
