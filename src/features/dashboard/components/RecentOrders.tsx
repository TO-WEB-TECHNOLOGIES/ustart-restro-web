import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRecentOrders } from '../hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';

export const RecentOrders = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { orders, isLoading, currentPage, totalPages, goToPage } = useRecentOrders();
    const getStatusColor = (status: string) => {
        if (['PENDING', 'APPROVED_PAYMENT_PENDING', 'ORDER_CREATED_BY_CUSTOMER'].includes(status)) {
            return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
        }
        if (['ORDER_APPROVED_BY_RESTRO', 'DELIVERY_PARTNER_ASSIGNED', 'TIME_EXTENDED_BY_RESTRO'].includes(status)) {
            return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
        }
        if (['ORDER_READY_BY_RESTRO', 'DELIVERY_PARTNER_AT_RESTRO'].includes(status)) {
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
        }
        if (['ORDER_PICKED', 'DELIVERY_PARTNER_AT_STATION', 'DELIVERED'].includes(status)) {
            return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
        }
        if (['CUSTOMER_NOT_RESPONDING', 'UNDELIVERABLE_BY_DELIVER_PARTNER', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_RESTRO', 'CANCELLED_BY_USTART', 'ORDER_REJECTED_BY_RESTRO'].includes(status)) {
            return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
        }
        return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
    };

    const getStatusLabel = (status: string) => {
        // Map granular statuses to user-friendly labels
        if (['PENDING', 'APPROVED_PAYMENT_PENDING', 'ORDER_CREATED_BY_CUSTOMER'].includes(status)) {
            return t('dashboard.recentOrders.statuses.pending');
        }
        if (['ORDER_APPROVED_BY_RESTRO', 'DELIVERY_PARTNER_ASSIGNED', 'TIME_EXTENDED_BY_RESTRO'].includes(status)) {
            return t('dashboard.recentOrders.statuses.cooking');
        }
        if (['ORDER_READY_BY_RESTRO', 'DELIVERY_PARTNER_AT_RESTRO'].includes(status)) {
            return t('dashboard.recentOrders.statuses.ready');
        }
        if (['ORDER_PICKED', 'DELIVERY_PARTNER_AT_STATION', 'DELIVERED'].includes(status)) {
            return t('dashboard.recentOrders.statuses.completed');
        }
        if (['CUSTOMER_NOT_RESPONDING', 'UNDELIVERABLE_BY_DELIVER_PARTNER', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_RESTRO', 'CANCELLED_BY_USTART', 'ORDER_REJECTED_BY_RESTRO'].includes(status)) {
            return 'Rejected/Cancelled';
        }
        return status.replace(/_/g, ' ');
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t('dashboard.recentOrders.title')}</h3>
                <button className="text-sm font-semibold text-secondary-orange dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors" onClick={() => navigate('/dashboard/orders')}>
                    {t('dashboard.recentOrders.viewAll')}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4">{t('dashboard.recentOrders.table.id')}</th>
                            <th className="px-6 py-4">{t('dashboard.recentOrders.table.customer')}</th>
                            <th className="px-6 py-4">{t('dashboard.recentOrders.table.items')}</th>
                            <th className="px-6 py-4">{t('dashboard.recentOrders.table.amount')}</th>
                            <th className="px-6 py-4">{t('dashboard.recentOrders.table.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-24"></div></td>
                                </tr>
                            ))
                        ) : (
                            Array.isArray(orders) && orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                                        {order.customer.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-500">
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        ₹{order.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!isLoading && orders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">
                                    {t('dashboard.recentOrders.noOrders')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {!isLoading && orders.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('dashboard.recentOrders.pageOf', { current: currentPage, total: totalPages })}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 dark:text-slate-300" />
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 dark:text-slate-300" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
