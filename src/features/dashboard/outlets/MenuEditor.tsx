import { MenuTabs } from '../components/MenuEditor/MenuTabs';
import { MenuActions } from '../components/MenuEditor/MenuActions';
import { CategorySidebar } from '../components/MenuEditor/CategorySidebar';
import { MenuItemList } from '../components/MenuEditor/MenuItemList';

export const MenuEditor = () => {
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation Tabs */}
            <MenuTabs />

            {/* Actions Bar */}
            <MenuActions />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Categories */}
                <CategorySidebar />

                {/* Main Content: Items */}
                <MenuItemList />
            </div>
        </div>
    );
};
