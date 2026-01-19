import { useRef, useEffect, useState } from 'react';
import { Plus, Search, Filter, ChevronDown, Loader2, Utensils, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../hooks/useMenu';
import { MenuItemCard } from './MenuItemCard';
import { motion } from 'framer-motion';

interface MenuItemListProps {
    onOpenSidebar?: () => void;
}

/**
 * Component that renders the list of menu items for the currently selected category.
 */
export const MenuItemList = ({ onOpenSidebar }: MenuItemListProps) => {
    const { t } = useTranslation();
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const {
        selectedCategory,
        selectedCategoryId,
        allItems,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        clearFilters,
        isCurrentCategoryItemsLoading,
        hasMore,
        fetchNextPage
    } = useMenu();

    const [stagedFilters, setStagedFilters] = useState(filters);

    // Sync staged filters when global filters change (e.g. on clear) or when opening dropdown
    useEffect(() => {
        if (showFilters) {
            setStagedFilters(filters);
        }
    }, [showFilters, filters]);

    const observerTarget = useRef<HTMLDivElement>(null);

    // Close filters on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Infinite Scroll Implementation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isCurrentCategoryItemsLoading && selectedCategoryId !== null) {
                    fetchNextPage(selectedCategoryId);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isCurrentCategoryItemsLoading, fetchNextPage, selectedCategoryId]);

    // Handle multi-select toggle for array filters (STAGED)
    const toggleStagedFilter = (key: 'stock' | 'foodType', value: any) => {
        const current = stagedFilters[key] as any[];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        setStagedFilters({ ...stagedFilters, [key]: updated });
    };

    const handleApplyFilters = () => {
        setFilters(stagedFilters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        clearFilters();
        setShowFilters(false);
    };

    const activeFilterCount = filters.stock.length + filters.foodType.length + (filters.discounted !== null ? 1 : 0);

    // Show empty state if no category is selected
    if (!selectedCategory) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fdfdfd] dark:bg-slate-950">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                    {t('dashboard.menuEditor.noCategorySelected')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                    {t('dashboard.menuEditor.searchCategories')}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fdfdfd] dark:bg-slate-950 overflow-hidden">
            {/* Sticky Action Bar */}
            <div className="px-4 md:px-8 py-4 shrink-0 z-30 border-b md:border-none border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                    <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
                        {/* Mobile Categories Toggle */}
                        <button
                            onClick={onOpenSidebar}
                            className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400"
                        >
                            <Layout className="w-5 h-5" />
                        </button>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder={t('dashboard.menuEditor.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Filter Dropdown */}
                        <div className="relative flex-1 md:flex-none" ref={filterRef}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border ${showFilters || activeFilterCount > 0 ? 'bg-[var(--color-primary-blue)] border-[var(--color-primary-blue)] text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                            >
                                <Filter className="w-4 h-4" />
                                <span>{t('dashboard.menuEditor.filters')}</span>
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 bg-white text-[var(--color-primary-blue)] rounded-full text-[10px] font-black">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('dashboard.menuEditor.filter.apply')}</h4>
                                        {activeFilterCount > 0 && (
                                            <button onClick={handleClearFilters} className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-tighter">
                                                {t('dashboard.menuEditor.filter.clearAll')}
                                            </button>
                                        )}
                                    </div>

                                    {/* 1. Stock Status */}
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-tight">{t('dashboard.menuEditor.filter.stockStatus')}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: t('dashboard.menuEditor.filter.inStock'), value: 'in_stock' },
                                                { label: t('dashboard.menuEditor.filter.outOfStock'), value: 'out_of_stock' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => toggleStagedFilter('stock', opt.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${stagedFilters.stock.includes(opt.value as any) ? 'bg-[var(--color-primary-blue)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Food Type */}
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-tight">{t('dashboard.menuEditor.filter.dietaryPreference')}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: t('dashboard.menuEditor.filter.veg'), value: 'veg' },
                                                { label: t('dashboard.menuEditor.filter.nonVeg'), value: 'non_veg' },
                                                { label: t('dashboard.menuEditor.filter.containsEgg'), value: 'contains_egg' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => toggleStagedFilter('foodType', opt.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${stagedFilters.foodType.includes(opt.value as any) ? 'bg-[var(--color-primary-blue)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Discount */}
                                    <div className="mb-6">
                                        <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-tight">{t('dashboard.menuEditor.filter.pricing')}</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: t('dashboard.menuEditor.filter.discounted'), value: true },
                                                { label: t('dashboard.menuEditor.filter.noDiscount'), value: false }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.label}
                                                    onClick={() => setStagedFilters({ ...stagedFilters, discounted: stagedFilters.discounted === opt.value ? null : opt.value })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${stagedFilters.discounted === opt.value ? 'bg-[var(--color-primary-blue)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleApplyFilters}
                                        className="w-full py-2 bg-[var(--color-primary-blue)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        {t('dashboard.menuEditor.filter.apply')}
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                            <span className="md:inline">{t('dashboard.menuEditor.actions')}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        <div className="hidden md:block flex-1" />

                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white text-sm font-black px-4 md:px-6 py-2 rounded-xl transition-all shadow-md active:scale-95">
                            <Plus className="w-5 h-5 shrink-0" />
                            <span className="truncate">{t('dashboard.menuEditor.addNewItem')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto">
                <div className="w-full px-4 md:px-8 py-4">
                    {/* Category Title & Description */}
                    <div className="mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
                            <span className="truncate">{selectedCategory.name}</span>
                            <span className="text-lg md:text-xl font-bold text-slate-400 dark:text-slate-500 shrink-0">
                                ({selectedCategory.itemCount || 0})
                            </span>
                        </h2>
                        <p className={`text-sm md:text-base mt-2 w-full max-w-5xl leading-relaxed ${selectedCategory.description ? 'text-slate-500 dark:text-slate-400' : 'text-orange-500 dark:text-orange-400 font-medium italic'}`}>
                            {selectedCategory.description || t('dashboard.menuEditor.noDescription')}
                        </p>
                    </div>

                    {/* Content Section */}
                    {isCurrentCategoryItemsLoading && allItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-blue)] mb-4" />
                            <p className="text-slate-400 font-medium text-sm">
                                {t('dashboard.menuEditor.fetchingItems')}
                            </p>
                        </div>
                    ) : allItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-[32px] md:rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Utensils className="w-6 h-6 md:w-8 md:h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white mb-2 text-center px-4">
                                {t('dashboard.menuEditor.noItemsInCategory')}
                            </h3>
                            <button className="mt-4 flex items-center gap-2 bg-[var(--color-primary-blue)] text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-[#1a3a5f] transition-all">
                                <Plus className="w-4 h-4" />
                                {t('dashboard.menuEditor.addNewItem')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:gap-4 w-full">
                                {allItems.map(item => (
                                    <MenuItemCard key={item.id} item={item} />
                                ))}
                            </div>

                            {/* Infinite Scroll Sentinel */}
                            <div ref={observerTarget} className="h-20 flex items-center justify-center">
                                {hasMore && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('dashboard.menuEditor.fetchingItems')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
