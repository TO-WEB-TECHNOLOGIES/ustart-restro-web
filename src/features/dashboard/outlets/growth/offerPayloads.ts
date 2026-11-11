import type { TFunction } from 'i18next';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';
import type {
    CreateRestaurantOfferRequest,
    OfferAudienceCode,
    RestaurantCustomerType,
} from '../../api/restaurantOffersApi';

/**
 * 2026-11-02: turns the growth screens' form values into restaurant-offer requests.
 * Why these choices:
 * - Outlets: the header's outlet picker. One outlet → that outlet; "All Locations" → every outlet,
 *   one offer each (the backend rejects outlets that aren't live, naming them).
 * - No promo code / name fields in the screens: they're generated, the same codes the review
 *   modal shows (FLAT50, PERCENT-20, ELITE-FLAT50, ELITE-PCT15).
 * - Payment types: every payment method (ALL); the screens don't ask.
 * - Dates: a date-only start runs from 00:00:00 and an end until 23:59:59 that day.
 */

/** Target-customer card id → backend audience within the restaurant's own customers. */
const CUSTOMER_TYPES: Record<string, RestaurantCustomerType> = {
    all: 'ALL_USERS',
    new: 'RESTAURANT_NEW_USERS',
    returning: 'RESTAURANT_REPEATED_USERS',
};

/** Outlets an offer is created for, from the header's outlet picker. */
export const useOfferOutletIds = (): string[] => {
    const { addresses, selectedAddressId } = useRestaurantStore();
    if (!selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID) {
        return addresses.map((a) => a.id);
    }
    return [selectedAddressId];
};

/**
 * Today as YYYY-MM-DD in the browser's time zone. toISOString() is UTC, which before 05:30 IST
 * still says yesterday, and the backend rejects a start before today.
 */
export const localToday = (): string => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const startOfDay = (date: string) => `${date}T00:00:00`;
export const endOfDay = (date: string) => `${date}T23:59:59`;

interface BaseValues {
    restroIds: string[];
    movType: string;
    startDate: string;
    endDate: string;
}

const base = (v: BaseValues) => ({
    restroIds: v.restroIds,
    applicableOnPaymentTypes: ['ALL'],
    minOrderAmount: Number(v.movType),
    startingDateTime: startOfDay(v.startDate),
    endingDateTime: endOfDay(v.endDate),
});

/** Flat Deals: flat ₹ off for the chosen customers. */
export const buildFlatOffer = (v: BaseValues & { targetCustomer: string; discountValue: number }): CreateRestaurantOfferRequest => ({
    ...base(v),
    audience: 0,
    offerName: `Flat ₹${v.discountValue} off`,
    promoCode: `FLAT${v.discountValue}`,
    applicableOnCustomerType: CUSTOMER_TYPES[v.targetCustomer] ?? 'ALL_USERS',
    specifications: [{ discountAmount: v.discountValue, isAbsolute: true }],
});

/** Percentage Discounts: % off for the chosen customers, optionally capped. */
export const buildPercentageOffer = (
    v: BaseValues & { targetCustomer: string; discountValue: number; maxDiscountAmount?: number },
): CreateRestaurantOfferRequest => ({
    ...base(v),
    audience: 0,
    offerName: `${v.discountValue}% off`,
    promoCode: `PERCENT-${v.discountValue}`,
    applicableOnCustomerType: CUSTOMER_TYPES[v.targetCustomer] ?? 'ALL_USERS',
    // The review says "up to ₹<max>" or, with no max, "up to ₹<MOV>"; the saved cap matches it.
    specifications: [{ discountAmount: v.discountValue, isAbsolute: false, capOfDiscountAmount: v.maxDiscountAmount ?? Number(v.movType) }],
});

/** Elite Exclusive: flat or % off for USTART Elite members only (audience 2). */
export const buildEliteOffer = (
    v: BaseValues & { discountType: 'flat' | 'percentage'; discountValue: number; maxDiscountAmount?: number },
): CreateRestaurantOfferRequest => {
    const isFlat = v.discountType === 'flat';
    const audience: OfferAudienceCode = 2;
    return {
        ...base(v),
        audience,
        offerName: isFlat ? `Elite ₹${v.discountValue} off` : `Elite ${v.discountValue}% off`,
        promoCode: isFlat ? `ELITE-FLAT${v.discountValue}` : `ELITE-PCT${v.discountValue}`,
        applicableOnCustomerType: 'ALL_USERS',
        specifications: [isFlat
            ? { discountAmount: v.discountValue, isAbsolute: true }
            : { discountAmount: v.discountValue, isAbsolute: false, capOfDiscountAmount: v.maxDiscountAmount ?? Number(v.movType) }],
    };
};

/**
 * Translation key for a template's audience. Templates only use the restaurant audiences (the
 * backend enforces it); anything else reads as "all customers".
 */
export const customerTypeLabelKey = (customerType: string): string => {
    const base = 'dashboard.offers.customerDelightersDetails.flatDeals.targetCustomerSelection.';
    if (customerType === 'RESTAURANT_NEW_USERS') return `${base}newCustomers`;
    if (customerType === 'RESTAURANT_REPEATED_USERS') return `${base}returningCustomers`;
    return `${base}allCustomers`;
};

/**
 * A template's one-line description in the current language. The backend description is typed by
 * an admin in one language, so the screens build it from the numbers instead.
 */
export const templateDescription = (
    t: TFunction,
    template: { discountAmount: number | null; isAbsolute: boolean | null; capOfDiscountAmount: number | null; minOrderAmount: number },
): string => {
    const mov = template.minOrderAmount;
    if (template.isAbsolute) {
        return t('dashboard.offers.activation.flatDesc', { value: template.discountAmount, mov });
    }
    return template.capOfDiscountAmount
        ? t('dashboard.offers.activation.percentageDesc', { value: template.discountAmount, cap: template.capOfDiscountAmount, mov })
        : t('dashboard.offers.activation.percentageDescUncapped', { value: template.discountAmount, mov });
};
