import type { TFunction } from 'i18next';
import type { RestaurantOfferDTO } from '../../api/restaurantOffersApi';

/**
 * 2026-11-11: helpers for the My Offers page (outlets/offers/MyOffers.tsx). Kept out of the
 * component files because react-refresh/only-export-components forbids helper exports there.
 *
 * Dates from the backend are local "YYYY-MM-DDTHH:mm:ss" strings (IST, no zone); `new Date()` parses
 * that form as local time, which matches for partners in India - same assumption as the create
 * screens (offerPayloads.ts).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PAGE = 20;

/** History shows this many rows at a time ("Show more" adds another page). */
export const HISTORY_PAGE_SIZE = PAGE;

const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Whole calendar days from `from` to `to` (0 = same day). */
const calendarDaysBetween = (from: Date, to: Date) =>
    Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / MS_PER_DAY);

/**
 * The offer's main line: "₹50 OFF", "10% OFF up to ₹100", "Buy 2 get 1 free", "Free delivery".
 * Offers made by the app have one rule; if there are several, the first one speaks for the offer.
 */
export const offerHeadline = (t: TFunction, offer: RestaurantOfferDTO): string => {
    const rule = offer.specifications?.[0];
    const k = 'dashboard.offers.myOffers.headline.';
    if (!rule) return offer.offerName;
    if (rule.itemsToBePurchased && rule.itemToGetForFree) {
        return t(`${k}bxgy`, { buy: rule.itemsToBePurchased, free: rule.itemToGetForFree });
    }
    if (rule.discountAmount != null && rule.isAbsolute) {
        return t(`${k}flat`, { value: rule.discountAmount });
    }
    if (rule.discountAmount != null) {
        const pct = t(`${k}percent`, { value: rule.discountAmount });
        return rule.capOfDiscountAmount ? `${pct} ${t(`${k}upTo`, { cap: rule.capOfDiscountAmount })}` : pct;
    }
    if (rule.isDeliveryFree) return t(`${k}freeDelivery`);
    return offer.offerName;
};

/** "12 Nov – 27 Nov" (with the year in history, where offers span months). */
export const offerDateRange = (offer: RestaurantOfferDTO, locale: string, withYear = false): string => {
    const opts: Intl.DateTimeFormatOptions = withYear
        ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'short' };
    const fmt = (s: string) => new Date(s).toLocaleDateString(locale, opts);
    return `${fmt(offer.startingDateTime)} – ${fmt(offer.endingDateTime)}`;
};

/** Number of calendar days the offer ran (or runs), counting both ends, as the review modals do. */
export const offerLengthDays = (offer: RestaurantOfferDTO): number =>
    calendarDaysBetween(new Date(offer.startingDateTime), new Date(offer.endingDateTime)) + 1;

/** "9 days left" / "Ends today" / "Starts in 2 days" / "Starts today" for an active offer. */
export const offerTimingLabel = (t: TFunction, offer: RestaurantOfferDTO, now = new Date()): string => {
    const k = 'dashboard.offers.myOffers.timing.';
    if (offer.status === 'UPCOMING') {
        const days = calendarDaysBetween(now, new Date(offer.startingDateTime));
        return days <= 0 ? t(`${k}startsToday`) : t(`${k}startsIn`, { count: days });
    }
    const days = calendarDaysBetween(now, new Date(offer.endingDateTime));
    return days <= 0 ? t(`${k}endsToday`) : t(`${k}daysLeft`, { count: days });
};

/**
 * "End now" is only offered once the offer has started: the backend refuses an end before the
 * start ("pause an upcoming offer instead"). A paused offer that already started can be ended.
 */
export const canEndNow = (offer: RestaurantOfferDTO, now = new Date()): boolean =>
    offer.status !== 'ENDED' && new Date(offer.startingDateTime) <= now;

/** Now as the backend's local "YYYY-MM-DDTHH:mm:ss" (it clamps a slightly late value to now). */
export const localNowString = (now = new Date()): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
        + `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

// Active tab order: live first (ending soonest on top), then upcoming (starting soonest), then paused.
const ACTIVE_RANK: Record<string, number> = { LIVE: 0, UPCOMING: 1, PAUSED: 2 };

/** Splits one list into the two tabs: active (not ended) and history (ended, newest first). */
export const splitOffers = (offers: RestaurantOfferDTO[]) => {
    const active = offers
        .filter((o) => o.status !== 'ENDED')
        .sort((a, b) => {
            const rank = ACTIVE_RANK[a.status] - ACTIVE_RANK[b.status];
            if (rank !== 0) return rank;
            const key = a.status === 'UPCOMING' ? 'startingDateTime' : 'endingDateTime';
            return new Date(a[key]).getTime() - new Date(b[key]).getTime();
        });
    const history = offers
        .filter((o) => o.status === 'ENDED')
        .sort((a, b) => new Date(b.endingDateTime).getTime() - new Date(a.endingDateTime).getTime());
    return { active, history };
};
