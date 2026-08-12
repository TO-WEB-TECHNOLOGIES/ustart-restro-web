import axios from 'axios';

// TODO: Replace with environment variable later
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL: BASE_URL,
    // Sends the httpOnly refresh-token cookie automatically on every request -
    // required for POST /api/v1/auth/refresh (and /logout) to work at all.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Single in-memory source of truth for the access token. Previously this was
// expressed in three places at once (AuthContext's React state,
// api.defaults.headers.common['Authorization'] set once at login, and this
// file's own request interceptor reading localStorage independently) - now
// AuthContext calls setAccessToken on every login/refresh/logout and the
// interceptor below reads it fresh on every call.
let accessToken: string | null = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Shared in-flight refresh so concurrent 401s trigger exactly one
// POST /auth/refresh - each rotation invalidates the refresh token the
// previous attempt was using, so racing separate calls would fail the loser.
let refreshPromise: Promise<string> | null = null;

/** Exported so AuthContext can call this once at boot (before any access
 * token exists) to silently resume a session from the refresh cookie. */
export const refreshAccessToken = (): Promise<string> => {
    if (!refreshPromise) {
        refreshPromise = api
            .post('/api/v1/auth/refresh')
            .then((response) => {
                const newToken = response.data?.accessToken;
                if (!newToken) throw new Error('No accessToken in refresh response');
                setAccessToken(newToken);
                return newToken;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const message = error.response?.data?.message || 'Something went wrong';
        const originalRequest = error.config;
        // A 401 from an auth endpoint itself (bad OTP, /auth/refresh's own
        // failure, etc.) is a normal validation/expiry response, not a signal
        // to silently refresh-and-retry - and retrying /auth/refresh from here
        // would recurse.
        const isAuthRequest = originalRequest?.url?.includes('/api/v1/auth/');

        if (error.response?.status === 401 && !isAuthRequest && !originalRequest?._isRetry) {
            originalRequest._isRetry = true;
            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Silent refresh failed, logging out:', refreshError);

                // Clear what's left client-side (by raw key name, not by importing
                // the store modules - importing them here would pull in their
                // */api/*.ts files, which import this file, and create a circular
                // import). onboarding-storage is deliberately left alone: an
                // in-progress signup should survive this.
                setAccessToken(null);
                localStorage.removeItem('order-storage');
                localStorage.removeItem('restaurant-storage-v5');
                localStorage.removeItem('ustart-addon-storage');
                sessionStorage.removeItem('menu-editor-storage');

                // Should verify if window redirection is the best approach
                // or if we can use router navigation (but this is outside React context)
                window.location.href = '/';
                return Promise.reject(error);
            }
        }

        console.error('API Error:', message);
        return Promise.reject(error);
    }
);
