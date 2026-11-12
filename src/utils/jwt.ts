export const decodeToken = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode token", e);
        return null;
    }
};

/**
 * 2026-11-12: brand statuses that may use the dashboard. UPDATE_APPROVAL_PENDING is a live brand
 * whose Brand Details edit is waiting for approval: its outlets are offline (backend), but the
 * partner must keep the dashboard - before this, the next token refresh sent them to onboarding.
 */
export const isDashboardStatus = (status?: string | null) =>
    status === 'ACTIVE' || status === 'UPDATE_APPROVAL_PENDING';
