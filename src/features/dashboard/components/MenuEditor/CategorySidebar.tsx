import { Plus, MoreVertical, ChevronDown, ArrowRight } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';

/**
 * Sidebar component for the Menu Editor.
 * Displays a list of all menu categories and allows the user to select one.
 * Shows expanded details (subcategories, counts) for the currently active category.
 */
export const CategorySidebar = () => {
    const { categories, selectedCategoryId, setSelectedCategoryId } = useMenu();

    return (
        <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
            {/* Header section with total category count and "Add Category" action */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">
                    Categories ({categories.length})
                </h3>
                <button className="w-full flex items-center gap-2 text-[var(--color-primary-blue)] text-sm font-bold py-2 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors">
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {/* Scrollable list of categories */}
            <div className="flex-1 py-2">
                {categories.map(cat => (
                    <div key={cat.id}>
                        {/* Individual Category Item */}
                        <div
                            className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${selectedCategoryId === cat.id
                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-[var(--color-primary-blue)]'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                                }`}
                            onClick={() => setSelectedCategoryId(cat.id)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`text-sm font-bold truncate ${selectedCategoryId === cat.id ? 'text-[var(--color-primary-blue)] dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {cat.name} ({cat.itemCount})
                                </span>
                            </div>
                            {/* Hover actions for category management */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                                    <MoreVertical className="w-4 h-4 text-slate-400" />
                                </button>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${selectedCategoryId === cat.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {/* Expanded view for the selected category (shows subcategories) */}
                        {selectedCategoryId === cat.id && (
                            <div className="bg-slate-50/50 dark:bg-slate-800/30 py-2 pl-6 space-y-1">
                                <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-l-xl border-l-4 border-[var(--color-primary-blue)] text-sm font-bold text-[var(--color-primary-blue)] dark:text-white shadow-sm mr-2">
                                    {cat.name} ({cat.itemCount})
                                </div>
                                <button className="w-full flex items-center gap-2 text-[var(--color-primary-blue)] text-xs font-bold py-2 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors">
                                    <Plus className="w-4 h-4" />
                                    Add Subcategory
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer action to navigate to Add-ons section */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button className="w-full flex items-center justify-between text-[var(--color-primary-blue)] text-sm font-black py-4 px-2 hover:translate-x-1 transition-transform">
                    Go to Add Ons
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
