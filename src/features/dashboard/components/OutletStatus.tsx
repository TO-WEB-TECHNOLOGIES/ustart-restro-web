import { Switch } from '../../../components/ui/switch';
import { Wifi, WifiOff } from 'lucide-react';
import { useOutletStatus } from '../hooks/useDashboardData';
import { useTranslation } from 'react-i18next';
import { useRestaurantStore, ALL_LOCATIONS_ID } from '../store/useRestaurantStore';

import { Loader } from '@/components/ui/loader';

export const OutletStatus = () => {
    const { status, toggleStatus, isLoading } = useOutletStatus();
    const { t } = useTranslation();
    const { isOpen, openCount, closedCount } = status;
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);

    // We consider it aggregate if 'all' is selected OR if we already have counts
    const isAggregateSelected = selectedAddressId === ALL_LOCATIONS_ID;
    const hasCounts = openCount !== undefined && closedCount !== undefined;
    const isAggregate = isAggregateSelected || hasCounts;

    if (isLoading && !isAggregate) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden min-h-[120px] flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (isAggregate) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Wifi className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                {t('dashboard.statusOverview', 'Outlet Status Overview')}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                {t('dashboard.summaryAll', 'Summary across all locations')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50 min-w-[120px] justify-center">
                            {isLoading && !hasCounts ? (
                                <div className="w-16 h-6 bg-emerald-200/50 dark:bg-emerald-800/50 animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                        {t('dashboard.openCount', { count: openCount || 0 })}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-900/50 min-w-[120px] justify-center">
                            {isLoading && !hasCounts ? (
                                <div className="w-16 h-6 bg-rose-200/50 dark:bg-rose-800/50 animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span className="text-lg font-bold text-rose-700 dark:text-rose-400">
                                        {t('dashboard.closedCount', { count: closedCount || 0 })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* Subtle progress bar if updating while we already have data */}
                {isLoading && hasCounts && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                        <div className="h-full bg-secondary-orange animate-progress" style={{ width: '100%' }} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`
            relative overflow-hidden rounded-2xl p-6 border transition-all duration-300
            ${isOpen
                ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/50 shadow-emerald-100/50 dark:shadow-none'
                : 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/50 shadow-rose-100/50 dark:shadow-none'}
            shadow-lg
        `}>
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Icon Circle */}
                    <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300
                        ${isOpen
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}
                    `}>
                        {isOpen ? <Wifi className="w-7 h-7" /> : <WifiOff className="w-7 h-7" />}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {t('dashboard.outletStatus', 'Outlet Status')}
                        </h3>
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                                {isOpen && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                                {isOpen
                                    ? t('dashboard.statusOpen', 'You are currently OPEN for orders')
                                    : t('dashboard.statusClosed', 'You are currently CLOSED for orders')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
                    <span className={`text-xl font-semibold transition-colors ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {t('dashboard.acceptingOrders', 'Accepting Orders')}
                    </span>
                    <Switch
                        checked={isOpen}
                        onCheckedChange={toggleStatus}
                        disabled={isLoading}
                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
                    />
                </div>
            </div>
            {/* Subtle progress bar if loading individual status */}
            {isLoading && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-secondary-orange animate-progress" style={{ width: '100%' }} />
                </div>
            )}
        </div>
    );
};
