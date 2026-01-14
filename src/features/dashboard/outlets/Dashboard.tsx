import { OutletStatus } from '../components/OutletStatus';
import { StatsCards } from '../components/StatsCards';
import { RecentOrders } from '../components/RecentOrders';
import { BoostWidget, HelpWidget } from '../components/DashboardWidgets';
export const Dashboard = () => {

    return (
        <div className="space-y-8 max-w-screen mx-auto">
            {/* Outlet Status Bar */}
            <OutletStatus />

            {/* Stats Grid */}
            <StatsCards />

            {/* Main Content Split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Recent Orders (Takes up 2/3 on large screens) */}
                <div className="xl:col-span-2 space-y-8">
                    <RecentOrders />
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
