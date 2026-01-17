import { motion } from 'framer-motion';
import { Tag, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type MenuItem, type FoodType } from '../../../../types/menuTypes';
import { useMenu } from '../../hooks/useMenu';

interface MenuItemCardProps {
    /** The menu item data to display */
    item: MenuItem;
}

/**
 * Marker component to display symbols for Veg, Non-Veg, and Egg items.
 */
const FoodTypeMarker = ({ type }: { type: FoodType }) => {
    const config = {
        veg: { color: 'border-green-600', dot: 'bg-green-600' },
        non_veg: { color: 'border-red-600', dot: 'bg-red-600' },
        contains_egg: { color: 'border-yellow-500', dot: 'bg-yellow-500' }
    };

    const target = config[type];

    return (
        <div className={`w-4 h-4 border-2 ${target.color} flex items-center justify-center rounded-sm p-[1px]`}>
            <div className={`w-full h-full ${target.dot} rounded-full`} />
        </div>
    );
};

/**
 * Individual card component for a menu item.
 * Displays item image, dietary preference marker, name, price breakdown, and status tags.
 * Uses framer-motion's layoutId for smooth layout transitions.
 */
export const MenuItemCard = ({ item }: MenuItemCardProps) => {
    const { t } = useTranslation();
    const { updateMenuItem, selectedCategoryId } = useMenu();

    /**
     * Toggles the food type of the item for testing purposes.
     * Cycles through Veg -> Egg -> Non-Veg
     */
    const handleToggleType = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCategoryId) return;

        const types: FoodType[] = ['veg', 'contains_egg', 'non_veg'];
        const currentIndex = types.indexOf(item.foodType);
        const nextType = types[(currentIndex + 1) % types.length];

        updateMenuItem(selectedCategoryId, item.id, { foodType: nextType });
    };

    // Calculate final price
    const finalPrice = item.itemPrice - item.discountAmount;

    return (
        <motion.div
            layoutId={item.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-6 group relative"
        >
            {/* Item Image with Discount Badge */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-1 p-2 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 leading-tight">
                            {t('dashboard.menuEditor.noImageShort')}
                        </span>
                    </div>
                )}
                {item.hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-lg">
                        <Tag className="w-4 h-4 fill-white" />
                    </div>
                )}
            </div>

            {/* Item Details: FoodType Marker, Name, Prices, and tags */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    {/* Food Type Marker - Clickable to cycle through types for testing */}
                    <div onClick={handleToggleType} className="cursor-pointer" title="Click to cycle food type">
                        <FoodTypeMarker type={item.foodType} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {item.name}
                    </h4>
                </div>

                {/* Item Description */}
                <p className={`text-sm mb-3 line-clamp-2 ${item.description ? 'text-slate-500 dark:text-slate-400' : 'text-orange-500 dark:text-orange-400 font-medium italic'}`}>
                    {item.description || t('dashboard.menuEditor.noDescription')}
                </p>

                {/* Missing Image Helper Text */}
                {!item.image && (
                    <p className="text-[10px] mb-3 text-orange-500 dark:text-orange-400 font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-md inline-block">
                        {t('dashboard.menuEditor.noImage')}
                    </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Final Purchase Price */}
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                        ₹{finalPrice}
                    </span>

                    {/* Original Price and Discount if applicable */}
                    {item.discountAmount > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 dark:text-slate-500 line-through font-bold">
                                ₹{item.itemPrice}
                            </span>
                            <span className="text-xs font-black text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                {t('dashboard.menuEditor.off', { amount: `₹${item.discountAmount}` })}
                            </span>
                        </div>
                    )}

                    <span className="text-slate-300 dark:text-slate-700">|</span>

                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {item.isCustomisable ? t('dashboard.menuEditor.customisable') : ''}
                    </span>

                    {item.hasDiscount && (
                        <Tag className="w-4 h-4 text-blue-500" />
                    )}
                </div>
            </div>

            {/* Action menu button */}
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <MoreVertical className="w-6 h-6 text-slate-400" />
            </button>
        </motion.div>
    );
};
