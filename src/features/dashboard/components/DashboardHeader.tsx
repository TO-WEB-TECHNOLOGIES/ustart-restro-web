import { Button } from '@/components/ui/button';
import { Bell, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AddressSelector } from './AddressSelector';

interface DashboardHeaderProps {
    user: { name?: string | null };
}

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
    const location = useLocation();

    // Dynamic Title Logic
    const getPageTitle = (pathname: string) => {
        if (pathname.includes('/menu')) return 'Menu Management';
        if (pathname.includes('/orders')) return 'Orders Overview';
        if (pathname.includes('/reports')) return 'Analytics & Reports';
        if (pathname.includes('/settings')) return 'Settings';
        return 'Dashboard Overview';
    };

    const title = getPageTitle(location.pathname);

    return (
        <header className="h-20 bg-white border-b border-slate-100 sticky top-0 z-30 px-6 md:px-8 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    Good morning, <span className="font-semibold text-slate-700">{user.name || 'Partner'}</span>. Here's what's happening today.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex gap-3">
                    <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium h-10">
                        Manage Menu
                    </Button>
                    <Button className="bg-secondary-orange hover:bg-secondary-orange/90 text-white font-bold gap-2 h-10 px-5 shadow-sm shadow-orange-100">
                        <Plus className="w-4 h-4" />
                        Create Offer
                    </Button>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

                <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </button>

                {/* Replaced User Icon with Address Selector as requested */}
                <AddressSelector />
            </div>
        </header>
    );
};
