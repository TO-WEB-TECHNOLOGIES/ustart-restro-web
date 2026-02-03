import { Button } from '@/components/ui/button';
import { Bell, Plus, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AddressSelector } from './AddressSelector';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useState, useRef, useEffect } from 'react';

import { OutletStatus } from './OutletStatus';

interface DashboardHeaderProps {
    user: { name?: string | null };
    onMenuClick?: () => void;
}

export const DashboardHeader = ({ user, onMenuClick }: DashboardHeaderProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isDashboardHome = location.pathname === '/dashboard';
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Dynamic Title Logic with I18n
    const getPageTitle = (pathname: string) => {
        if (pathname.includes('/menu')) return t('common.titles.menu');
        if (pathname.includes('/orders')) return t('common.titles.orders');
        if (pathname.includes('/reports')) return t('common.titles.reports');
        if (pathname.includes('/settings')) return t('common.titles.settings');
        return t('common.titles.overview');
    };

    const title = getPageTitle(location.pathname);

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('common.greeting.morning');
        if (hour < 18) return t('common.greeting.afternoon');
        return t('common.greeting.evening');
    };

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Trigger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={onMenuClick}
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 hidden md:block">
                        {getGreeting()}, <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name || 'Partner'}</span>. {t('common.header.happening')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden lg:flex gap-3">
                    {isDashboardHome ? (
                        <>
                            <Button
                                variant="outline"
                                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium h-10 dark:hover:text-white"
                                onClick={() => navigate('/dashboard/menu/edit')}
                            >
                                {t('common.header.manageMenu')}
                            </Button>
                            <Button
                                className="bg-secondary-orange hover:bg-secondary-orange/90 dark:bg-brown dark:hover:bg-brown/90 text-white font-bold gap-2 h-10 px-5 shadow-sm shadow-orange-100 dark:shadow-none"
                            >
                                <Plus className="w-4 h-4" />
                                {t('common.header.createOffer')}
                            </Button>
                        </>
                    ) : (
                        <OutletStatus compact />
                    )}
                </div>


                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />

                <ThemeSelector />

                <div className="relative" ref={notificationRef}>
                    <button
                        className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" />
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-4 px-4 z-50 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t('common.header.notifications', 'Notifications')}</h3>
                            <div className="py-8 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3 text-slate-300 dark:text-slate-500">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No new notifications</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">We'll let you know when something happens.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Address Selector - Responsive Width handled inside component */}
                <AddressSelector />
            </div>
        </header>
    );
};

