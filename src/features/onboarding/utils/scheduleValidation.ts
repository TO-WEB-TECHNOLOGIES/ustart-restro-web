import type { RestroDay, TimeSlot } from "@/types/restaurantTypes";

const ensureTimeFormat = (time: string) => {
    if (!time) return "";
    const parts = time.split(":");
    if (parts.length === 2) return `${time}:00`;
    return time;
};

const hasOverlappingTimeSlots = (schedules: TimeSlot[]) => {
    if (!schedules || schedules.length < 2) return false;
    const sorted = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        if (ensureTimeFormat(current.endTime) > ensureTimeFormat(next.startTime)) {
            return true;
        }
    }
    return false;
};

/**
 * Same three checks BulkScheduleModal.tsx's validateAll already applies per-restaurant
 * (at least one open day, close > open, no overlapping slots within a day) - factored out
 * here so the onboarding "about" view's operating/dining-hours zod validation can reuse the
 * exact same rules instead of reimplementing them. Returns an error message, or null if valid.
 */
export const validateScheduleDays = (days: RestroDay[]): string | null => {
    const hasOpenDay = days.some((d) => !d.isClosed);
    if (!hasOpenDay) return "At least one day must be open";

    const hasInvalidTimes = days.some(
        (d) => !d.isClosed && d.schedules?.some((s) => s.startTime && s.endTime && s.startTime >= s.endTime),
    );
    if (hasInvalidTimes) return "Close time must be after Open time";

    const hasOverlaps = days.some((d) => !d.isClosed && hasOverlappingTimeSlots(d.schedules || []));
    if (hasOverlaps) return "Time slots cannot overlap";

    return null;
};

/**
 * A fresh, all-closed 7-day array (Sunday=0..Saturday=6) - the default shape both the store's
 * initial state and RestaurantInfo.tsx's "about" form defaultValues fall back to before the
 * user has configured any hours. Deliberately all-closed rather than a prefilled 9-22 default,
 * so operatingHours' "at least one open day" validation forces an explicit choice.
 */
export const createDefaultScheduleDays = (): RestroDay[] =>
    Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isClosed: true, schedules: [] }));
