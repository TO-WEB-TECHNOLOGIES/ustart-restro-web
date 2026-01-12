import type { ReactNode } from 'react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { useAuth } from '@/context/AuthContext';

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-orange-50/30 md:flex">
            {/* Desktop Sidebar */}
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-h-screen">
                {/* Fixed/Sticky Header */}
                <DashboardHeader user={user || { name: 'Partner' }} />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 ease-in-out">
                    {children}
                </main>
            </div>
        </div>
    );
};
