import type { Order } from '../../../types/dashboardTypes';
import { MOCK_ORDERS, delay } from './data/mockData';

export const ordersApi = {
    getRecentOrders: async (addressId: string, page: number = 1, limit: number = 5): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
        await delay(600);
        console.log(`Fetching orders for address: ${addressId}, Page: ${page}`);

        let filteredOrders: Order[] = [];
        if (addressId === 'all') {
            filteredOrders = MOCK_ORDERS;
        } else {
            filteredOrders = MOCK_ORDERS.filter(o => o.restroId === addressId);
        }

        const start = (page - 1) * limit;
        const end = start + limit;
        const paginated = filteredOrders.slice(start, end);

        return {
            orders: paginated,
            total: filteredOrders.length,
            totalPages: Math.ceil(filteredOrders.length / limit)
        };
    },

    updateOrderStatus: async (orderId: string, status: Order['status'], prepTime?: number, giftMessage?: string, rejectionReason?: string): Promise<boolean> => {
        await delay(400);
        console.log(`Updating order ${orderId} to ${status}. PrepTime: ${prepTime}, GiftMessage: ${giftMessage}, Reason: ${rejectionReason}`);

        // In a real app, this would update the backend.
        const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            if (status === 'ORDER_REJECTED_BY_RESTRO') {
                // Remove the order from the mock list entirely on rejection
                MOCK_ORDERS.splice(orderIndex, 1);
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
        return false;
    }
};
