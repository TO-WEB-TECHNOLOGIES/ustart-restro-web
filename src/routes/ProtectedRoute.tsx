import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const RequireAuth = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

export const RequireOnboarding = () => {
    const { isOnboardingComplete, status } = useAuth();

    if (!isOnboardingComplete || status !== 'APPROVED') {
        return <Navigate to="/grow-with-ustart" replace />;
    }
    return <Outlet />;
};

export const RequirePending = () => {
    const { isOnboardingComplete, status } = useAuth();

    // If already approved, go to dashboard
    if (isOnboardingComplete && status === 'APPROVED') {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
};

export const PublicOnlyRoute = () => {
    const { isAuthenticated, isOnboardingComplete, status } = useAuth();

    if (isAuthenticated) {
        if (isOnboardingComplete && status === 'APPROVED') {
            return <Navigate to="/dashboard" replace />;
        } else {
            return <Navigate to="/grow-with-ustart" replace />;
        }
    }

    return <Outlet />;
};
