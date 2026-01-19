import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle, Tag } from 'lucide-react';
import type { MenuItem } from '../../../../types/menuTypes';
import { useRestaurantStore } from '../../store/useRestaurantStore';

/**
 * Helper to render the specific value changes for an item field
 */
const ChangeLine = ({
    label,
    oldVal,
    newVal,
    suffix = '',
    oldSuffix,
    newSuffix
}: {
    label: string,
    oldVal: React.ReactNode,
    newVal: React.ReactNode,
    suffix?: string,
    oldSuffix?: string,
    newSuffix?: string
}) => {
    const sOld = oldSuffix || suffix;
    const sNew = newSuffix || suffix;

    // If both value and unit are identical, don't show anything
    if (oldVal === newVal && sOld === sNew) return null;

    return (
        <div className="flex items-center gap-3 text-[10px] md:text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-none">
            <span className="text-slate-400 w-28 shrink-0 font-medium">{label}</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-red-400 line-through truncate font-medium">{oldVal}{sOld}</span>
                <ArrowLeft className="w-3 h-3 text-slate-300 rotate-180 shrink-0" />
                <span className="text-green-500 font-bold truncate">{newVal}{sNew}</span>
            </div>
        </div>
    );
};

interface ModifiedItemCardProps {
    original: MenuItem;
    current: MenuItem;
    modifiedByAddressId?: string | null;
}

/**
 * Sub-component for individual modified menu items used in ReviewChanges view
 */
export const ModifiedItemCard = ({ original, current, modifiedByAddressId }: ModifiedItemCardProps) => {
    const { t } = useTranslation();
    const { addresses } = useRestaurantStore();

    // Find address label if modified by specific address
    const modificationSourceLabel = modifiedByAddressId 
        ? addresses.find(a => a.id === modifiedByAddressId)?.label || modifiedByAddressId
        : null;

    // Logic to detect specific address changes
    const stockChanges = (() => {
        const changes: { addressLabel: string, oldVal: string, newVal: string }[] = [];
        const originalStock = original.inStock || {};
        const currentStock = current.inStock || {};

        const allKeys = new Set([...Object.keys(originalStock), ...Object.keys(currentStock)]);

        allKeys.forEach(key => {
            // Coerce to boolean to compare status
            const oldBool = !!originalStock[key];
            const newBool = !!currentStock[key];

            if (oldBool !== newBool) {
                const address = addresses.find(a => a.id === key);
                const addressLabel = address ? address.label : key; // Use ID as fallback label

                changes.push({
                    addressLabel,
                    oldVal: oldBool ? t('dashboard.menuEditor.filter.inStock') : t('dashboard.menuEditor.filter.outOfStock'),
                    newVal: newBool ? t('dashboard.menuEditor.filter.inStock') : t('dashboard.menuEditor.filter.outOfStock')
                });
            }
        });
        return changes;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 transition-all hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none"
        >
            <div className="flex flex-col gap-6">
                {/* Item Identity Header */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                        {current.image ? (
                            <img src={current.image} alt={current.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                <Tag className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{current.name}</h4>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{current.id}</p>
                            {modificationSourceLabel && (
                                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">
                                    Modified at: {modificationSourceLabel}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Changes Grid-style breakdown */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t('dashboard.menuEditor.review.detectedModifications')}
                        </h5>
                    </div>

                    <div className="space-y-0.5">
                        <ChangeLine label={t('dashboard.menuEditor.filter.dietaryPreference')} oldVal={original.foodType} newVal={current.foodType} />

                        {/* Dynamic Stock Changes */}
                        {stockChanges.map((change, idx) => (
                            <ChangeLine
                                key={idx}
                                label={change.addressLabel}
                                oldVal={change.oldVal}
                                newVal={change.newVal}
                            />
                        ))}

                        <ChangeLine label={t('dashboard.menuEditor.originalPrice')} oldVal={original.itemPrice} newVal={current.itemPrice} suffix="₹" />
                        <ChangeLine label={t('dashboard.menuEditor.taxAmount')} oldVal={original.taxAmount} newVal={current.taxAmount} suffix="%" />
                        <ChangeLine
                            label={t('dashboard.menuEditor.discountLabel')}
                            oldVal={original.discountAmount}
                            newVal={current.discountAmount}
                            oldSuffix={original.discountIsAbsolute ? '₹' : '%'}
                            newSuffix={current.discountIsAbsolute ? '₹' : '%'}
                        />
                        <ChangeLine label={t('dashboard.menuEditor.packaging')} oldVal={original.packagingCharges} newVal={current.packagingCharges} suffix="₹" />
                        <ChangeLine label={t('dashboard.menuEditor.itemName')} oldVal={original.name} newVal={current.name} />
                        <ChangeLine label={t('dashboard.menuEditor.itemDescription')} oldVal={original.description} newVal={current.description} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
