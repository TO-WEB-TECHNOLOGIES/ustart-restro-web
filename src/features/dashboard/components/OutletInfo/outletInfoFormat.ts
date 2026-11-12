import type { RestaurantStatus } from '../../api/outletInfoApi';

/**
 * 2026-11-12: display helpers for the Outlet Info page.
 */

/** Status chip colours, the same tone family as the Outlet Schedule pills (emerald/amber/rose/slate). */
export const STATUS_CHIP: Record<RestaurantStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50',
    APPROVAL_PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50',
    UPDATE_APPROVAL_PENDING: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50',
    APPROVED_BUT_MENU_PENDING: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-900/50',
    ACTION_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-900/50',
    ON_HOLD: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    RESTRICTED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50',
    BLOCKED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50',
};

/** Statuses the backend sends for review after an edit; the page shows a "waiting for approval" note. */
export const isAwaitingApproval = (status: string) =>
    status === 'APPROVAL_PENDING' || status === 'UPDATE_APPROVAL_PENDING';

/**
 * Outlet addresses are stored pipe-joined ("line1|line2|landmark|city|state|pincode"); older ones
 * are plain text. Either way: non-empty parts joined with commas.
 */
export const formatAddress = (address?: string | null) =>
    (address ?? '').split('|').map((part) => part.trim()).filter(Boolean).join(', ');

/** Google Maps link from "lat:lng" (the outlet's pin); null when there are no coordinates. */
export const mapsLink = (coordinates?: string | null) => {
    const [lat, lng] = (coordinates ?? '').split(':');
    return lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
};

export const formatRupees = (value: number | undefined | null, locale: string) =>
    value == null ? null : `₹${value.toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN')}`;

/**
 * 2026-11-12 (user request: no decimals on the commission cards): whole rupees, e.g. 149.00 → ₹149.
 * Order-value bands use ceil for a lower bound (149.01 → ₹150, the first rupee of the band) and floor
 * for an upper one, so neighbouring bands read as ≤ ₹149 / ₹150 – ₹249.
 */
const LOCALE = (locale: string) => (locale === 'hi' ? 'hi-IN' : 'en-IN');
export const wholeRupees = (value: number | undefined | null, locale: string, round: 'ceil' | 'floor' | 'round' = 'round') =>
    `₹${Math[round](value ?? 0).toLocaleString(LOCALE(locale), { maximumFractionDigits: 0 })}`;
