import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { api, setAccessToken, refreshAccessToken } from '@/api/axios';
import { decodeToken } from '@/utils/jwt';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';
import { useOrderStore } from '@/features/dashboard/store/useOrderStore';
import { useRestaurantStore } from '@/features/dashboard/store/useRestaurantStore';
import { useAddonStore } from '@/features/dashboard/store/useAddonStore';
import { useMenuStore } from '@/features/dashboard/store/useMenuStore';

interface User {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    role: string;
    brandId?: string;
    restroId?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    isOnboardingComplete: boolean;
    status: string | null;
    supportId?: string | null;
    isMultipleRestro: boolean;
    login: (token: string) => void;
    logout: () => void;
    updateStatus: (status: string) => void;
    setIsMultipleRestro: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // In-memory only - never localStorage. The refresh token is now an
    // httpOnly cookie the backend sets; this access token lives only as long
    // as the tab does, and a fresh page load resumes the session via the
    // boot-time refresh effect below rather than reading anything persisted.
    const [token, setToken] = useState<string | null>(null);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
    const [status, setStatus] = useState<string | null>(null);
    const [supportId, setSupportId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isMultipleRestro, setIsMultipleRestro] = useState<boolean>(false);

    const initializeAuth = (authToken: string) => {
        const decoded = decodeToken(authToken);
        if (decoded) {
            // Check for expiration
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                logout();
                setIsInitialized(true);
                return;
            }

            setToken(authToken);
            setAccessToken(authToken);

            const userData = decoded.user ? {
                ...decoded.user,
                name: decoded.user.name || 'Guest',
                restroId: decoded.user.restroId || decoded.restroId
            } : null;

            // An onboarding draft (personal info, restaurant info, uploaded doc URLs)
            // belongs to the mobile number that started it. If a different number just
            // logged in on this device, it must not inherit that draft. If it's the same
            // number, leave the store alone so the onboarding forms resume with the saved
            // draft already filled in — this isn't a security concern since it's the same
            // account, only device-sharing between different accounts is.
            const onboarding = useOnboardingStore.getState();
            if (
                !onboarding.isEditing &&
                onboarding.personalInfo.mobile &&
                userData?.mobile &&
                onboarding.personalInfo.mobile !== userData.mobile
            ) {
                onboarding.reset();
            }

            setUser(userData);
            setIsOnboardingComplete(decoded.isOnboardingComplete);
            setStatus(decoded.status);
            setSupportId(decoded.supportId);
            setIsMultipleRestro(decoded.isMultipleRestro || false);
            setIsAuthenticated(true);
        } else {
            // Invalid token
            logout();
        }
        setIsInitialized(true);
    };

    // Boot-time session resume: there's nothing in localStorage to read
    // anymore (access token is in-memory only), so this silently calls
    // POST /auth/refresh - the httpOnly refresh cookie is sent automatically
    // - to pick the session back up after a fresh page load/reload. Failure
    // just means "not logged in", not an error to surface.
    useEffect(() => {
        let cancelled = false;
        refreshAccessToken()
            .then((newToken) => {
                if (!cancelled) initializeAuth(newToken);
            })
            .catch(() => {
                if (!cancelled) setIsInitialized(true);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Proactive silent refresh, ~60s before the access token actually
    // expires, instead of waiting for expiry and hard-logging-out. Only
    // falls back to a forced logout if the refresh call itself fails (idle
    // window lapsed, 8h cap hit, or the session was revoked) - see the
    // session-policy table in ustart-backend's docs/internal/authentication.md.
    useEffect(() => {
        if (!token) return;
        const decoded = decodeToken(token);
        if (!decoded?.exp) return;

        const expiryTime = decoded.exp * 1000;
        const refreshInMs = Math.max(expiryTime - Date.now() - 60_000, 0);

        const timeoutId = setTimeout(async () => {
            try {
                const newToken = await refreshAccessToken();
                initializeAuth(newToken);
            } catch {
                // Unlike a manual logout, this happens without the user asking for
                // it — tell them why they were signed out instead of silently
                // bouncing them to the landing page.
                toast.error('Your session has expired. Please log in again.');
                logout();
            }
        }, refreshInMs);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const login = (newToken: string) => {
        initializeAuth(newToken);
    };

    const logout = () => {
        // Best-effort server-side revocation - only ends this session, other
        // concurrent sessions for the same account are untouched. Attach the
        // Authorization header explicitly (rather than relying on the request
        // interceptor's timing) since the in-memory token is cleared in this
        // same synchronous call, right below.
        if (token) {
            api.post('/api/v1/auth/logout', undefined, {
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {
                // Network/server failure shouldn't block local cleanup below.
            });
        }

        setToken(null);
        setUser(null);
        setIsOnboardingComplete(false);
        setStatus(null);
        setSupportId(null);
        setIsAuthenticated(false);
        setAccessToken(null);

        // Every one of these stores holds data scoped to whoever was just logged in.
        // Without this, the next login on this device/browser (possibly a different
        // account) would inherit the previous session's restaurant, orders, addons, and
        // menu edits. This is the single logout path (DashboardLayout/OnboardingLayout
        // just call this) so there's exactly one place that has to get this right.
        // The onboarding store is intentionally NOT reset here — an in-progress signup
        // must survive a logout/login from the same number; see the mismatch check in
        // initializeAuth above for when it actually gets cleared.
        useOrderStore.getState().reset();
        useRestaurantStore.getState().reset();
        useAddonStore.getState().reset();
        useMenuStore.getState().reset();

        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith('draft_settings_')) {
                sessionStorage.removeItem(key);
            }
        });
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isInitialized,
            isOnboardingComplete,
            status,
            supportId,
            isMultipleRestro,
            login,
            logout,
            updateStatus: setStatus,
            setIsMultipleRestro,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
