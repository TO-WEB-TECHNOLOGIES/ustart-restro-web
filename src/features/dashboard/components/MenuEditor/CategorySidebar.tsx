import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, ChevronDown, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../hooks/useMenu';
import { useMenuData } from '../../hooks/useMenuData';
import { type Category } from '../../../../types/menuTypes';

/**
 * Sidebar component for the Menu Editor.
 * Displays a list of all menu categories and allows the user to select one.
 * Shows expanded details (subcategories, counts) for the currently active category.
 * Integrates Menu Health score from MenuScore page.
 */
export const CategorySidebar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { categories, selectedCategoryId, setSelectedCategoryId } = useMenu();
    const { score, status } = useMenuData();
    const [categorySearch, setCategorySearch] = useState('');

    /**
     * Filters categories recursively based on name.
     */
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categories;

        const filterRecursive = (list: Category[]): Category[] => {
            return list.reduce((acc: Category[], cat) => {
                const matches = cat.name.toLowerCase().includes(categorySearch.toLowerCase());
                const filteredSubs = cat.subCategories ? filterRecursive(cat.subCategories) : [];

                if (matches || filteredSubs.length > 0) {
                    acc.push({
                        ...cat,
                        subCategories: filteredSubs
                    });
                }
                return acc;
            }, []);
        };

        return filterRecursive(categories);
    }, [categories, categorySearch]);

    /**
     * Determines if a category or any of its subcategories is currently selected.
     */
    const isNodeOrChildSelected = (cat: Category): boolean => {
        if (selectedCategoryId === cat.id) return true;
        if (cat.subCategories) {
            return cat.subCategories.some(sub => isNodeOrChildSelected(sub));
        }
        return false;
    };

    /**
     * Recursive function to render a category and its subcategories.
     */
    const renderCategory = (cat: Category, depth = 0) => {
        const isSelected = selectedCategoryId === cat.id;
        const isExpanded = isNodeOrChildSelected(cat);
        const hasSubCategories = cat.subCategories && cat.subCategories.length > 0;

        return (
            <div key={cat.id}>
                {/* Individual Category/Subcategory Item */}
                <div
                    className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-600/20 border-l-4 border-[var(--color-primary-blue)]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                        }`}
                    style={{ paddingLeft: `${(depth * 1) + 1}rem` }}
                    onClick={() => setSelectedCategoryId(cat.id)}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-[var(--color-primary-blue)] dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {cat.name} ({cat.itemCount})
                        </span>
                    </div>
                    {/* Hover actions for category management */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        {hasSubCategories && (
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded && !isSelected ? 'rotate-180' : isSelected ? 'rotate-180' : ''}`} />
                        )}
                    </div>
                </div>

                {/* Render subcategories if selected or if a child is selected */}
                {isExpanded && hasSubCategories && (
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 py-1">
                        {cat.subCategories?.map(sub => renderCategory(sub, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
            {/* Menu Health Score Indicator (Synced with MenuScore page) */}
            <div
                onClick={() => navigate('/dashboard/menu')}
                className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--color-terracotta-green)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{t('dashboard.menuEditor.menuHealth')}</span>
                    </div>
                    <span className="text-xs font-black text-[var(--color-terracotta-green)]">{score}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[var(--color-terracotta-green)] transition-all duration-1000"
                        style={{ width: `${score}%` }}
                    />
                </div>
                <p className="text-[10px] mt-2 font-bold text-slate-500 uppercase">{t('dashboard.menuEditor.statusLabel')}: <span className="text-[var(--color-primary-blue)] dark:text-white">{status}</span></p>
            </div>

            {/* Header section with total category count and "Add Category" action */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {t('dashboard.menuEditor.categories')} ({categories.length})
                </h3>
                <button className="flex items-center gap-1.5 text-[var(--color-primary-blue)] dark:text-blue-400 text-[10px] font-black uppercase tracking-wider py-1.5 px-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800 shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                    {t('dashboard.menuEditor.addCategory')}
                </button>
            </div>

            {/* Category Search Box */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('dashboard.menuEditor.searchCategories')}
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[var(--color-primary-blue)] transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Scrollable list of categories and subcategories */}
            <div className="flex-1 overflow-y-auto py-2">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => renderCategory(cat))
                ) : (
                    <div className="px-6 py-10 text-center">
                        <p className="text-xs text-slate-400 font-medium italic">{t('dashboard.menuEditor.noCategoriesFound')}</p>
                    </div>
                )}
            </div>

            {/* Footer action to navigate to Add-ons section */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button className="w-full flex items-center justify-between text-[var(--color-primary-blue)] dark:text-blue-400 text-sm font-black py-4 px-2 hover:translate-x-1 transition-transform group">
                    {t('dashboard.menuEditor.goToAddOns')}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};
