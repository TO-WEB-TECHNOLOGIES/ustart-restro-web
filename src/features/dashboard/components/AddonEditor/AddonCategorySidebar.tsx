import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    MoreVertical,
    Search,
    X,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    ChevronLeft
} from 'lucide-react';
import { useAddons } from '../../hooks/useAddons';
import { AddEditAddonCategoryModal } from './AddEditAddonCategoryModal';
import type { AddOnCategory } from '@/types/menuTypes';

interface AddonCategorySidebarProps {
    onClose?: () => void;
    isCollapsed?: boolean;
}

export const AddonCategorySidebar: React.FC<AddonCategorySidebarProps> = ({ onClose, isCollapsed }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        addonCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        canManageMetadata,
        updateCategory,
        deleteCategory
    } = useAddons();

    const [categorySearch, setCategorySearch] = useState('');
    const [openMenuCategoryId, setOpenMenuCategoryId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<AddOnCategory | null>(null);

    // Close category dropdown menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuCategoryId(null);
            }
        };

        if (openMenuCategoryId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuCategoryId]);

    // Apply Search Filter on Category Names
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return addonCategories;
        return addonCategories.filter(cat =>
            cat.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
        );
    }, [addonCategories, categorySearch]);

    const handleEditCategory = (cat: AddOnCategory, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuCategoryId(null);
        setActiveCategory(cat);
        setIsCategoryModalOpen(true);
    };

    const handleToggleCategoryStatus = async (cat: AddOnCategory, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuCategoryId(null);
        await updateCategory(cat.addOnId, { isActive: !cat.isActive });
    };

    const handleDeleteCategoryClick = async (cat: AddOnCategory, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuCategoryId(null);
        if (confirm(t('addons.deleteCategoryConfirm', { name: cat.categoryName }))) {
            await deleteCategory(cat.addOnId);
        }
    };

    const renderCategoryItem = (cat: AddOnCategory) => {
        const isSelected = selectedCategoryId === cat.addOnId;
        const isMenuOpen = openMenuCategoryId === cat.addOnId;
        const isInactive = !cat.isActive;

        return (
            <div key={cat.addOnId}>
                <div
                    onClick={() => {
                        setSelectedCategoryId(cat.addOnId);
                        if (window.innerWidth < 768) onClose?.();
                    }}
                    className={`group flex items-center justify-between px-4 py-3.5 cursor-pointer transition-all relative ${
                        isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-600/20 border-l-4 border-primary-blue'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                    } ${isInactive ? 'opacity-50 grayscale-[0.5]' : ''}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isInactive && (
                            <EyeOff className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        )}
                        <span
                            className={`text-sm font-bold truncate ${
                                isSelected
                                    ? 'text-primary-blue dark:text-white'
                                    : 'text-slate-700 dark:text-slate-300'
                             }`}
                        >
                            {cat.categoryName} {cat.variants ? `(${cat.variants.length})` : ''}
                        </span>
                    </div>

                    {/* Meta rules overview badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {cat.isMandatory ? (
                            <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-500 text-[8px] font-black rounded uppercase">
                                {t('addons.required')}
                            </span>
                        ) : (
                            <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[8px] font-black rounded uppercase">
                                {t('addons.optional')}
                            </span>
                        )}

                        {/* Category Dropdown Actions Menu (Brand-Level Users Only) */}
                        {canManageMetadata && (
                            <div className="relative" ref={isMenuOpen ? menuRef : null}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuCategoryId(prev => prev === cat.addOnId ? null : cat.addOnId);
                                    }}
                                    className={`p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity ${
                                        isMenuOpen ? 'opacity-100 bg-slate-200 dark:bg-slate-700' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                >
                                    <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <button
                                            onClick={(e) => handleEditCategory(cat, e)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                            {t('addons.editCategory')}
                                        </button>

                                        <button
                                            onClick={(e) => handleToggleCategoryStatus(cat, e)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-t border-slate-100 dark:border-slate-700 ${
                                                isInactive ? 'text-green-600' : 'text-orange-600'
                                            }`}
                                        >
                                            {isInactive ? (
                                                <>
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {t('addons.enableCategory')}
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                    {t('addons.disableCategory')}
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={(e) => handleDeleteCategoryClick(cat, e)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-t border-slate-100 dark:border-slate-700"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {t('addons.deleteCategory')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className={`w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-opacity duration-200 ${
                isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* Mobile Header */}
            <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('addons.categoryTitle')}
                </span>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>

            {/* Back Navigation Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center gap-2 shrink-0">
                <button
                    onClick={() => navigate('/dashboard/menu/edit')}
                    className="flex items-center gap-1.5 text-primary-blue dark:text-blue-400 text-[10px] font-black uppercase tracking-wider hover:opacity-80 transition-all font-sans"
                >
                    <ChevronLeft className="w-4.5 h-4.5 stroke-[2.5]" />
                    {t('addons.backToMenu')}
                </button>
            </div>

            {/* Sidebar header - total categories count */}
            <div className="p-4 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/20">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {t('addons.categories', { count: addonCategories.length })}
                </h3>
            </div>

            {/* Category search bar */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('addons.searchPlaceholder')}
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-blue transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Full-width Centered Add Category Row */}
            {canManageMetadata && (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
                    <button
                        onClick={() => {
                            setActiveCategory(null);
                            setIsCategoryModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-primary-blue/30 dark:hover:border-blue-500/30 text-primary-blue dark:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 text-xs font-black uppercase py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] font-sans"
                    >
                        <Plus className="w-4 h-4 stroke-[3px]" />
                        {t('addons.addCategory')}
                    </button>
                </div>
            )}

            {/* Scrollable category list */}
            <div className="flex-1 overflow-y-auto py-2 bg-white dark:bg-slate-900">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => renderCategoryItem(cat))
                ) : (
                    <div className="px-6 py-10 text-center">
                        <p className="text-xs text-slate-400 font-medium italic">
                            {t('addons.noCategoriesFound')}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Category Modal */}
            <AddEditAddonCategoryModal
                isOpen={isCategoryModalOpen}
                category={activeCategory}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setActiveCategory(null);
                }}
            />
        </div>
    );
};
