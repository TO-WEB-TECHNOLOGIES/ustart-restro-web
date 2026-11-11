import type { MenuItem } from '@/types/menuTypes';

/**
 * 2026-11-11: a dish's price after its own discount (before packaging and tax), as the menu
 * cards show it. Moved out of MenuItemCard so the variant cards use the same formula.
 */
export const itemFinalPrice = (item: MenuItem): number => {
    const discountValue = item.discountIsAbsolute
        ? item.discountAmount
        : (item.itemPrice * item.discountAmount) / 100;
    return item.itemPrice - discountValue;
};
