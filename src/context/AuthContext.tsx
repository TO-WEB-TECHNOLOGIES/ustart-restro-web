import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { api } from '@/api/axios';
import { decodeToken } from '@/utils/jwt';

interface User {
    id: string;
    name: string;
    mobile: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    isOnboardingComplete: boolean;
    status: string | null;
    supportId?: string | null;
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
    updateStatus: (status: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
    const [status, setStatus] = useState<string | null>(null);
    const [supportId, setSupportId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const initializeAuth = (authToken: string, refreshTok?: string) => {
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
            if (refreshTok) {
                setRefreshToken(refreshTok);
            }

            const userData = decoded.user ? {
                ...decoded.user,
                name: decoded.user.name || 'Guest'
            } : null;

            setUser(userData);
            setIsOnboardingComplete(decoded.isOnboardingComplete);
            setStatus(decoded.status);
            setSupportId(decoded.supportId);
            setIsAuthenticated(true);

            // Configure axios default header
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        } else {
            // Invalid token
            logout();
        }
        setIsInitialized(true);
    };

    // Initial load from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (storedToken) {
            initializeAuth(storedToken, storedRefreshToken || undefined);
        } else {
            setIsInitialized(true);
        }
    }, []);

    // Auto logout on token expiry
    useEffect(() => {
        if (token) {
            const decoded = decodeToken(token);
            if (decoded && decoded.exp) {
                const expiryTime = decoded.exp * 1000;
                const currentTime = Date.now();
                const timeLeft = expiryTime - currentTime;

                if (timeLeft <= 0) {
                    logout();
                } else {
                    const timeoutId = setTimeout(() => {
                        logout();
                    }, timeLeft);
                    return () => clearTimeout(timeoutId);
                }
            }
        }
    }, [token]);

    const login = (newToken: string, newRefreshToken: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        initializeAuth(newToken, newRefreshToken);
    };

    const logout = () => {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsOnboardingComplete(false);
        setStatus(null);
        setSupportId(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        // Remove API header
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            refreshToken,
            isAuthenticated,
            isInitialized,
            isOnboardingComplete,
            status,
            supportId,
            login,
            logout,
            updateStatus: setStatus,
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
