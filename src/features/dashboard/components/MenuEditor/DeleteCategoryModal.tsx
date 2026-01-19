import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertTriangle, Loader2, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../hooks/useMenu';
import { type Category } from '../../../../types/menuTypes';

interface DeleteCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category | null;
}

/**
 * Modal to confirm category deletion.
 * Shows a list of items that will be deleted and requires confirmation for an irreversible action.
 */
export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({ isOpen, onClose, category }) => {
    const { t } = useTranslation();
    const { categories, deleteCategory, isSubmitting, fetchCategoryItems, isItemsLoading } = useMenu();

    // Helper to find category in tree to make data reactive
    const findCategoryInTree = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.subCategories) {
                const found = findCategoryInTree(cat.subCategories, id);
                if (found) return found;
            }
        }
        return null;
    };

    const currentCategory = category ? findCategoryInTree(categories, category.id) || category : null;

    // Fetch items only if category has items (count > 0) but they aren't in the store yet
    useEffect(() => {
        if (isOpen && currentCategory && (currentCategory.itemCount || 0) > 0 && (!currentCategory.items || currentCategory.items.length === 0)) {
            fetchCategoryItems(currentCategory.id);
        }
    }, [isOpen, currentCategory?.id, fetchCategoryItems]);

    if (!isOpen || !currentCategory) return null;

    const handleDelete = async () => {
        await deleteCategory(currentCategory.id);
        onClose();
    };

    // Get all items that will be deleted (current category + subcategories)
    const getAllItems = (cat: Category): any[] => {
        let items = [...(cat.items || [])];
        if (cat.subCategories) {
            cat.subCategories.forEach(sub => {
                items = [...items, ...getAllItems(sub)];
            });
        }
        return items;
    };

    const affectedItems = getAllItems(currentCategory);
    const isLoadingItems = isItemsLoading[currentCategory.id];

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">
                            {t('dashboard.menuEditor.deleteCategoryModal.title')}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-8 pb-8">
                    <div className="mb-6">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-4">
                            {t('dashboard.menuEditor.deleteCategoryModal.warning')}
                            <span className="ml-1 font-black text-red-500 underline decoration-red-500/30 underline-offset-4">{currentCategory.name}</span>.
                        </p>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-100/50 dark:border-red-900/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('dashboard.menuEditor.irreversibleAction')}
                        </div>
                    </div>

                    {/* Affected Items List */}
                    <div className="max-h-56 min-h-[120px] overflow-y-auto mb-8 pr-2 custom-scrollbar border-y border-slate-100 dark:border-slate-800 py-4 relative">
                        {isLoadingItems && affectedItems.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-blue)] mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {t('dashboard.menuEditor.fetchingItems')}
                                </p>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            {affectedItems.length > 0 ? (
                                affectedItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm group transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                    <Package className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                                {item.name}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-black text-[var(--color-primary-blue)] uppercase tracking-widest">
                                                    ₹{item.itemPrice}
                                                </p>
                                                {item.isVeg !== undefined && (
                                                    <div className={`w-2.5 h-2.5 rounded-full border ${item.isVeg ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} flex items-center justify-center`}>
                                                        <div className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : !isLoadingItems ? (
                                <div className="text-center py-8">
                                    <Package className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {t('dashboard.menuEditor.noItemsInThisCategory')}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 relative">
                        {isSubmitting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] rounded-2xl z-20">
                                {/* The button itself already shows a loader */}
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-widest"
                        >
                            {t('dashboard.menuEditor.deleteCategoryModal.cancelButton')}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Trash2 className="w-5 h-5" />
                            )}
                            <span>{t('dashboard.menuEditor.deleteCategoryModal.confirmButton')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
