import {
  Tag,
  Utensils,
  CalendarDays,
  UtensilsCrossed,
  ChevronRight,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

export const CustomerDelighters = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const delighters = [
    {
      id: "flatDeals",
      icon: <Tag className="w-7 h-7" />,
      title: t("dashboard.offers.customerDelightersDetails.flatDeals.title"),
      description: t(
        "dashboard.offers.customerDelightersDetails.flatDeals.description",
      ),
    },
    {
      id: "bogo",
      icon: <Utensils className="w-7 h-7" />,
      title: t("dashboard.offers.customerDelightersDetails.bogo.title"),
      description: t(
        "dashboard.offers.customerDelightersDetails.bogo.description",
      ),
    },
    {
      id: "dotd",
      icon: <CalendarDays className="w-7 h-7" />,
      title: t("dashboard.offers.customerDelightersDetails.dotd.title"),
      description: t(
        "dashboard.offers.customerDelightersDetails.dotd.description",
      ),
    },
    {
      id: "itemDiscount",
      icon: <UtensilsCrossed className="w-7 h-7" />,
      title: t("dashboard.offers.customerDelightersDetails.itemDiscount.title"),
      description: t(
        "dashboard.offers.customerDelightersDetails.itemDiscount.description",
      ),
    },
  ];

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] flex items-center justify-center bg-background-white dark:bg-slate-950 transition-colors duration-300 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto p-6 lg:p-8 flex flex-col items-center gap-6 relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="animate-bounce-subtle">
            <Star className="text-secondary-orange w-10 h-10 fill-current drop-shadow-sm" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-blue dark:text-white tracking-tight">
            {t("dashboard.offers.customerDelightersDetails.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg">
            {t("dashboard.offers.customerDelightersDetails.subtitle")}
          </p>
          <div className="w-16 h-1 bg-secondary-orange rounded-full opacity-80"></div>
        </div>

        <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          {delighters.map((item) => (
            <button
              key={item.id}
              onClick={() => item.id === "flatDeals" && navigate("flat-deals")}
              className="w-full text-left group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-5 md:p-6 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-5">
                <div
                  className={`size-12 min-w-[48px] rounded-full bg-white dark:bg-slate-800 border-2 border-secondary-orange/20 flex items-center justify-center text-secondary-orange shadow-sm`}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col gap-1 pt-0.5">
                  <h3 className="text-lg font-bold text-primary-blue dark:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed transition-colors">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center h-full pt-1.5">
                <ChevronRight className="text-secondary-orange w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <Link
            to="/dashboard/growth"
            className="text-primary-blue dark:text-slate-400 hover:text-secondary-orange transition-colors flex items-center gap-2 font-medium"
          >
            ← {t("common.titles.overview")} /{" "}
            {t("dashboard.sidebar.items.offers")}
          </Link>
        </div>
      </div>
    </div>
  );
};
