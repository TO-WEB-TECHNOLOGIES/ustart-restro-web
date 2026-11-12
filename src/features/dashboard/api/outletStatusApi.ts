import { api } from '@/api/axios';

/**
 * 2026-11-12: outlet live status, pause/resume and holidays (backend contract:
 * ustart-backend docs/integration-docs/outlet-status.md). Times are IST wall times without an
 * offset ("2026-11-12T23:00:00"); the browser reads them as local time, which is IST for partners.
 */
const BASE = '/api/v1/outlet-status';

export type OutletState = 'OPEN' | 'CLOSED_BY_SCHEDULE' | 'PAUSED' | 'ON_HOLIDAY' | 'NOT_LIVE' | 'NO_SCHEDULE';
export type ClosureType = 'HOLIDAY' | 'PAUSE';
export type ClosureState = 'ACTIVE' | 'UPCOMING' | 'ENDED' | 'ENDED_EARLY' | 'CANCELLED';

export interface ActiveClosure {
    closureId: number;
    type: ClosureType;
    startsAt: string;
    endsAt: string;
    reason: string | null;
}

export interface OutletLiveStatus {
    state: OutletState;
    isOpen: boolean;
    closesAt: string | null;
    opensAt: string | null;
    activeClosure: ActiveClosure | null;
}

export interface OutletStatusItem {
    restroId: string;
    restroName: string;
    isSetupLocked: boolean;
    status: OutletLiveStatus;
}

export interface OutletStatusPage {
    items: OutletStatusItem[];
    page: number;
    size: number;
    totalItems: number;
    hasMore: boolean;
}

export interface OutletSummary {
    total: number;
    openCount: number;
    closedCount: number;
}

export interface Closure {
    closureId: number;
    type: ClosureType;
    state: ClosureState;
    startsAt: string;
    endsAt: string;
    reason: string | null;
    cancelledAt: string | null;
    createdAt: string;
}

export interface ClosurePage {
    items: Closure[];
    page: number;
    hasMore: boolean;
}

export interface HolidayRequest {
    startsAt: string; // "YYYY-MM-DDTHH:mm"
    endsAt: string;
    reason?: string;
}

export const fetchOutletStatuses = async (params: { restroId?: string; search?: string; page?: number; size?: number }) => {
    const { data } = await api.get<OutletStatusPage>(BASE, { params });
    return data;
};

export const fetchOutletSummary = async () => {
    const { data } = await api.get<OutletSummary>(`${BASE}/summary`);
    return data;
};

export const pauseOutlet = async (restroId: string) => {
    const { data } = await api.post<OutletStatusItem>(`${BASE}/${restroId}/pause`);
    return data;
};

export const resumeOutlet = async (restroId: string) => {
    const { data } = await api.post<OutletStatusItem>(`${BASE}/${restroId}/resume`);
    return data;
};

export const fetchUpcomingClosures = async (restroId: string) => {
    const { data } = await api.get<Closure[]>(`${BASE}/${restroId}/closures`, { params: { scope: 'UPCOMING' } });
    return data;
};

export const fetchClosureHistory = async (restroId: string, page: number, size = 10) => {
    const { data } = await api.get<ClosurePage>(`${BASE}/${restroId}/closures`, {
        params: { scope: 'HISTORY', page, size },
    });
    return data;
};

export const addHoliday = async (restroId: string, request: HolidayRequest) => {
    const { data } = await api.post<OutletStatusItem>(`${BASE}/${restroId}/holidays`, request);
    return data;
};

/** Cancels a holiday that hasn't started, or ends an active one now. */
export const endOrCancelClosure = async (restroId: string, closureId: number) => {
    const { data } = await api.delete<OutletStatusItem>(`${BASE}/${restroId}/closures/${closureId}`);
    return data;
};
