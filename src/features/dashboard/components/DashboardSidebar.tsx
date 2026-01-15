import { useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRestaurantStore } from "../store/useRestaurantStore";
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarClock,
  History,
  Store,
  BarChart3,
  Tag,
  Mic2,
  HelpCircle,
  LogOut,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  AlertTriangle as AlertTriangleIcon,
  Wallet as WalletIcon,
  Store as StoreIcon,
} from "lucide-react";
import { usePendingOrders } from "../hooks/useDashboardData";
import { Logo } from "@/components/ui/logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MenuItem {
  icon: any;
  key: string;
  path: string;
  badge?: string | number;
}

interface MenuSection {
  key: string;
  items: MenuItem[];
}

// Define keys for translation mapping
const MENU_SECTIONS: MenuSection[] = [
  {
    key: "operations",
    items: [
      { icon: LayoutDashboard, key: "home", path: "/dashboard" },
      { icon: UtensilsCrossed, key: "menu", path: "/dashboard/menu" },
      {
        icon: CalendarClock,
        key: "orders",
        path: "/dashboard/orders",
      },
      { icon: History, key: "history", path: "/dashboard/history" },
      { icon: Store, key: "status", path: "/dashboard/status" },
    ],
  },
  {
    key: "growth",
    items: [
      { icon: BarChart3, key: "reporting", path: "/dashboard/reporting" },
      { icon: Tag, key: "offers", path: "/dashboard/offers" },
      { icon: Mic2, key: "ads", path: "/dashboard/ads" },
      { icon: TrendingUpIcon, key: "growth", path: "/dashboard/growth" },
    ],
  },
  {
    key: "support",
    items: [
      { icon: StarIcon, key: "reviews", path: "/dashboard/reviews" },
      {
        icon: AlertTriangleIcon,
        key: "complaints",
        path: "/dashboard/complaints",
      },
      { icon: WalletIcon, key: "payout", path: "/dashboard/payout" },
      { icon: StoreIcon, key: "info", path: "/dashboard/info" },
      { icon: HelpCircle, key: "help", path: "/help" },
    ],
  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogoutClick: () => void;
}

export const DashboardSidebar = ({
  isOpen,
  onClose,
  onLogoutClick,
}: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { name: restaurantName, setRestaurantName } = useRestaurantStore();

  // Determine if we are effectively in dark mode
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Get all section keys for default open state
  const allSections = MENU_SECTIONS.map((section) => `section-${section.key}`);

  // Sync restaurant name from auth user if available and store is empty
  useEffect(() => {
    const fetchDetails = async () => {
      // 1. Fetch Restaurant Name
      if (user?.name && !restaurantName) {
        setRestaurantName(user.name);
      }
    };
    fetchDetails();
  }, [user, restaurantName, setRestaurantName]);

  const partnershipText = useMemo(() => {
    return restaurantName ? `${restaurantName}` : "";
  }, [restaurantName]);

  const { hasPendingOrders, pendingCount } = usePendingOrders();

  const menuWithBadges = useMemo(() => {
    return MENU_SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.key === "orders" && hasPendingOrders) {
          return { ...item, badge: pendingCount > 0 ? pendingCount : "New" };
        }
        return item;
      }),
    }));
  }, [hasPendingOrders, pendingCount]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={`
                fixed md:sticky top-0 h-screen z-50 md:z-40
                w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800
                flex flex-col shrink-0 transition-all duration-300 ease-in-out
                ${isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
          }
            `}
      >
        <div className="p-6">
          <div className="w-32">
            <Logo color={isDark ? "var(--color-background-white)" : "var(--color-primary-blue)"} />
          </div>
          {partnershipText && (
            <div className="text-md font-bold text-secondary-orange flex items-center gap-2">
              <span className="font-miniver text-3xl lowercase leading-none text-primary-blue dark:text-background-white">x</span>
              <span className="text-xl opacity-90"><i>{partnershipText}</i></span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <Accordion
            type="multiple"
            defaultValue={allSections}
            className="w-full"
          >
            {menuWithBadges.map((section) => (
              <AccordionItem
                key={section.key}
                value={`section-${section.key}`}
                className="border-b-0 mb-2"
              >
                <AccordionTrigger className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-3 hover:no-underline hover:text-slate-600 dark:hover:text-slate-300">
                  {t(`dashboard.sidebar.sections.${section.key}`)}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            navigate(item.path);
                            onClose?.();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 ${isActive
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400 dark:text-slate-500"
                                }`}
                            />
                            <span>
                              {t(`dashboard.sidebar.items.${item.key}`)}
                            </span>
                          </div>
                          {item.badge && (
                            <span className="bg-secondary-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onLogoutClick}
            className="flex items-center gap-3 text-secondary-orange hover:bg-orange-50 dark:hover:bg-orange-900/10 px-3 py-3 rounded-lg w-full transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>{t("dashboard.sidebar.items.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
