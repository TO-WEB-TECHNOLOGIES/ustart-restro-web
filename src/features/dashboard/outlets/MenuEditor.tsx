import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuTabs } from '../components/MenuEditor/MenuTabs';
import { CategorySidebar } from '../components/MenuEditor/CategorySidebar';
import { MenuItemList } from '../components/MenuEditor/MenuItemList';
import { useMenu } from '../hooks/useMenu';
import { Loader2 } from 'lucide-react';

/**
 * MenuEditor component provides the interface for managing a restaurant's menu.
 * It is structured into multiple sub-components for better maintainability:
 * - MenuTabs: Navigation and primary global actions (Submit Changes).
 * - CategorySidebar: Sidebar to switch between menu categories.
 * - MenuItemList: Main area with contextual search/filters and item management.
 */
export const MenuEditor = () => {
    const { t } = useTranslation();
    const { fetchCategories, isCategoriesLoading, categories } = useMenu();

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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation and Submit Actions */}
            <MenuTabs />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar containing all menu categories for selection */}
                <CategorySidebar />

                {/* List display area for items with contextual search/actions */}
                <MenuItemList />
            </div>
        </div>
    );
};
