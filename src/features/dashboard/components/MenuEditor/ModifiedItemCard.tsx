import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertCircle, Tag, Calendar, Plus, Flame, Info } from 'lucide-react';
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

/**
 * Helper to render a single field value for new items
 */
const InfoLine = ({
    label,
    value,
    suffix = '',
    icon: Icon
}: {
    label: string,
    value: React.ReactNode,
    suffix?: string,
    icon?: any
}) => {
    if (value === undefined || value === null || value === '') return null;

    return (
        <div className="flex items-center gap-3 text-[10px] md:text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-none">
            <span className="text-slate-400 w-28 shrink-0 font-medium flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3" />}
                {label}
            </span>
            <span className="text-slate-900 dark:text-slate-200 font-bold flex-1 truncate">
                {value}{suffix}
            </span>
        </div>
    );
};

interface ModifiedItemCardProps {
    original: MenuItem;
    current: MenuItem;
    modifiedByAddressId?: string | null;
    isNewItem?: boolean;
    addToStockImmediately?: boolean;
    scheduledDate?: string | null;
}

/**
 * Sub-component for individual modified menu items used in ReviewChanges view
 */
export const ModifiedItemCard = ({
    original,
    current,
    modifiedByAddressId,
    isNewItem,
    addToStockImmediately,
    scheduledDate
}: ModifiedItemCardProps) => {
    const { t } = useTranslation();
    const { addresses } = useRestaurantStore();

    // Find address label if modified by specific address
    const modificationSourceLabel = modifiedByAddressId
        ? addresses.find(a => a.id === modifiedByAddressId)?.label || modifiedByAddressId
        : null;

    // Format scheduled date for display
    const formattedScheduledDate = scheduledDate
        ? new Date(scheduledDate).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
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
            className={`group bg-white dark:bg-slate-900 border ${isNewItem ? 'border-green-200 dark:border-green-800/50' : 'border-slate-100 dark:border-slate-800'} rounded-[2.5rem] p-6 transition-all hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none`}
        >
            <div className="flex flex-col gap-6">
                {/* Item Identity Header */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shrink-0 relative">
                        {current.image ? (
                            <img src={current.image} alt={current.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                <Tag className="w-6 h-6" />
                            </div>
                        )}
                        {/* New Item Badge */}
                        {isNewItem && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{current.name}</h4>
                            {isNewItem && (
                                <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full">
                                    {t('dashboard.menuEditor.review.newItem')}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                            {!isNewItem && (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{current.id}</p>
                            )}
                            {modificationSourceLabel && (
                                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">
                                    Modified at: {modificationSourceLabel}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* New Item Info or Changes Grid-style breakdown */}
                <div className="space-y-1">
                    {isNewItem ? (
                        <>
                            {/* New Item Details */}
                            <div className="flex items-center gap-2 mb-3">
                                <Plus className="w-3 h-3 text-green-500" />
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {t('dashboard.menuEditor.review.newItemDetails')}
                                </h5>
                            </div>
                            <div className="space-y-0.5">
                                {/* Core Info */}
                                <InfoLine label={t('dashboard.menuEditor.itemName')} value={current.name} />
                                <InfoLine label={t('dashboard.menuEditor.itemDescription')} value={current.description} />
                                <InfoLine label={t('dashboard.menuEditor.originalPrice')} value={current.itemPrice} suffix="₹" />
                                <InfoLine label={t('dashboard.menuEditor.taxAmount')} value={current.taxAmount} suffix="%" />
                                <InfoLine label={t('dashboard.menuEditor.packaging')} value={current.packagingCharges} suffix="₹" />

                                {/* Stock & Scheduling */}
                                <div className="flex items-center gap-3 text-[10px] md:text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                                    <span className="text-slate-400 w-28 shrink-0 font-medium">
                                        {t('dashboard.menuEditor.review.stockStatus')}
                                    </span>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {addToStockImmediately ? (
                                            <span className="text-green-500 font-bold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                {t('dashboard.menuEditor.review.inStockImmediately')}
                                            </span>
                                        ) : (
                                            <span className="text-orange-500 font-bold flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {t('dashboard.menuEditor.review.scheduledFor')}: {formattedScheduledDate}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Specs */}
                                <InfoLine label={t('dashboard.menuEditor.filter.dietaryPreference')} value={current.foodType} icon={Info} />
                                <InfoLine label="Service Type" value={current.serviceType} />
                                <InfoLine label="Consistency" value={current.itemType?.join(', ')} />
                                <InfoLine label="Frosting" value={current.isFrosting} />
                                <InfoLine label="Serves" value={current.serves} suffix=" ppl" />
                                <InfoLine label="Portion Size" value={current.portionSize} suffix=" pcs" />
                                <InfoLine label="Weight" value={current.weight} />
                                <InfoLine label="Max Qty" value={current.maxQuantity} />
                                <InfoLine label="Spice Level" value={current.spiceLevel} icon={Flame} />

                                {/* Tags & Allergens */}
                                <InfoLine
                                    label="Tags"
                                    value={current.tags?.filter(t => t !== 'none_of_these').join(', ')}
                                />
                                <InfoLine
                                    label="Allergens"
                                    value={current.allergens?.filter(a => a !== 'none_of_these').join(', ')}
                                />

                                {/* Nutritional Info */}
                                <InfoLine label="Calories" value={current.nutritionalInfo?.calories} suffix=" kcal" />
                                <InfoLine label="Protein" value={current.nutritionalInfo?.protein} />
                                <InfoLine label="Carbs" value={current.nutritionalInfo?.carbs} />
                                <InfoLine label="Fats" value={current.nutritionalInfo?.fats} />

                                {/* Availability */}
                                <div className="flex items-center gap-3 text-[10px] md:text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-none">
                                    <span className="text-slate-400 w-28 shrink-0 font-medium">
                                        Timing
                                    </span>
                                    <span className="text-slate-900 dark:text-slate-200 font-bold flex-1 truncate">
                                        {current.availability?.allDay ? 'All Day' : `${current.availability?.startTime} - ${current.availability?.endTime}`}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Existing Modifications Section */}
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

                                {/* Detailed Spec Changes */}
                                <ChangeLine label="Service Type" oldVal={original.serviceType} newVal={current.serviceType} />
                                <ChangeLine label="Consistency" oldVal={original.itemType?.join(', ')} newVal={current.itemType?.join(', ')} />
                                <ChangeLine label="Frosting" oldVal={original.isFrosting} newVal={current.isFrosting} />
                                <ChangeLine label="Serves" oldVal={original.serves} newVal={current.serves} suffix=" ppl" />
                                <ChangeLine label="Portion Size" oldVal={original.portionSize} newVal={current.portionSize} suffix=" pcs" />
                                <ChangeLine label="Weight" oldVal={original.weight} newVal={current.weight} />
                                <ChangeLine label="Max Qty" oldVal={original.maxQuantity} newVal={current.maxQuantity} />
                                <ChangeLine label="Spice Level" oldVal={original.spiceLevel} newVal={current.spiceLevel} />
                                <ChangeLine label="Tags" oldVal={original.tags?.join(', ')} newVal={current.tags?.join(', ')} />
                                <ChangeLine label="Allergens" oldVal={original.allergens?.join(', ')} newVal={current.allergens?.join(', ')} />

                                {/* Nutrition Changes */}
                                <ChangeLine label="Calories" oldVal={original.nutritionalInfo?.calories} newVal={current.nutritionalInfo?.calories} />
                                <ChangeLine label="Protein" oldVal={original.nutritionalInfo?.protein} newVal={current.nutritionalInfo?.protein} />
                                <ChangeLine label="Carbs" oldVal={original.nutritionalInfo?.carbs} newVal={current.nutritionalInfo?.carbs} />
                                <ChangeLine label="Fats" oldVal={original.nutritionalInfo?.fats} newVal={current.nutritionalInfo?.fats} />

                                {/* Availability Changes */}
                                <ChangeLine label="Avail. All Day" oldVal={original.availability?.allDay ? 'Yes' : 'No'} newVal={current.availability?.allDay ? 'Yes' : 'No'} />
                                <ChangeLine label="Avail. Start" oldVal={original.availability?.startTime} newVal={current.availability?.startTime} />
                                <ChangeLine label="Avail. End" oldVal={original.availability?.endTime} newVal={current.availability?.endTime} />

                                {/* Status Changes */}
                                <ChangeLine
                                    label={t('dashboard.menuEditor.statusLabel')}
                                    oldVal={original.status === 'blocked' ? t('dashboard.menuEditor.blocked') : t('common.active')}
                                    newVal={current.status === 'blocked' ? t('dashboard.menuEditor.blocked') : t('common.active')}
                                />

                                {/* Deletion Status */}
                                {original.isDeleted !== current.isDeleted && (
                                    <div className="flex items-center gap-3 text-[10px] md:text-xs py-1.5">
                                        <span className="text-slate-400 w-28 shrink-0 font-medium">{t('dashboard.menuEditor.deleteItem')}</span>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-red-500 font-bold uppercase tracking-widest">{t('dashboard.menuEditor.markedForDeletion')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
