import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RequireAuth, RequireOnboarding, RequirePending, PublicOnlyRoute } from './ProtectedRoute';

// Lazy loading components
const LandingPage = lazy(() => import('@/features/home/LandingPage').then(module => ({ default: module.LandingPage })));
const Dashboard = lazy(() => import('@/features/dashboard/outlets/Dashboard').then(module => ({ default: module.Dashboard })));
const Orders = lazy(() => import('@/features/dashboard/outlets/Orders').then(module => ({ default: module.Orders })));
const MenuScore = lazy(() => import('@/features/dashboard/outlets/MenuScore').then(module => ({ default: module.MenuScore })));
const OnboardingLayout = lazy(() => import('@/features/onboarding/layouts/OnboardingLayout').then(module => ({ default: module.OnboardingLayout })));
const PersonalInfo = lazy(() => import('@/features/onboarding/components/PersonalInfo').then(module => ({ default: module.PersonalInfo })));
const RestaurantInfo = lazy(() => import('@/features/onboarding/components/RestaurantInfo').then(module => ({ default: module.RestaurantInfo })));
const AboutRestaurant = lazy(() => import('@/features/onboarding/components/AboutRestaurant').then(module => ({ default: module.AboutRestaurant })));
const Verification = lazy(() => import('@/features/onboarding/components/Verification').then(module => ({ default: module.Verification })));
const HelpCenter = lazy(() => import('@/pages/HelpCenter').then(module => ({ default: module.HelpCenter })));
const NotFound = lazy(() => import('@/pages/NotFound').then(module => ({ default: module.NotFound })));
const DashboardLayout = lazy(() => import('@/features/dashboard/layouts/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const MenuEditor = lazy(() => import('@/features/dashboard/outlets/MenuEditor').then(module => ({ default: module.MenuEditor })));

const Loading = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
);

const withSuspense = (Component: React.ComponentType) => (
    <Suspense fallback={<Loading />}>
        <Component />
    </Suspense>
);

export const router = createBrowserRouter([
    {
        element: <PublicOnlyRoute />,
        children: [
            {
                path: '/',
                element: withSuspense(LandingPage),
            }
        ]
    },
    {
        path: '/help',
        element: withSuspense(HelpCenter)
    },
    {
        element: <RequireAuth />,
        children: [
            {
                element: <RequirePending />,
                children: [
                    {
                        path: '/grow-with-ustart',
                        element: withSuspense(OnboardingLayout),
                        children: [
                            {
                                index: true,
                                element: <Navigate to="personal-info" replace />
                            },
                            {
                                path: 'personal-info',
                                element: withSuspense(PersonalInfo)
                            },
                            {
                                path: "restaurant-info",
                                element: withSuspense(RestaurantInfo)
                            },
                            {
                                path: "documents",
                                element: withSuspense(AboutRestaurant)
                            },
                            {
                                path: "verification",
                                element: withSuspense(Verification)
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
                        element: withSuspense(DashboardLayout),
                        children: [
                            {
                                index: true,
                                element: withSuspense(Dashboard),
                            },
                            {
                                path: 'orders',
                                element: withSuspense(Orders),
                            },
                            {
                                path: 'menu',
                                children: [
                                    {
                                        index: true,
                                        element: withSuspense(MenuScore),
                                    },
                                    {
                                        path: 'edit',
                                        element: withSuspense(MenuEditor),
                                    },
                                    {
                                        path: 'stock',
                                        element: withSuspense(MenuEditor),
                                    },
                                    {
                                        path: 'taxes',
                                        element: withSuspense(MenuEditor),
                                    },
                                    {
                                        path: 'charges',
                                        element: withSuspense(MenuEditor),
                                    },
                                    {
                                        path: 'review',
                                        element: withSuspense(MenuEditor),
                                    }
                                ]
                            },
                        ],
                    }
                ]
            }
        ]
    },
    {
        path: '*',
        element: withSuspense(NotFound),
    },
]);
