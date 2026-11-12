import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/api/restaurantService';
import type { RestroDay } from '@/types/restaurantTypes';
import {
    type HolidayRequest,
    addHoliday,
    endOrCancelClosure,
    fetchClosureHistory,
    fetchOutletStatuses,
    fetchOutletSummary,
    fetchUpcomingClosures,
    pauseOutlet,
    resumeOutlet,
} from '../api/outletStatusApi';

/**
 * 2026-11-12: server state for outlet status (header, home card, Outlet Schedule page).
 * TanStack Query, like the offers screens. Every key starts with OUTLET_STATUS_KEY so one
 * invalidation refreshes everything after a write, and logout drops it all (AuthContext).
 * Status depends on the clock (hours start and end), so status queries re-fetch every minute.
 */
export const OUTLET_STATUS_KEY = 'outletStatus';
const REFRESH_MS = 60_000;
const LIST_PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 10;

/** One outlet's status; null = none selected. */
export const useOutletLiveStatus = (restroId: string | null) =>
    useQuery({
        queryKey: [OUTLET_STATUS_KEY, 'item', restroId],
        queryFn: async () => (await fetchOutletStatuses({ restroId: restroId! })).items[0] ?? null,
        enabled: restroId !== null,
        refetchInterval: REFRESH_MS,
        staleTime: 30_000,
    });

export const useOutletSummary = (enabled: boolean) =>
    useQuery({
        queryKey: [OUTLET_STATUS_KEY, 'summary'],
        queryFn: fetchOutletSummary,
        enabled,
        refetchInterval: REFRESH_MS,
        staleTime: 30_000,
    });

/** The brand's outlets for the "All Locations" sidebar, searched on the server and paged. */
export const useOutletStatusList = (search: string, enabled: boolean) =>
    useInfiniteQuery({
        queryKey: [OUTLET_STATUS_KEY, 'list', search],
        queryFn: ({ pageParam }) => fetchOutletStatuses({ search: search || undefined, page: pageParam, size: LIST_PAGE_SIZE }),
        initialPageParam: 0,
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
        enabled,
        refetchInterval: REFRESH_MS,
    });

export const useUpcomingClosures = (restroId: string) =>
    useQuery({
        queryKey: [OUTLET_STATUS_KEY, 'closures', restroId, 'upcoming'],
        queryFn: () => fetchUpcomingClosures(restroId),
    });

export const useClosureHistory = (restroId: string, enabled: boolean) =>
    useInfiniteQuery({
        queryKey: [OUTLET_STATUS_KEY, 'closures', restroId, 'history'],
        queryFn: ({ pageParam }) => fetchClosureHistory(restroId, pageParam, HISTORY_PAGE_SIZE),
        initialPageParam: 0,
        getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
        enabled,
    });

/**
 * The outlet's weekly hours (existing /schedules API). An outlet without a schedule answers 400;
 * that's shown as "no hours yet" (null), not as an error.
 */
export const useOutletSchedule = (restroId: string) =>
    useQuery({
        queryKey: [OUTLET_STATUS_KEY, 'schedule', restroId],
        queryFn: async () => {
            try {
                return (await restaurantService.getSchedule(restroId)).data.days;
            } catch (error) {
                if ((error as { response?: { status?: number } })?.response?.status === 400) return null;
                throw error;
            }
        },
    });

/** Every write changes some outlet's status, so each one refreshes the whole prefix. */
const useStatusWrite = <TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [OUTLET_STATUS_KEY] }),
    });
};

export const usePauseOutlet = () => useStatusWrite((restroId: string) => pauseOutlet(restroId));
export const useResumeOutlet = () => useStatusWrite((restroId: string) => resumeOutlet(restroId));
export const useAddHoliday = () =>
    useStatusWrite(({ restroId, request }: { restroId: string; request: HolidayRequest }) => addHoliday(restroId, request));
export const useEndClosure = () =>
    useStatusWrite(({ restroId, closureId }: { restroId: string; closureId: number }) => endOrCancelClosure(restroId, closureId));
/** One day's hours (PATCH sends only that day); the status refreshes since hours drive it. */
export const useSaveScheduleDay = () =>
    useStatusWrite(({ restroId, day }: { restroId: string; day: RestroDay }) =>
        restaurantService.updateSchedule(restroId, { days: [day] }));
