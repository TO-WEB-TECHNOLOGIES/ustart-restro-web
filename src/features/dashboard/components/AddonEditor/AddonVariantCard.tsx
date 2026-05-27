import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { useAddons } from '../../hooks/useAddons';
import { Switch } from '@/components/ui/switch';
import type { AddOnVariant } from '@/types/menuTypes';

interface AddonVariantCardProps {
    variant: AddOnVariant;
    onEdit: () => void;
}

export const AddonVariantCard: React.FC<AddonVariantCardProps> = ({ variant, onEdit }) => {
    const { t } = useTranslation();
    const { updateAddonVariant, deleteVariant, canManageMetadata } = useAddons();

    const handleStockToggle = (checked: boolean) => {
        updateAddonVariant(variant.addOnCategoryId, variant.variantId, {
            isAvailable: checked
        });
    };

    const handleDeleteClick = async () => {
        if (confirm(t('addons.deleteVariantConfirm', { name: variant.variantName }))) {
            await deleteVariant(variant.addOnCategoryId, variant.variantId);
        }
    };

    // Calculate formatted active timings
    const timingDisplay = variant.allDay
        ? t('addons.availableAllDay')
        : t('addons.availableTiming', { start: variant.startTime, end: variant.endTime });

    const isOutOfStock = !variant.isAvailable;

    return (
        <div
            className={`group relative p-5 bg-white dark:bg-slate-900 border ${
                isOutOfStock 
                    ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20' 
                    : 'border-slate-100 dark:border-slate-800 shadow-sm'
            } hover:shadow-md hover:-translate-y-0.5 rounded-3xl transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
        >
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className={`text-base font-black truncate ${isOutOfStock ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                        {variant.variantName}
                    </h4>
                    
                    {/* Draft indicators */}
                    {variant.variantId < 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[8px] font-black rounded uppercase shrink-0 tracking-wider">
                            {t('addons.newOption')}
                        </span>
                    )}
                </div>

                <p className={`text-xs ${variant.variantDescription ? 'text-slate-400 dark:text-slate-500' : 'text-slate-300 dark:text-slate-600 font-medium italic'} leading-relaxed max-w-xl`}>
                    {variant.variantDescription || t('addons.noDescription')}
                </p>

                {/* Meta pricing summary tags */}
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                        {t('addons.base')} <span className="font-extrabold text-slate-900 dark:text-white">₹{variant.price}</span>
                    </span>
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                        {t('addons.pkgFee')} <span className="font-extrabold text-slate-900 dark:text-white">₹{variant.packagingFees}</span>
                    </span>
                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                        {t('addons.taxGst')} <span className="font-extrabold text-slate-900 dark:text-white">{variant.taxPercentage}%</span>
                    </span>

                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {timingDisplay}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50 dark:border-slate-800">
                {/* Inline stock switch */}
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-400' : 'text-emerald-500'}`}>
                        {isOutOfStock ? t('addons.outOfStock') : t('addons.inStock')}
                    </span>
                    <Switch
                        checked={variant.isAvailable}
                        onCheckedChange={handleStockToggle}
                        className={variant.isAvailable ? 'data-[state=checked]:bg-emerald-500' : 'data-[state=unchecked]:bg-red-400'}
                    />
                </div>

                {/* Actions tools */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onEdit}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-[var(--color-primary-blue)] dark:hover:text-blue-400 border border-slate-100 dark:border-slate-800 rounded-xl transition-all"
                        title={t('addons.editOptionSettings')}
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    
                    {canManageMetadata && (
                        <button
                            onClick={handleDeleteClick}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 border border-slate-100 dark:border-slate-800 rounded-xl transition-all"
                            title={t('addons.deleteOption')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

