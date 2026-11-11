/**
 * 2026-11-02: shared by the two offer review dialogs and the growth screens. Kept out of the
 * dialog files because react-refresh's only-export-components rule (an error in this repo's lint
 * config) fails a component file that also exports helpers.
 */

/**
 * What the growth screens show before activating an offer. isAbsolute uses the backend's
 * meaning: true = flat ₹ off, false = percentage (the screens had it inverted before).
 */
export interface ReviewDeal {
  id?: string;
  promo: string;
  desc: string;
  discountValue?: number;
  minOrderAmount?: number;
  capOfDiscountAmount?: number;
  isAbsolute?: boolean;
  targetCustomers?: string;
}

/** Days covered by [start, end], counting both ends (a one-day deal is 1 day). */
export const offerDays = (startDate: Date, endDate: Date) => {
  const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isNaN(diffDays) || diffDays === 0 ? 1 : diffDays;
};
