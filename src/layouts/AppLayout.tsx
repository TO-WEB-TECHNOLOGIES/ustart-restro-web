import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/features/dashboard/layouts/DashboardLayout';

export const AppLayout = () => {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
};
