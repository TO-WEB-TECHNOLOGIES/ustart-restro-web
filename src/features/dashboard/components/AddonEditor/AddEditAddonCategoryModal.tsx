import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { X, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAddons } from '../../hooks/useAddons';
import type { AddOnCategory } from '@/types/menuTypes';

interface AddEditAddonCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: AddOnCategory | null;
}

export const AddEditAddonCategoryModal: React.FC<AddEditAddonCategoryModalProps> = ({ isOpen, onClose, category }) => {
    const { t } = useTranslation();
    const { addCategory, updateCategory, isSubmitting } = useAddons();

    const [categoryName, setCategoryName] = useState('');
    const [minSelection, setMinSelection] = useState(0);
    const [maxSelection, setMaxSelection] = useState(999);
    const [error, setError] = useState('');

    const isEditMode = !!category;

    // Sync with category prop when editing or reset when adding
    useEffect(() => {
        if (category) {
            setCategoryName(category.categoryName);
            setMinSelection(category.minCustomizationSelection ?? 0);
            setMaxSelection(category.maxCustomizationSelection ?? 999);
        } else {
            setCategoryName('');
            setMinSelection(0);
            setMaxSelection(999);
        }
        setError('');
    }, [category, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!categoryName.trim()) {
            setError(t('addons.validation.categoryRequired'));
            return;
        }

        if (maxSelection < minSelection) {
            setError(t('addons.validation.maxMinSelection'));
            return;
        }

        const isMandatoryVal = minSelection > 0;

        try {
            if (isEditMode && category) {
                await updateCategory(category.addOnId, {
                    categoryName: categoryName.trim(),
                    minCustomizationSelection: minSelection,
                    maxCustomizationSelection: maxSelection,
                    isMandatory: isMandatoryVal,
                });
            } else {
                await addCategory({
                    categoryName: categoryName.trim(),
                    minCustomizationSelection: minSelection,
                    maxCustomizationSelection: maxSelection,
                    isMandatory: isMandatoryVal,
                    menuItemIds: [],
                });
            }
            onClose();
        } catch (err: any) {
            setError(err.message || t('common.error.generic'));
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-background-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-20 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Illustration Header */}
                <div className="bg-third-cream dark:bg-slate-800/50 h-32 w-full flex items-center justify-center relative overflow-hidden border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--color-secondary-orange) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                    <Sparkles className="w-16 h-16 text-secondary-orange animate-pulse" />
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-primary-blue dark:text-white mb-1">
                            {isEditMode ? t('addons.editAddonCategory') : t('addons.addAddonCategory')}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                            {t('addons.groupVariants')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-500">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Category Name */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" htmlFor="addOnCategoryName">
                                {t('addons.categoryName')}
                            </label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-blue/10 focus:border-primary-blue rounded-2xl focus:outline-none text-slate-900 dark:text-white font-bold placeholder-slate-400 transition-all shadow-sm"
                                id="addOnCategoryName"
                                placeholder={t('addons.categoryNamePlaceholder')}
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Customization Selection Limits */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" htmlFor="minSelection">
                                    {t('addons.minSelection')}
                                </label>
                                <input
                                    className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue/10 focus:border-primary-blue text-slate-900 dark:text-white font-bold transition-all shadow-sm"
                                    id="minSelection"
                                    type="number"
                                    min="0"
                                    value={minSelection}
                                    onChange={(e) => setMinSelection(Math.max(0, parseInt(e.target.value) || 0))}
                                />
                                <div className="text-[9px] font-black mt-1.5 uppercase tracking-wider">
                                    {minSelection > 0 ? (
                                        <span className="text-red-500 dark:text-red-400">{t('addons.required')}</span>
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500">{t('addons.optional')}</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2" htmlFor="maxSelection">
                                    {t('addons.maxSelection')}
                                </label>
                                <input
                                    className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue/10 focus:border-primary-blue text-slate-900 dark:text-white font-bold transition-all shadow-sm"
                                    id="maxSelection"
                                    type="number"
                                    min="1"
                                    value={maxSelection}
                                    onChange={(e) => setMaxSelection(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-semibold">
                                    {t('addons.maxAllowed')}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!categoryName.trim() || isSubmitting}
                            className="w-full bg-primary-blue hover:bg-[#1a3a5f] disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Check className="w-5 h-5 stroke-[3px]" />
                            )}
                            <span>{isSubmitting ? t('addons.saving') : (isEditMode ? t('addons.editCategory') : t('addons.addCategory'))}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
