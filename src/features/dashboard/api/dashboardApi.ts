import type { StatMetric } from '../../../types/dashboardTypes';
import { MOCK_STATS, delay } from './data/mockData';

export const dashboardApi = {
    getStats: async (addressId: string): Promise<StatMetric[]> => {
        await delay(500);
        console.log(`Fetching stats for address: ${addressId}`);

        if (addressId === 'all') {
            let totalRevenue = 0;
            let totalOrders = 0;

            Object.values(MOCK_STATS).forEach(stats => {
                const rev = parseFloat(stats.find(s => s.id === 'revenue')?.value.replace(/[^0-9.]/g, '') || '0');
                const ord = parseInt(stats.find(s => s.id === 'orders')?.value || '0');
                totalRevenue += rev;
                totalOrders += ord;
            });

            const formatter = new Intl.NumberFormat('en-IN');
            const currencyFormatter = new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            return [
                { id: 'revenue', label: "Total Revenue", value: `₹${currencyFormatter.format(totalRevenue)}`, highlight: true },
                { id: 'orders', label: "Total Orders", value: formatter.format(totalOrders) },
                { id: 'ticket', label: "Avg Ticket Size", value: `₹245.00` },
                { id: 'rating', label: "Avg Rating", value: '4.5' }
            ];
        }

        return MOCK_STATS[addressId] || MOCK_STATS['addr_123'];
    },

    // 2026-11-12: getOutletStatus / updateOutletStatus (mock) removed - see api/outletStatusApi.ts.
};
