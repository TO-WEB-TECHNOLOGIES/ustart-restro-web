import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense } from "react";
import {
  RequireAuth,
  RequireOnboarding,
  RequirePending,
  PublicOnlyRoute,
} from "./ProtectedRoute";
import { GlobalErrorBoundary } from "@/pages/GlobalErrorBoundary";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// 2026-11-11: pages load through lazyWithRetry (retries the download, reloads once after a deploy,
// keeps the loading screen meanwhile). It replaced an inline wrapper whose reload guard got stuck.
const lazy = lazyWithRetry;

// Lazy loading components
const LandingPage = lazy(() =>
  import("@/features/home/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const Dashboard = lazy(() =>
  import("@/features/dashboard/outlets/dashboard/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);
const Orders = lazy(() =>
  import("@/features/dashboard/outlets/dashboard/Orders").then((module) => ({
    default: module.Orders,
  })),
);
// 2026-11-12: Outlet Schedule (sidebar Operations → Outlet Schedule, path /dashboard/status, which
// used to fall through to Coming Soon). The path is kept so existing links still work.
const OutletSchedule = lazy(() =>
  import("@/features/dashboard/outlets/operations/OutletSchedule").then((module) => ({
    default: module.OutletSchedule,
  })),
);
// 2026-11-11: My Offers - active offers + history (sidebar Growth → Offers, which had no route).
const MyOffers = lazy(() =>
  import("@/features/dashboard/outlets/offers/MyOffers").then((module) => ({
    default: module.MyOffers,
  })),
);
const CreateOffers = lazy(() =>
  import("@/features/dashboard/outlets/growth/CreateOffers").then((module) => ({
    default: module.CreateOffers,
  })),
);
const CustomerDelighters = lazy(() =>
  import("@/features/dashboard/outlets/growth/CustomerDelighters").then(
    (module) => ({
      default: module.CustomerDelighters,
    }),
  ),
);
const FlatDeals = lazy(() =>
  import("@/features/dashboard/outlets/growth/FlatDeals").then((module) => ({
    default: module.FlatDeals,
  })),
);
const PercentageDiscounts = lazy(() =>
  import("@/features/dashboard/outlets/growth/PercentageDiscounts").then(
    (module) => ({
      default: module.PercentageDiscounts,
    }),
  ),
);
const DealOfTheDay = lazy(() =>
  import("@/features/dashboard/outlets/growth/DealOfTheDay").then((module) => ({
    default: module.DealOfTheDay,
  })),
);
// 2026-11-11: the two Customer Delighters cards that had no page.
const BogoOffers = lazy(() =>
  import("@/features/dashboard/outlets/growth/BogoOffers").then((module) => ({
    default: module.BogoOffers,
  })),
);
const ItemLevelDiscount = lazy(() =>
  import("@/features/dashboard/outlets/growth/ItemLevelDiscount").then((module) => ({
    default: module.ItemLevelDiscount,
  })),
);
const EliteExclusiveOffers = lazy(() =>
  import("@/features/dashboard/outlets/growth/EliteExclusiveOffers").then(
    (module) => ({
      default: module.EliteExclusiveOffers,
    }),
  ),
);
const QuickSetup = lazy(() =>
  import("@/features/dashboard/outlets/growth/QuickSetup").then((module) => ({
    default: module.QuickSetup,
  })),
);
const MenuScore = lazy(() =>
  import("@/features/dashboard/outlets/menu/MenuScore").then((module) => ({
    default: module.MenuScore,
  })),
);
const OnboardingLayout = lazy(() =>
  import("@/features/onboarding/layouts/OnboardingLayout").then((module) => ({
    default: module.OnboardingLayout,
  })),
);
const PersonalInfo = lazy(() =>
  import("@/features/onboarding/components/PersonalInfo").then((module) => ({
    default: module.PersonalInfo,
  })),
);
const RestaurantInfo = lazy(() =>
  import("@/features/onboarding/components/RestaurantInfo").then((module) => ({
    default: module.RestaurantInfo,
  })),
);
const AboutRestaurant = lazy(() =>
  import("@/features/onboarding/components/AboutRestaurant").then((module) => ({
    default: module.AboutRestaurant,
  })),
);
const Verification = lazy(() =>
  import("@/features/onboarding/components/Verification").then((module) => ({
    default: module.Verification,
  })),
);
const CompleteSetup = lazy(() =>
  import("@/features/onboarding/components/CompleteSetup").then((module) => ({
    default: module.CompleteSetup,
  })),
);
const UploadMenu = lazy(() =>
  import("@/features/onboarding/components/UploadMenu").then((module) => ({
    default: module.UploadMenu,
  })),
);
const HelpCenter = lazy(() =>
  import("@/pages/HelpCenter").then((module) => ({
    default: module.HelpCenter,
  })),
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((module) => ({ default: module.NotFound })),
);
const DashboardLayout = lazy(() =>
  import("@/features/dashboard/layouts/DashboardLayout").then((module) => ({
    default: module.DashboardLayout,
  })),
);
const MenuEditor = lazy(() =>
  import("@/features/dashboard/outlets/menu/MenuEditor").then((module) => ({
    default: module.MenuEditor,
  })),
);
// 2026-10-27: the add-on library (rebuilt; replaces AddonEditor) and its full-page add-on form.
const AddonLibrary = lazy(() =>
  import("@/features/dashboard/outlets/menu/AddonLibrary").then((module) => ({
    default: module.AddonLibrary,
  })),
);
const AddonFormPage = lazy(() =>
  import("@/features/dashboard/outlets/menu/AddonFormPage").then((module) => ({
    default: module.AddonFormPage,
  })),
);
const ComingSoon = lazy(() =>
  import("@/features/dashboard/outlets/static/ComingSoon").then((module) => ({
    default: module.ComingSoon,
  })),
);

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
    errorElement: <GlobalErrorBoundary />,
    children: [
      {
        path: "/",
        element: withSuspense(LandingPage),
      },
    ],
  },
  {
    path: "/help",
    errorElement: <GlobalErrorBoundary />,
    element: withSuspense(HelpCenter),
  },
  {
    element: <RequireAuth />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      {
        element: <RequirePending />,
        children: [
          {
            path: "/grow-with-ustart",
            element: withSuspense(OnboardingLayout),
            children: [
              {
                index: true,
                element: <Navigate to="personal-info" replace />,
              },
              {
                path: "personal-info",
                element: withSuspense(PersonalInfo),
              },
              {
                path: "restaurant-info",
                element: withSuspense(RestaurantInfo),
              },
              {
                path: "documents",
                element: withSuspense(AboutRestaurant),
              },
              {
                path: "verification",
                element: withSuspense(Verification),
              },
              {
                path: "complete",
                element: withSuspense(CompleteSetup),
              },
              {
                path: "upload-menu",
                children: [
                  {
                    index: true,
                    element: withSuspense(UploadMenu),
                  },
                  {
                    path: "new",
                    element: withSuspense(UploadMenu),
                  },
                  // 2026-10-27: the add-on library during onboarding - the menu sidebar's
                  // "Go to Add-ons" can't use /dashboard/... before the brand is ACTIVE.
                  {
                    path: "addons",
                    element: withSuspense(AddonLibrary),
                  },
                  {
                    path: "addons/new",
                    element: withSuspense(AddonFormPage),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <RequireOnboarding />,
        children: [
          {
            path: "/dashboard",
            element: withSuspense(DashboardLayout),
            children: [
              {
                index: true,
                element: withSuspense(Dashboard),
              },
              {
                path: "orders",
                element: withSuspense(Orders),
              },
              {
                path: "offers",
                element: withSuspense(MyOffers),
              },
              {
                path: "status",
                element: withSuspense(OutletSchedule),
              },
              {
                path: "growth",
                children: [
                  {
                    index: true,
                    element: withSuspense(CreateOffers),
                  },
                  {
                    path: "customer-delighters",
                    children: [
                      {
                        index: true,
                        element: withSuspense(CustomerDelighters),
                      },
                      {
                        path: "flat-deals",
                        element: withSuspense(FlatDeals),
                      },
                      {
                        path: "dotd",
                        element: withSuspense(DealOfTheDay),
                      },
                      {
                        path: "bogo",
                        element: withSuspense(BogoOffers),
                      },
                      {
                        path: "item-discount",
                        element: withSuspense(ItemLevelDiscount),
                      },
                    ],
                  },
                  {
                    path: "exclusive-offers",
                    element: withSuspense(EliteExclusiveOffers),
                  },
                  {
                    path: "percentage-discounts",
                    element: withSuspense(PercentageDiscounts),
                  },
                  {
                    path: "quick-setup",
                    element: withSuspense(QuickSetup),
                  },
                ],
              },
              {
                path: "menu",
                children: [
                  {
                    index: true,
                    element: withSuspense(MenuScore),
                  },
                  {
                    path: "edit",
                    element: withSuspense(MenuEditor),
                  },
                  {
                    path: "stock",
                    element: withSuspense(MenuEditor),
                  },
                  {
                    path: "taxes",
                    element: withSuspense(MenuEditor),
                  },
                  {
                    path: "charges",
                    element: withSuspense(MenuEditor),
                  },
                  {
                    path: "new",
                    element: withSuspense(MenuEditor),
                  },
                  {
                    path: "review",
                    element: withSuspense(MenuEditor),
                  },
                  {
                    path: "addons",
                    element: withSuspense(AddonLibrary),
                  },
                  {
                    path: "addons/new",
                    element: withSuspense(AddonFormPage),
                  },
                ],
              },
              {
                path: "*",
                element: withSuspense(ComingSoon),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    errorElement: <GlobalErrorBoundary />,
    element: withSuspense(NotFound),
  },
]);
