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

/**
 * 2026-11-12 (user request): the day cards are a fixed Sunday → Saturday row, not "the next 7 days
 * from today". Hours are set per weekday and repeat every week, so a fixed order reads as the
 * weekly timetable; today is still tagged on its card. Same order as the onboarding schedule
 * editor and the API's dayOfWeek numbers.
 */
export const WEEK_ORDER = [0, 1, 2, 3, 4, 5, 6];
