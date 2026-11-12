import type { TFunction } from 'i18next';
import type { OutletLiveStatus } from '../../api/outletStatusApi';

/**
 * 2026-11-12: date/time text and status wording for the outlet status UI. The backend sends IST
 * wall times without an offset; `new Date("2026-11-12T23:00:00")` reads them as local time, which is
 * IST for partners. Formatting follows the UI language (en-IN / hi-IN).
 */
const locale = (lang: string) => (lang.startsWith('hi') ? 'hi-IN' : 'en-IN');

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatTime = (value: string | Date, lang: string) =>
    new Date(value).toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' });

/** "6:00 pm" today, otherwise "Fri, 13 Nov, 6:00 pm". */
export const formatWhen = (value: string, lang: string) => {
    const date = new Date(value);
    if (isSameDay(date, new Date())) return formatTime(date, lang);
    return date.toLocaleString(locale(lang), { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

/** "13 Nov, 6:00 pm" - for holiday ranges. */
export const formatDateTime = (value: string, lang: string) =>
    new Date(value).toLocaleString(locale(lang), { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** "HH:mm:ss" slot time → "6:00 pm". */
export const formatSlotTime = (time: string, lang: string) => {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return formatTime(date, lang);
};

/** Date → "YYYY-MM-DDTHH:mm" in local time (datetime-local inputs and the holiday API). */
export const toInputValue = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export type StatusTone = 'open' | 'closed' | 'paused' | 'muted';

/** The status as one line ("Open · till 11:00 pm", "Paused till 6:00 pm", ...) and its colour. */
export const describeStatus = (t: TFunction, status: OutletLiveStatus, lang: string): { label: string; tone: StatusTone } => {
    const k = 'dashboard.outletSchedule.state.';
    switch (status.state) {
        case 'OPEN':
            return {
                label: status.closesAt ? t(`${k}openUntil`, { time: formatWhen(status.closesAt, lang) }) : t(`${k}open`),
                tone: 'open',
            };
        case 'PAUSED':
            return { label: t(`${k}pausedUntil`, { time: formatWhen(status.activeClosure!.endsAt, lang) }), tone: 'paused' };
        case 'ON_HOLIDAY':
            return { label: t(`${k}holidayUntil`, { time: formatWhen(status.activeClosure!.endsAt, lang) }), tone: 'paused' };
        case 'CLOSED_BY_SCHEDULE':
            return {
                label: status.opensAt ? t(`${k}closedOpens`, { time: formatWhen(status.opensAt, lang) }) : t(`${k}closed`),
                tone: 'closed',
            };
        case 'NOT_LIVE':
            return { label: t(`${k}notLive`), tone: 'muted' };
        default:
            return { label: t(`${k}noSchedule`), tone: 'muted' };
    }
};

/** Pill / dot classes per tone (light + dark), shared by the header, home card and sidebar. */
export const TONE_CLASSES: Record<StatusTone, { pill: string; dot: string; text: string }> = {
    open: {
        pill: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
    },
    paused: {
        pill: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-500/20',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
    },
    closed: {
        pill: 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-500/20',
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-400',
    },
    muted: {
        pill: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
        text: 'text-slate-600 dark:text-slate-400',
    },
};
