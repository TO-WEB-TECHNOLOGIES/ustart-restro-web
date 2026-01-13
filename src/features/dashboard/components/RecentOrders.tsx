import { useRecentOrders } from '../hooks/useDashboardData';

export const RecentOrders = () => {
    const { orders, isLoading } = useRecentOrders();
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-700';
            case 'Cooking': return 'bg-blue-100 text-blue-700';
            case 'Ready': return 'bg-emerald-100 text-emerald-700';
            case 'Completed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Recent Incoming Orders</h3>
                <button className="text-sm font-semibold text-secondary-orange hover:text-orange-700 transition-colors">
                    View All
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            [1, 2, 3].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-24"></div></td>
                                </tr>
                            ))
                        ) : (
                            Array.isArray(orders) && orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        {order.customerName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {order.items}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        ₹{order.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && orders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No recent orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
