import { useRef, useEffect } from 'react';
import { Plus, Search, Filter, ChevronDown, Loader2, Utensils, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../hooks/useMenu';
import { MenuItemCard } from './MenuItemCard';

interface MenuItemListProps {
    onOpenSidebar?: () => void;
}

/**
 * Component that renders the list of menu items for the currently selected category.
 */
export const MenuItemList = ({ onOpenSidebar }: MenuItemListProps) => {
    const { t } = useTranslation();
    const {
        selectedCategory,
        selectedCategoryId,
        allItems,
        searchQuery,
        setSearchQuery,
        isCurrentCategoryItemsLoading,
        hasMore,
        fetchNextPage
    } = useMenu();

    const observerTarget = useRef<HTMLDivElement>(null);

    // Infinite Scroll Implementation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isCurrentCategoryItemsLoading && selectedCategoryId) {
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

    // Do not render anything if no category is selected
    if (!selectedCategory) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fdfdfd] dark:bg-slate-950 overflow-hidden">
            {/* Sticky Action Bar */}
            <div className="px-4 md:px-8 py-4 shrink-0 z-20 border-b md:border-none border-slate-100 dark:border-slate-800">
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
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                            <Filter className="w-4 h-4" />
                            <span className="md:inline">{t('dashboard.menuEditor.filters')}</span>
                        </button>

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
