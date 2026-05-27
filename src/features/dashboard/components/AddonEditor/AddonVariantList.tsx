import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Filter, Loader2, ListPlus, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAddons } from '../../hooks/useAddons';
import { AddonVariantCard } from './AddonVariantCard';
import { AddEditAddonVariantForm } from './AddEditAddonVariantForm';
import { Modal } from '@/components/ui/modal';

interface AddonVariantListProps {
    onOpenSidebar?: () => void;
}

export const AddonVariantList: React.FC<AddonVariantListProps> = ({ onOpenSidebar }) => {
    const { t } = useTranslation();
    const {
        selectedCategory,
        selectedCategoryId,
        variants,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        clearFilters,
        isCurrentCategoryVariantsLoading,
        canManageMetadata,
        isDirty,
        isSubmitting,
        submitChanges,
        revertChanges
    } = useAddons();

    const [showFilters, setShowFilters] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingVariant, setEditingVariant] = useState<any | null>(null);
    const [showRevertModal, setShowRevertModal] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Smooth scroll to the top of the container when the inline form is shown
    useEffect(() => {
        if (isAdding || editingVariant) {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [isAdding, editingVariant]);

    // Reset inline editor states if category changes
    useEffect(() => {
        setIsAdding(false);
        setEditingVariant(null);
    }, [selectedCategoryId]);

    // Apply Filter Toggle
    const handleToggleStockFilter = (value: 'in_stock' | 'out_of_stock') => {
        const current = filters.stock;
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        setFilters({ stock: updated });
    };

    const activeFilterCount = filters.stock.length;

    // Show empty state if no category is selected
    if (!selectedCategory) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fdfdfd] dark:bg-slate-950">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ListPlus className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1.5">
                    {t('addons.noCategorySelectedTitle')}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs text-center leading-relaxed font-medium">
                    {t('addons.noCategorySelectedDesc')}
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#fdfdfd] dark:bg-slate-950 overflow-hidden relative">
            {/* Unsaved Changes Banner */}
            {isDirty && (
                <div className="px-4 md:px-8 py-3 bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 shrink-0">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            {t('addons.unsavedChanges')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowRevertModal(true)}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-wider transition-all font-sans"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {t('addons.discard')}
                        </button>
                        <button
                            onClick={submitChanges}
                            disabled={isSubmitting}
                            className="px-3.5 py-1.5 bg-primary-blue hover:bg-[#1a3a5f] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 font-sans"
                        >
                            {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                            {t('addons.saveChanges')}
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Action Bar */}
            <div className="px-4 md:px-8 py-4 shrink-0 z-30 border-b md:border-none border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                    {/* Search Field */}
                    <div className="flex items-center gap-2 w-full md:w-auto md:flex-1">
                        <button
                            onClick={onOpenSidebar}
                            className="md:hidden p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-500"
                        >
                            <Plus className="w-4 h-4 rotate-45" />
                        </button>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('addons.searchOptionsPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Filter and Add buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <div className="relative flex-1 md:flex-none">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm ${
                                    activeFilterCount > 0
                                        ? 'bg-[var(--color-primary-blue)] border-[var(--color-primary-blue)] text-white'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                {t('addons.filters')}
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center w-4 h-4 bg-white text-[var(--color-primary-blue)] rounded-full text-[9px] font-black">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Filters Dropdown */}
                            {showFilters && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50">
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-800 pb-2">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400">{t('addons.filterStock')}</h4>
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={() => {
                                                    clearFilters();
                                                    setShowFilters(false);
                                                }}
                                                className="text-[9px] font-black text-red-500 hover:underline uppercase"
                                            >
                                                {t('addons.clear')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {[
                                            { label: t('addons.inStockOnly'), value: 'in_stock' },
                                            { label: t('addons.outOfStockOnly'), value: 'out_of_stock' }
                                        ].map(opt => {
                                            const isActive = filters.stock.includes(opt.value as any);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => {
                                                        handleToggleStockFilter(opt.value as any);
                                                        setShowFilters(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                                                        isActive 
                                                            ? 'bg-blue-50/50 dark:bg-blue-900/20 text-[var(--color-primary-blue)] dark:text-blue-400' 
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {opt.label}
                                                    {isActive && <span className="w-1.5 h-1.5 bg-[var(--color-primary-blue)] rounded-full" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Floating "Add New Add-on" trigger button (Only for Brand Users) */}
                        {canManageMetadata && (
                            <button
                                onClick={() => {
                                    setIsAdding(true);
                                    setEditingVariant(null);
                                }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                            >
                                <Plus className="w-4 h-4 shrink-0" />
                                {t('addons.addOptionButton')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable listing container */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                <div className="px-4 md:px-8 py-4">
                    {/* Category Title & Rules summary */}
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3.5 flex-wrap">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                                    <span>{selectedCategory.categoryName}</span>
                                    <span className="text-sm font-bold text-slate-400">
                                        ({variants.length})
                                    </span>
                                </h2>
                                {selectedCategory.isMandatory && (
                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 border border-red-200/50 text-red-600 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                        {t('addons.mandatory')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                {t('addons.selectionRule', { min: selectedCategory.minCustomizationSelection, max: selectedCategory.maxCustomizationSelection })}
                            </p>
                        </div>
                    </div>

                    {/* Inline Creation/Editing Form Section */}
                    {(isAdding || editingVariant) && (
                        <div className="mb-6">
                            <AddEditAddonVariantForm
                                variant={editingVariant}
                                categoryId={selectedCategoryId!}
                                onClose={() => {
                                    setIsAdding(false);
                                    setEditingVariant(null);
                                }}
                            />
                        </div>
                    )}

                    {/* Loader overlay or listing grid */}
                    {isCurrentCategoryVariantsLoading && variants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-blue)] mb-3" />
                            <p className="text-slate-400 font-bold text-xs">
                                {t('addons.fetchingOptions')}
                            </p>
                        </div>
                    ) : variants.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                                <ListPlus className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-700 dark:text-white mb-1.5 text-center px-4">
                                {t('addons.noOptionsInCat')}
                            </h3>
                            <p className="text-xs text-slate-400 max-w-xs text-center leading-relaxed font-medium mb-4">
                                {t('addons.noOptionsInCatDesc')}
                            </p>
                            {canManageMetadata && !isAdding && !editingVariant && (
                                <button
                                    onClick={() => {
                                        setIsAdding(true);
                                        setEditingVariant(null);
                                    }}
                                    className="flex items-center gap-2 bg-[var(--color-primary-blue)] text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#1a3a5f] transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('addons.addOptionButton')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {variants.map(v => (
                                <AddonVariantCard
                                    key={v.variantId}
                                    variant={v}
                                    onEdit={() => {
                                        setEditingVariant(v);
                                        setIsAdding(false);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Revert Changes Confirmation Modal */}
            <Modal
                isOpen={showRevertModal}
                onClose={() => setShowRevertModal(false)}
                title={t('addons.discardUnsavedChanges')}
            >
                <div className="space-y-5">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/20 rounded-full shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {t('addons.discardConfirm')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={() => setShowRevertModal(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            {t('addons.cancel')}
                        </button>
                        <button
                            onClick={() => {
                                revertChanges();
                                setShowRevertModal(false);
                            }}
                            className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-sm"
                        >
                            {t('addons.confirmDiscard')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

