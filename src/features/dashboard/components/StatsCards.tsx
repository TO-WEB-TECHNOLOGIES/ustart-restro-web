import { TrendingUp, GripHorizontal, ShoppingBag, Receipt, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { type StatMetric } from '../hooks/useDashboardData';

interface StatsCardsProps {
    stats: StatMetric[];
    isLoading: boolean;
}

export const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
                ))}
            </div>
        );
    }

    const getIcon = (id: string) => {
        switch (id) {
            case 'revenue': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            case 'orders': return <ShoppingBag className="w-4 h-4 text-orange-500" />;
            case 'ticket': return <Receipt className="w-4 h-4 text-blue-500" />;
            case 'rating': return <Star className="w-4 h-4 text-amber-500" />;
            default: return <GripHorizontal className="w-4 h-4" />;
        }
    };

    const getIconBg = (id: string) => {
        switch (id) {
            case 'revenue': return 'bg-emerald-50';
            case 'orders': return 'bg-orange-50';
            case 'ticket': return 'bg-blue-50';
            case 'rating': return 'bg-amber-50';
            default: return 'bg-slate-50';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.isArray(stats) && stats.map((stat) => (
                <div key={stat.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
                        <div className={`p-2 rounded-lg ${getIconBg(stat.id)}`}>
                            {getIcon(stat.id)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>

                        {stat.change !== undefined && (
                            <div className="flex items-center gap-1 text-sm">
                                {stat.trend === 'up' ? (
                                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                ) : stat.trend === 'down' ? (
                                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                                ) : null}

                                <span className={`font-semibold ${stat.trend === 'up' ? 'text-emerald-600' :
                                    stat.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                                    }`}>
                                    {stat.change}%
                                </span>
                                <span className="text-slate-400">vs yesterday</span>
                            </div>
                        )}

                        {stat.id === 'rating' && (
                            <p className="text-xs text-slate-400 mt-1">Based on recent reviews</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
