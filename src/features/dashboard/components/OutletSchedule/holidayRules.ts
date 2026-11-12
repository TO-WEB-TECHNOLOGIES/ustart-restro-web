import type { TFunction } from 'i18next';
import * as z from 'zod';

/**
 * 2026-11-12: holiday limits, the same as the backend's HolidayRules (product decisions): at least
 * 2 hours, at most 30 days, not in the past (a minute late is fine), start and end within the
 * current calendar year. Checked here so the form never sends what the API would reject.
 */
export const MIN_HOLIDAY_MS = 2 * 60 * 60 * 1000;
export const MAX_HOLIDAY_MS = 30 * 24 * 60 * 60 * 1000;
const START_GRACE_MS = 60 * 1000;

export type HolidayErrorKey = 'required' | 'past' | 'endBeforeStart' | 'tooShort' | 'tooLong' | 'currentYear';

/** First broken rule for "YYYY-MM-DDTHH:mm" values, or null. */
export const holidayError = (startsAt: string, endsAt: string, now = new Date()): HolidayErrorKey | null => {
    if (!startsAt || !endsAt) return 'required';
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'required';
    if (start.getTime() < now.getTime() - START_GRACE_MS) return 'past';
    if (end <= start) return 'endBeforeStart';
    const length = end.getTime() - start.getTime();
    if (length < MIN_HOLIDAY_MS) return 'tooShort';
    if (length > MAX_HOLIDAY_MS) return 'tooLong';
    if (start.getFullYear() !== now.getFullYear() || end.getFullYear() !== now.getFullYear()) return 'currentYear';
    return null;
};

/** `max` for the date-time inputs: the last minute of this year. */
export const yearEndInputValue = (now = new Date()) => `${now.getFullYear()}-12-31T23:59`;

export const createHolidaySchema = (t: TFunction) =>
    z
        .object({
            startsAt: z.string(),
            endsAt: z.string(),
            reason: z.string().max(200, t('dashboard.outletSchedule.holiday.errors.reasonTooLong')),
        })
        .superRefine((value, ctx) => {
            const key = holidayError(value.startsAt, value.endsAt);
            if (key) {
                ctx.addIssue({
                    code: 'custom',
                    path: [key === 'past' ? 'startsAt' : 'endsAt'],
                    message: t(`dashboard.outletSchedule.holiday.errors.${key}`, { year: new Date().getFullYear() }),
                });
            }
        });
