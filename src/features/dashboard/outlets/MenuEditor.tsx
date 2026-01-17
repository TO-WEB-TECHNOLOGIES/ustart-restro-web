import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuTabs } from '../components/MenuEditor/MenuTabs';
import { CategorySidebar } from '../components/MenuEditor/CategorySidebar';
import { MenuItemList } from '../components/MenuEditor/MenuItemList';
import { useMenu } from '../hooks/useMenu';
import { Loader2, PanelLeftOpen, PanelLeftClose, Menu } from 'lucide-react';

/**
 * MenuEditor component provides the interface for managing a restaurant's menu.
 */
export const MenuEditor = () => {
    const { t } = useTranslation();
    const { fetchCategories, isCategoriesLoading, categories } = useMenu();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    /**
     * Fetch menu categories on component mount.
     */
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    if (isCategoriesLoading && categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-blue)] mb-4" />
                <p className="text-slate-500 font-bold">{t('common.loading') || 'Loading your menu...'}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Mobile Sidebar Toggle - Only visible on small screens */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className={`md:hidden fixed bottom-6 right-6 z-50 p-4 bg-[var(--color-primary-blue)] text-white rounded-full shadow-lg transition-transform active:scale-90 ${isSidebarOpen ? 'scale-0' : 'scale-100'}`}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Top Navigation and Submit Actions */}
            <MenuTabs />

            <div className="flex flex-1 overflow-hidden relative">
                {/* 
                    Category Sidebar 
                    - Desktop: Collapsible side panel
                    - Mobile: Full-screen overlay or slide-in
                */}
                <div
                    className={`
                        fixed md:relative inset-y-0 left-0 z-40 md:z-auto
                        transition-all duration-300 ease-in-out transform
                        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-0'}
                        bg-white dark:bg-slate-900 shadow-xl md:shadow-none
                    `}
                >
                    <CategorySidebar
                        onClose={() => setIsSidebarOpen(false)}
                        isCollapsed={!isSidebarOpen}
                    />

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm text-slate-400 hover:text-[var(--color-primary-blue)] transition-colors"
                    >
                        {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                </div>

                {/* Mobile Overlay Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* List display area for items with contextual search/actions */}
                <div className="flex-1 flex flex-col min-w-0">
                    <MenuItemList onOpenSidebar={() => setIsSidebarOpen(true)} />
                </div>
            </div>
        </div>
    );
};
