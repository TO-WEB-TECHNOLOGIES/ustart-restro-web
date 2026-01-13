import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/landing/LandingPage';
import { Dashboard } from '@/features/dashboard/outlets/Dashboard';
import { Orders } from '@/features/dashboard/outlets/Orders';
import { RequireAuth, RequireOnboarding, RequirePending, PublicOnlyRoute } from './ProtectedRoute';
import { OnboardingLayout } from '@/features/onboarding/layouts/OnboardingLayout';
import { PersonalInfo } from '@/features/onboarding/components/PersonalInfo';
import { Navigate } from 'react-router-dom';
import { RestaurantInfo } from '@/features/onboarding/components/RestaurantInfo';
import { AboutRestaurant } from '@/features/onboarding/components/AboutRestaurant';
import { Verification } from '@/features/onboarding/components/Verification';
import { HelpCenter } from '@/pages/HelpCenter';
import { NotFound } from '@/pages/NotFound';
import { DashboardLayout } from '@/features/dashboard/layouts/DashboardLayout';

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
        path: '/help',
        element: <HelpCenter />
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
                        element: <DashboardLayout />,
                        children: [
                            {
                                index: true,
                                element: <Dashboard />,
                            },
                            {
                                path: 'orders',
                                element: <Orders />,
                            },
                        ],
                    }
                ]
            }
        ]
    },
    {
        path: '*',
        element: <NotFound />,
    },
]);
