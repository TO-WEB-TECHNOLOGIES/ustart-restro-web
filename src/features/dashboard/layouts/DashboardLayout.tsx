import { useAuth } from '@/context/AuthContext';
import { useRestaurantDetails } from '../hooks/useDashboardData';
import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { LogoutConfirmationModal } from '@/components/ui/logout-confirmation-modal';
import { useOrderService } from '../hooks/useOrderService';

export const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Initial Data Fetch & Background Services
    useRestaurantDetails();
    useOrderService();

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowLogoutConfirm(false);
    };

    return (
        <div className="min-h-screen bg-orange-50/30 dark:bg-slate-950 md:flex transition-colors duration-300 relative w-screen overflow-hidden sm:max-h-screen">
            {/* Desktop & Mobile Sidebar */}
            <DashboardSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onLogoutClick={() => setShowLogoutConfirm(true)}
            />

            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* Fixed/Sticky Header */}
                <DashboardHeader
                    user={user || { name: 'Partner' }}
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                {/* Main Content */}
                <main className="flex-1 w-full overflow-x-hidden overflow-y-auto transition-all duration-300 ease-in-out flex flex-col">
                    <Outlet />
                </main>
            </div>

            <LogoutConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
};
