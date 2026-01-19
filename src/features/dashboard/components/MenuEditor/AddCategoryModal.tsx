import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../hooks/useMenu';
import { type Category } from '../../../../types/menuTypes';
import { categorySchema } from '../../validations/menuSchemas';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null; // Added for edit mode
}

/**
 * Modal component for creating or editing a menu category.
 * Features a custom design with an SVG illustration and theme-consistent styling.
 */
export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, category }) => {
    const { t } = useTranslation();
    const { categories, addCategory, updateCategory, isSubmitting } = useMenu();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

    const isEditMode = !!category;

    // Sync state with category prop when editing
    useEffect(() => {
        if (category) {
            setName(category.name);
            setDescription(category.description || '');
            setParentCategoryId(category.parentCategoryId || null);
        } else {
            setName('');
            setDescription('');
            setParentCategoryId(null);
        }
        setErrors({});
    }, [category, isOpen]);

    // Filter categories that have no parent (roots) to populate the parent dropdown
    // If editing, also filter out the category itself to prevent cycles
    const rootCategories = categories.filter(cat => !cat.parentCategoryId && cat.id !== category?.id);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Zod Validation
        const result = categorySchema.safeParse({ name: name.trim(), description: description.trim() });
        if (!result.success) {
            const fieldErrors: { name?: string; description?: string } = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as keyof typeof fieldErrors;
                if (path) fieldErrors[path] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        // Change Detection for Edit Mode
        if (isEditMode && category) {
            const hasNameChanged = name.trim() !== category.name;
            const hasDescChanged = (description.trim() || undefined) !== category.description;
            const hasParentChanged = parentCategoryId !== (category.parentCategoryId || null);

            if (!hasNameChanged && !hasDescChanged && !hasParentChanged) {
                console.log('No changes detected, closing modal.');
                onClose();
                return;
            }

            await updateCategory(category.id, {
                name: name.trim(),
                description: description.trim() || undefined,
                parentCategoryId: parentCategoryId
            });
        } else {
            await addCategory({
                name: name.trim(),
                description: description.trim() || undefined,
                parentCategoryId: parentCategoryId
            });
        }

        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-md bg-[var(--color-background-white)] dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500"
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
                <div className="bg-[var(--color-third-cream)] dark:bg-slate-800/50 h-44 w-full flex items-center justify-center relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--color-secondary-orange) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                    <svg className="w-28 h-28 drop-shadow-sm transform hover:scale-105 transition-transform duration-300 relative z-10" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path d="M40 90 L160 90 L150 160 C150 170 140 180 130 180 L70 180 C60 180 50 170 50 160 L40 90 Z" fill="#ffffff" stroke="var(--color-dark-gray)" strokeLinejoin="round" strokeWidth="4"></path>
                        <path d="M40 90 L160 90" stroke="var(--color-dark-gray)" strokeLinecap="round" strokeWidth="4"></path>
                        <path d="M40 90 C40 30 160 30 160 90" fill="none" stroke="var(--color-dark-gray)" strokeLinecap="round" strokeWidth="4"></path>
                        <circle cx="70" cy="75" fill="var(--color-brown)" r="22" stroke="var(--color-dark-gray)" strokeWidth="3"></circle>
                        <rect fill="var(--color-terracotta-green)" height="55" rx="5" stroke="var(--color-dark-gray)" strokeWidth="3" transform="rotate(10 100 65)" width="22" x="95" y="45"></rect>
                        <circle cx="130" cy="75" fill="var(--color-secondary-orange)" r="20" stroke="var(--color-dark-gray)" strokeWidth="3"></circle>
                        <path d="M55 120 L145 120" stroke="var(--color-dark-gray)" strokeOpacity="0.1" strokeWidth="2"></path>
                        <path d="M60 150 L140 150" stroke="var(--color-dark-gray)" strokeOpacity="0.1" strokeWidth="2"></path>
                    </svg>
                </div>

                <div className="p-8">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-black text-[var(--color-primary-blue)] dark:text-white mb-2">
                            {isEditMode ? t('dashboard.menuEditor.editCategory') : t('dashboard.menuEditor.addCategoryModal.title')}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                            {isEditMode ? "Update the details of your menu category." : t('dashboard.menuEditor.addCategoryModal.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Category Name */}
                        <div>
                            <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2" htmlFor="categoryName">
                                {t('dashboard.menuEditor.addCategoryModal.nameLabel')}
                            </label>
                            <input
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.name ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[var(--color-secondary-orange)]/10 focus:border-[var(--color-secondary-orange)]'} rounded-2xl focus:outline-none focus:ring-4 text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-sm`}
                                id="categoryName"
                                placeholder={t('dashboard.menuEditor.addCategoryModal.namePlaceholder')}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            {errors.name && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-500 animate-in slide-in-from-top-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Category Description */}
                        <div>
                            <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2" htmlFor="categoryDesc">
                                {t('dashboard.menuEditor.addCategoryModal.descLabel')}
                            </label>
                            <textarea
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.description ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[var(--color-secondary-orange)]/10 focus:border-[var(--color-secondary-orange)]'} rounded-2xl focus:outline-none focus:ring-4 text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-slate-600 transition-all shadow-sm resize-none`}
                                id="categoryDesc"
                                placeholder={t('dashboard.menuEditor.addCategoryModal.descPlaceholder')}
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            {errors.description && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-500 animate-in slide-in-from-top-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Parent Category Dropdown */}
                        <div>
                            <label className="block text-[10px] font-black text-white uppercase tracking-widest mb-2">
                                {t('dashboard.menuEditor.addCategoryModal.parentLabel')}
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--color-secondary-orange)]/10 focus:border-[var(--color-secondary-orange)] text-slate-900 dark:text-white font-bold appearance-none cursor-pointer transition-all shadow-sm"
                                    value={parentCategoryId || ''}
                                    onChange={(e) => setParentCategoryId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">{t('dashboard.menuEditor.addCategoryModal.noneOption')}</option>
                                    {rootCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className="w-full bg-[var(--color-secondary-orange)] hover:opacity-90 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-[var(--color-secondary-orange)]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Check className="w-5 h-5 stroke-[3px]" />
                            )}
                            <span>
                                {isSubmitting
                                    ? "Saving..."
                                    : (isEditMode ? t('dashboard.menuEditor.editCategory') : t('dashboard.menuEditor.addCategoryModal.saveButton'))
                                }
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
