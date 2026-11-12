/**
 * 2026-11-12: weekday helpers for the Outlet Schedule page. Day numbers follow the schedule API
 * (0 = Sunday ... 6 = Saturday), which is also JavaScript's Date.getDay().
 */
export const WEEKDAY_KEYS = [
    'onboarding.restaurant.complete.schedule.days.sunday',
    'onboarding.restaurant.complete.schedule.days.monday',
    'onboarding.restaurant.complete.schedule.days.tuesday',
    'onboarding.restaurant.complete.schedule.days.wednesday',
    'onboarding.restaurant.complete.schedule.days.thursday',
    'onboarding.restaurant.complete.schedule.days.friday',
    'onboarding.restaurant.complete.schedule.days.saturday',
];

/** The 7 weekdays starting from today. */
export const weekFromToday = (today = new Date()) => Array.from({ length: 7 }, (_, i) => (today.getDay() + i) % 7);

/** The next date (today included) that falls on this weekday, at 00:00. */
export const nextDateOf = (dayOfWeek: number, today = new Date()) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + ((dayOfWeek - today.getDay() + 7) % 7));
    return date;
};
