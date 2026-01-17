import { useEffect } from 'react';
import { MenuTabs } from '../components/MenuEditor/MenuTabs';
import { MenuActions } from '../components/MenuEditor/MenuActions';
import { CategorySidebar } from '../components/MenuEditor/CategorySidebar';
import { MenuItemList } from '../components/MenuEditor/MenuItemList';
import { useMenu } from '../hooks/useMenu';
import { Loader2 } from 'lucide-react';

/**
 * MenuEditor component provides the interface for managing a restaurant's menu.
 * It is structured into multiple sub-components for better maintainability:
 * - MenuTabs: Navigation between different menu management aspects.
 * - MenuActions: Search, filter, and overall action buttons.
 * - CategorySidebar: Sidebar to switch between menu categories.
 * - MenuItemList: Main area for viewing and managing items within the selected category.
 */
export const MenuEditor = () => {
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
                <p className="text-slate-500 font-bold">Loading your menu...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Navigation tabs for different editor sections (Edit, Stock, Taxes, Charges) */}
            <MenuTabs />

            {/* Global actions like search, filters, and submitting changes */}
            <MenuActions />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar containing all menu categories for selection */}
                <CategorySidebar />

                {/* List display area for items belonging to the selected category */}
                <MenuItemList />
            </div>
        </div>
    );
};
