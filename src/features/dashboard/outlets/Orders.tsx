import { RecentOrders } from '../components/RecentOrders';
import { OutletStatus } from '../components/OutletStatus';

export const Orders = () => {
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Outlet Status Bar to keep state visible */}
            <OutletStatus />

            <div className="min-h-[600px]">
                <RecentOrders />
            </div>
        </div>
    );
};
