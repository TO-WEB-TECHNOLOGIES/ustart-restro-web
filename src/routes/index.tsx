import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { AppLayout } from '@/layouts/AppLayout';
import { JoinUstartPage } from '@/pages/JoinUstartPage';
import { RequireAuth, RequireOnboarding, RequirePending, PublicOnlyRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
    {
        element: <PublicOnlyRoute />,
        children: [
            {
                path: '/',
                element: <LandingPage />,
            }
        ]
    },
    {
        element: <RequireAuth />,
        children: [
            {
                element: <RequirePending />,
                children: [
                    {
                        path: '/grow-with-ustart',
                        element: <JoinUstartPage />,
                    }
                ]
            },
            {
                element: <RequireOnboarding />,
                children: [
                    {
                        path: '/dashboard',
                        element: <AppLayout />,
                        children: [
                            {
                                index: true,
                                element: <Dashboard />,
                            },
                        ],
                    }
                ]
            }
        ]
    },
    {
        path: '*',
        element: <div>404 Not Found</div>,
    },
]);
