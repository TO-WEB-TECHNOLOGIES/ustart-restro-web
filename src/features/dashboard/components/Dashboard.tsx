import { OutletStatus } from './OutletStatus';
import { StatsCards } from './StatsCards';
import { RecentOrders } from './RecentOrders';
import { BoostWidget, HelpWidget } from './DashboardWidgets';
import { useOutletStatus, useStats, useRecentOrders } from '../hooks/useDashboardData';

export const Dashboard = () => {
    // Context & Hooks
    const { status: outletStatus, toggleStatus } = useOutletStatus();
    const { stats, isLoading: statsLoading } = useStats();
    const { orders, isLoading: ordersLoading } = useRecentOrders();

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Outlet Status Bar */}
            <OutletStatus
                isOpen={outletStatus.isOpen}
                message={outletStatus.message}
                onToggle={toggleStatus}
            />

            {/* Stats Grid */}
            <StatsCards stats={stats} isLoading={statsLoading} />

            {/* Main Content Split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Recent Orders (Takes up 2/3 on large screens) */}
                <div className="xl:col-span-2 space-y-8">
                    <RecentOrders orders={orders} isLoading={ordersLoading} />
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6">
                    <BoostWidget />
                    <HelpWidget />
                </div>
            </div>
        </div>
    );
};
