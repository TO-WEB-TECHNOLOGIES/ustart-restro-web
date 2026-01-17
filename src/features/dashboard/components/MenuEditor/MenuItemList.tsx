import { Plus } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { MenuItemCard } from './MenuItemCard';

/**
 * Component that renders the list of menu items for the currently selected category.
 * Includes a header with the category name and an "Add New Item" action.
 */
export const MenuItemList = () => {
    const { selectedCategory } = useMenu();

    // Do not render anything if no category is selected
    if (!selectedCategory) return null;

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd] dark:bg-slate-950">
            <div className="max-w-4xl">
                {/* Header section with Category Name and Add Item action */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedCategory.name} ({selectedCategory.itemCount})
                    </h2>
                    <button className="flex items-center gap-2 text-[var(--color-primary-blue)] text-sm font-black px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors">
                        <Plus className="w-5 h-5" />
                        Add New Item
                    </button>
                </div>

                {/* Vertical grid of menu item cards */}
                <div className="grid grid-cols-1 gap-4">
                    {selectedCategory.items.map(item => (
                        <MenuItemCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
};
