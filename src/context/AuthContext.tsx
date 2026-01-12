import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { api } from '@/api/axios';
import { decodeToken } from '@/utils/jwt';
import { useOnboardingStore } from '@/features/onboarding/store/useOnboardingStore';

interface User {
    id: string;
    name: string;
    mobile: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
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

    const initializeAuth = (authToken: string) => {
        const decoded = decodeToken(authToken);
        if (decoded) {
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
    };

    // Initial load from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            initializeAuth(storedToken);
        }
    }, []);

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
