import type { MenuItem } from '@/types/menuTypes';

/**
 * 2026-11-11: unsaved edits on the Item Level Discount page. A dish's discount is the menu price
 * discount of the selected outlet (menu_item_prices), saved straight away like /menu/charges - no
 * dates, not an offer. Only changed dishes are kept; a dish edited back to its saved value drops out.
 * Limits mirror the backend (MenuItemRowWriter.validateDiscount): ≥ 0, % ≤ 100, ₹ below the price.
 */
export interface DiscountEdit {
    itemId: number;
    name: string;
    price: number;
    discount: string; // as typed; '' = 0
    isAbsolute: boolean;
    saved: { discount: number; isAbsolute: boolean };
}

export type DiscountError = 'invalidNumber' | 'maxPercent' | 'belowPrice';

/** The row's values: the unsaved edit if there is one, else what's saved. */
export const rowValues = (item: MenuItem, edit?: DiscountEdit) => ({
    discount: edit ? edit.discount : String(item.discountAmount || 0),
    isAbsolute: edit ? edit.isAbsolute : item.discountIsAbsolute,
});

/** The edit after a change, or null when it's back to the saved value. */
export const applyChange = (
    item: MenuItem,
    edit: DiscountEdit | undefined,
    change: { discount?: string; isAbsolute?: boolean },
): DiscountEdit | null => {
    const current = rowValues(item, edit);
    const next: DiscountEdit = {
        itemId: item.id,
        name: item.name,
        price: item.itemPrice,
        discount: change.discount ?? current.discount,
        isAbsolute: change.isAbsolute ?? current.isAbsolute,
        saved: edit?.saved ?? { discount: item.discountAmount || 0, isAbsolute: item.discountIsAbsolute },
    };
    const amount = parseDiscount(next.discount);
    const unchanged = amount === next.saved.discount && (amount === 0 || next.isAbsolute === next.saved.isAbsolute);
    return unchanged ? null : next;
};

/** '' → 0; anything not a number → NaN (shown as an error). */
export const parseDiscount = (value: string): number => (value.trim() === '' ? 0 : Number(value));

export const validateDiscount = (discount: string, isAbsolute: boolean, price: number): DiscountError | null => {
    const amount = parseDiscount(discount);
    if (!Number.isFinite(amount) || amount < 0) return 'invalidNumber';
    if (!isAbsolute && amount > 100) return 'maxPercent';
    if (isAbsolute && amount > 0 && amount >= price) return 'belowPrice';
    return null;
};

/** Price after the discount, as the backend computes it (never below 0), to 2 decimals. */
export const finalPrice = (price: number, discount: string, isAbsolute: boolean): number => {
    const amount = parseDiscount(discount);
    if (!Number.isFinite(amount)) return price;
    const raw = isAbsolute ? price - amount : price * (1 - amount / 100);
    return Math.max(0, Math.round(raw * 100) / 100);
};
