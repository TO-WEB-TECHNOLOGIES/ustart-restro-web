import { motion } from 'framer-motion';
import { Tag, MoreVertical } from 'lucide-react';
import { type MenuItem } from '../../../../types/menuTypes';
import { useMenu } from '../../hooks/useMenu';

interface MenuItemCardProps {
    /** The menu item data to display */
    item: MenuItem;
}

/**
 * Individual card component for a menu item.
 * Displays item image, dietary preference (Veg), name, price, and status tags.
 * Uses framer-motion's layoutId for smooth layout transitions.
 */
export const MenuItemCard = ({ item }: MenuItemCardProps) => {
    const { updateMenuItem, selectedCategoryId } = useMenu();

    /**
     * Toggles the vegetarian status of the item.
     * This marks the store as dirty and saves the change to session storage.
     */
    const handleToggleVeg = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedCategoryId) {
            updateMenuItem(selectedCategoryId, item.id, { isVeg: !item.isVeg });
        }
    };

    return (
        <motion.div
            layoutId={item.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group relative"
        >
            {/* Item Image with Discount Badge */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0">
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {item.hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-lg">
                        <Tag className="w-4 h-4 fill-white" />
                    </div>
                )}
            </div>

            {/* Item Details: Veg Indicator, Name, Price, and tags */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    {/* Vegetarian Indicator - Clickable to test state changes */}
                    <div
                        onClick={handleToggleVeg}
                        className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm p-[1px] cursor-pointer transition-colors ${item.isVeg ? 'border-green-600' : 'border-slate-300 dark:border-slate-600'
                            }`}
                        title="Click to toggle Veg/Non-Veg"
                    >
                        {item.isVeg && <div className="w-full h-full bg-green-600 rounded-full" />}
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {item.name}
                    </h4>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-slate-900 dark:text-white">₹{item.price}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {item.isCustomisable ? 'customisable' : ''}
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
