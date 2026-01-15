import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { api } from '@/api/axios';
import { decodeToken } from '@/utils/jwt';

interface User {
    id: string;
    name: string;
    mobile: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    isOnboardingComplete: boolean;
    status: string | null;
    login: (token: string) => void;
    logout: () => void;
    updateStatus: (status: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
    const [status, setStatus] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

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
            setUser(decoded.user);
            setIsOnboardingComplete(decoded.isOnboardingComplete);
            setStatus(decoded.status);
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
        if (storedToken) {
            initializeAuth(storedToken);
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

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        initializeAuth(newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsOnboardingComplete(false);
        setStatus(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');

        // Remove API header
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isInitialized,
            isOnboardingComplete,
            status,
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
