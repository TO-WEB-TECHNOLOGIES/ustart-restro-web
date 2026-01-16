import type { Order } from '../../../types/dashboardTypes';
import { MOCK_ORDERS, delay } from './data/mockData';

export const ordersApi = {
    getRecentOrders: async (addressId: string, page: number = 1, limit: number = 5): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
        await delay(600);
        console.log(`Fetching orders for address: ${addressId}, Page: ${page}`);

        let filteredOrders: Order[] = [];
        if (addressId === 'all') {
            filteredOrders = [...MOCK_ORDERS];
        } else {
            filteredOrders = MOCK_ORDERS.filter(o => o.restroId === addressId);
        }

        // Sort: Pending orders first, then by date descending
        filteredOrders.sort((a, b) => {
            const isAPending = a.status === 'ORDER_CREATED_BY_CUSTOMER';
            const isBPending = b.status === 'ORDER_CREATED_BY_CUSTOMER';

            if (isAPending && !isBPending) return -1;
            if (!isAPending && isBPending) return 1;

            // Secondary sort by newest first
            return b.createdAt - a.createdAt;
        });

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filteredOrders.slice(start, end);

        return {
            orders: paginated,
            total: filteredOrders.length,
            totalPages: Math.ceil(filteredOrders.length / limit)
        };
    },

    updateOrderStatus: async (orderId: string, status: Order['status'], prepTime?: number, giftMessage?: string, _rejectionReason?: string): Promise<boolean> => {
        await delay(400);
        console.log(`[API] Updating order ${orderId} to ${status}`);

        // Define statuses that should cause the order to be removed
        const removalStatuses: Order['status'][] = [
            'ORDER_REJECTED_BY_RESTRO',
            'CANCELLED_BY_RESTRO',
            'CANCELLED_BY_CUSTOMER',
            'CANCELLED_BY_USTART',
            'ORDER_PICKED',
            'DELIVERED'
        ];

        let orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            if (removalStatuses.includes(status)) {
                // Remove all instances of this order ID just in case
                while (orderIndex !== -1) {
                    MOCK_ORDERS.splice(orderIndex, 1);
                    orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
                }
                console.log(`[API] Order ${orderId} removed from MOCK_ORDERS`);
            } else {
                MOCK_ORDERS[orderIndex].status = status;
                if (!MOCK_ORDERS[orderIndex].logs) {
                    MOCK_ORDERS[orderIndex].logs = [];
                }
                MOCK_ORDERS[orderIndex].logs?.push({ status, timestamp: Date.now() });

                if (status === 'TIME_EXTENDED_BY_RESTRO') {
                    MOCK_ORDERS[orderIndex].prepTime = (MOCK_ORDERS[orderIndex].prepTime || 0) + (prepTime || 0);
                } else if (prepTime !== undefined) {
                    MOCK_ORDERS[orderIndex].prepTime = prepTime;
                }
                if (giftMessage !== undefined) {
                    MOCK_ORDERS[orderIndex].giftMessage = giftMessage;
                }
            }
            return true;
        }
        console.warn(`[API] Order ${orderId} not found for update`);
        return false;
    },

    rejectOrder: async (orderId: string, reason: string): Promise<boolean> => {
        return ordersApi.updateOrderStatus(orderId, 'ORDER_REJECTED_BY_RESTRO', undefined, undefined, reason);
    }
};
