import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CalendarClock, Wifi, WifiOff } from 'lucide-react';
import { ALL_LOCATIONS_ID } from '@/types/storeTypes';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { useOutletLiveStatus, useOutletSummary } from '../hooks/useOutletStatus';
import type { OutletStatusItem, OutletSummary } from '../api/outletStatusApi';
import { OutletToggle } from './OutletSchedule/OutletToggle';
import { TONE_CLASSES, describeStatus } from './OutletSchedule/outletTime';

/**
 * Outlet status in the header (compact) and on the home page (card).
 * 2026-11-12: real data from /api/v1/outlet-status instead of the mock service. One outlet
 * selected: its live state ("Open · till 11 pm", "Paused till ...") and the open/closed switch
 * (OutletToggle: pause / resume / end holiday). "All Locations": open / closed counts with a link
 * to the Outlet Schedule page, where each outlet has its own switch (this replaces the old TODO
 * about a "view all" modal).
 */
interface OutletStatusProps {
    compact?: boolean;
}

const SCHEDULE_PATH = '/dashboard/status';

export const OutletStatus = ({ compact = false }: OutletStatusProps) => {
    const selectedAddressId = useRestaurantStore(state => state.selectedAddressId);
    const isAll = !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID;
    const summary = useOutletSummary(isAll);
    const single = useOutletLiveStatus(isAll ? null : selectedAddressId);

    if (isAll) {
        return compact
            ? <CompactCounts summary={summary.data} isLoading={summary.isLoading} isError={summary.isError} />
            : <CountsCard summary={summary.data} isLoading={summary.isLoading} isError={summary.isError} />;
    }
    return compact
        ? <CompactSingle item={single.data ?? null} isLoading={single.isLoading} isError={single.isError} />
        : <SingleCard item={single.data ?? null} isLoading={single.isLoading} isError={single.isError} />;
};

const ErrorNote = ({ floating }: { floating?: boolean }) => {
    const { t } = useTranslation();
    return (
        <div className={`p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs ${floating ? 'absolute top-full left-0 right-0 z-50 mt-1 shadow-lg' : 'mb-3'}`}>
            <AlertCircle className="w-3 h-3 shrink-0" />
            <p>{t('dashboard.statusError')}</p>
        </div>
    );
};

const Spinner = () => (
    <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700 border-t-slate-500 rounded-full animate-spin" />
);

interface CountsProps {
    summary?: OutletSummary;
    isLoading: boolean;
    isError: boolean;
}

const CompactCounts = ({ summary, isLoading, isError }: CountsProps) => {
    const { t } = useTranslation();
    return (
        <Link to={SCHEDULE_PATH} className="relative flex items-center gap-2" aria-label={t('dashboard.outletSchedule.manage')}>
            {isError && <ErrorNote floating />}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${TONE_CLASSES.open.pill}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-sm font-bold ${TONE_CLASSES.open.text}`}>{t('dashboard.openCount', { count: summary?.openCount ?? 0 })}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${TONE_CLASSES.closed.pill}`}>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className={`text-sm font-bold ${TONE_CLASSES.closed.text}`}>{t('dashboard.closedCount', { count: summary?.closedCount ?? 0 })}</span>
            </div>
            {isLoading && <Spinner />}
        </Link>
    );
};

const CountsCard = ({ summary, isLoading, isError }: CountsProps) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden">
            {isError && <ErrorNote />}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <Wifi className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('dashboard.statusOverview')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('dashboard.summaryAll')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {(['open', 'closed'] as const).map((tone) => (
                        <div key={tone} className={`flex items-center gap-3 px-4 py-2 rounded-xl border min-w-[120px] justify-center ${TONE_CLASSES[tone].pill}`}>
                            {isLoading ? (
                                <div className="w-16 h-6 bg-slate-200/60 dark:bg-slate-700/50 animate-pulse rounded" />
                            ) : (
                                <>
                                    <span className={`w-2.5 h-2.5 rounded-full ${TONE_CLASSES[tone].dot} ${tone === 'open' ? 'animate-pulse' : ''}`} />
                                    <span className={`text-lg font-bold ${TONE_CLASSES[tone].text}`}>
                                        {tone === 'open'
                                            ? t('dashboard.openCount', { count: summary?.openCount ?? 0 })
                                            : t('dashboard.closedCount', { count: summary?.closedCount ?? 0 })}
                                    </span>
                                </>
                            )}
                        </div>
                    ))}
                    <ManageLink />
                </div>
            </div>
        </div>
    );
};

const ManageLink = () => {
    const { t } = useTranslation();
    return (
        <Link
            to={SCHEDULE_PATH}
            className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
        >
            <CalendarClock className="w-4 h-4" />
            {t('dashboard.outletSchedule.manage')}
        </Link>
    );
};

interface SingleProps {
    item: OutletStatusItem | null;
    isLoading: boolean;
    isError: boolean;
}

const CompactSingle = ({ item, isLoading, isError }: SingleProps) => {
    const { t, i18n } = useTranslation();
    if (!item) {
        return (
            <div className="relative flex items-center gap-3">
                {isError && <ErrorNote floating />}
                {isLoading && <Spinner />}
            </div>
        );
    }
    const { label, tone } = describeStatus(t, item.status, i18n.language);
    return (
        <div className={`relative flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border ${TONE_CLASSES[tone].pill}`}>
            {isError && <ErrorNote floating />}
            <span className={`w-2 h-2 rounded-full ${TONE_CLASSES[tone].dot} ${tone === 'open' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-bold whitespace-nowrap ${TONE_CLASSES[tone].text}`}>{label}</span>
            <OutletToggle item={item} />
        </div>
    );
};

const SingleCard = ({ item, isLoading, isError }: SingleProps) => {
    const { t, i18n } = useTranslation();
    const isOpen = item?.status.isOpen ?? false;
    const described = item ? describeStatus(t, item.status, i18n.language) : null;
    const tone = described?.tone ?? 'muted';
    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 border shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 ${isOpen
            ? 'border-emerald-100 dark:border-emerald-900/50 shadow-emerald-100/50 dark:shadow-none'
            : 'border-rose-100 dark:border-rose-900/50 shadow-rose-100/50 dark:shadow-none'}`}>
            {isError && <ErrorNote />}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${TONE_CLASSES[tone].dot}`} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                        {isOpen ? <Wifi className="w-7 h-7" /> : <WifiOff className="w-7 h-7" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {item?.restroName ?? t('dashboard.outletStatus')}
                        </h3>
                        {described ? (
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${TONE_CLASSES[tone].dot}`} />
                                </span>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{described.label}</p>
                            </div>
                        ) : (
                            <div className="w-40 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    {item && (
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
                            <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {t('dashboard.acceptingOrders')}
                            </span>
                            <OutletToggle
                                item={item}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
                            />
                        </div>
                    )}
                    <ManageLink />
                </div>
            </div>
            {isLoading && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-secondary-orange animate-progress" style={{ width: '100%' }} />
                </div>
            )}
        </div>
    );
};
