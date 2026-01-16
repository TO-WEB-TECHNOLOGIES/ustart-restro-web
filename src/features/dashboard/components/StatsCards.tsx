import { TrendingUp, GripHorizontal, ShoppingBag, Receipt, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useStats } from '../hooks/useDashboardData';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';

export const StatsCards = () => {
    const { t } = useTranslation();
    const { stats, isLoading } = useStats();
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);

    const placeholderStats = [
        { id: 'revenue', value: '' },
        { id: 'orders', value: '' },
        { id: 'ticket', value: '' },
        { id: 'rating', value: '' }
    ];

    const displayStats = stats.length > 0 ? stats : placeholderStats;

    const getIcon = (id: string) => {
        switch (id) {
            case 'revenue': return <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
            case 'orders': return <ShoppingBag className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
            case 'ticket': return <Receipt className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
            case 'rating': return <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
            default: return <GripHorizontal className="w-4 h-4 dark:text-slate-400" />;
        }
    };

    const getIconBg = (id: string) => {
        switch (id) {
            case 'revenue': return 'bg-emerald-50 dark:bg-emerald-500/10';
            case 'orders': return 'bg-orange-50 dark:bg-orange-500/10';
            case 'ticket': return 'bg-blue-50 dark:bg-blue-500/10';
            case 'rating': return 'bg-amber-50 dark:bg-amber-500/10';
            default: return 'bg-slate-50 dark:bg-slate-800';
        }
    };

    const getLabel = (id: string) => {
        const isAll = selectedAddressId === ALL_LOCATIONS_ID;
        switch (id) {
            case 'revenue': return t(isAll ? 'dashboard.stats.totalRevenue' : 'dashboard.stats.revenue');
            case 'orders': return t(isAll ? 'dashboard.stats.totalOrders' : 'dashboard.stats.orders');
            case 'ticket': return t('dashboard.stats.ticket');
            case 'rating': return t(isAll ? 'dashboard.stats.avgRating' : 'dashboard.stats.rating');
            default: return '';
        }
    };

    return (
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none pb-4 md:pb-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 no-scrollbar">
            {displayStats.map((stat) => (
                <div key={stat.id} className="min-w-[85%] md:min-w-0 snap-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-none transition-all flex-shrink-0 md:flex-shrink">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{getLabel(stat.id)}</span>
                        <div className={`p-2 rounded-lg ${getIconBg(stat.id)}`}>
                            {getIcon(stat.id)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                        ) : (
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                        )}


                        {stat.id === 'rating' && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('dashboard.stats.basedOnReviews')}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
