import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { AppLayout } from '@/layouts/AppLayout';
import { RequireAuth, RequireOnboarding, RequirePending, PublicOnlyRoute } from './ProtectedRoute';
import { OnboardingLayout } from '@/features/onboarding/layouts/OnboardingLayout';
import { PersonalInfo } from '@/features/onboarding/components/PersonalInfo';
import { Navigate } from 'react-router-dom';
import { RestaurantInfo } from '@/features/onboarding/components/RestaurantInfo';
import { AboutRestaurant } from '@/features/onboarding/components/AboutRestaurant';
import { Verification } from '@/features/onboarding/components/Verification';

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
                        element: <OnboardingLayout />,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="personal-info" replace />
                            },
                            {
                                path: 'personal-info',
                                element: <PersonalInfo />
                            },
                            {
                                path: "restaurant-info",
                                element: <RestaurantInfo />
                            },
                            {
                                path: "documents",
                                element: <AboutRestaurant />
                            },
                            {
                                path: "verification",
                                element: <Verification />
                            }
                        ]
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
