import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type OrderTab = 'New' | 'Preparing' | 'Ready' | 'Completed';

interface OrdersTabsProps {
    activeTab: OrderTab;
    onTabChange: (tab: OrderTab) => void;
    counts: Record<OrderTab, number>;
    onRushHourClick?: () => void;
}

export const OrdersTabs = ({ activeTab, onTabChange, counts, onRushHourClick }: OrdersTabsProps) => {
    const { t } = useTranslation();
    const tabs: { id: OrderTab; label: string; key: string }[] = [
        { id: 'New', label: 'New Orders', key: 'new' },
        { id: 'Preparing', label: 'Preparing', key: 'preparing' },
        { id: 'Ready', label: 'Ready for Pickup', key: 'ready' },
        { id: 'Completed', label: 'Completed', key: 'completed' },
    ];

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            {/* Tabs List using ShadCN */}
            <Tabs
                value={activeTab}
                onValueChange={(value) => onTabChange(value as OrderTab)}
                className="w-full lg:w-auto"
            >
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 h-auto flex flex-wrap lg:flex-nowrap gap-1 rounded-full border border-slate-200 dark:border-slate-700">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="rounded-full px-6 py-2.5 font-bold text-sm transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                        >
                            {t(`dashboard.orders.tabs.${tab.key}`, tab.label)}
                            {counts[tab.id] > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs transition-colors ${activeTab === tab.id
                                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }`}>
                                    {counts[tab.id]}
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onRushHourClick}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <Flame className="w-4 h-4 fill-white animate-pulse" />
                    {t('dashboard.orders.actions.rushHour', 'ACTIVATE RUSH HOUR')}
                </button>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 ">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                    </span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {t('dashboard.orders.actions.liveUpdates', 'LIVE UPDATES ON')}
                    </span>
                </div>
            </div>
        </div>
    );
};
