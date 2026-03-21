import { Zap, Pizza, Gem, Percent } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OfferCard } from "../../components/OfferCard";
import type { OfferItem } from "../../components/OfferCard";

export const CreateOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const offers: OfferItem[] = [
    {
      id: "quick-setup",
      title: t("dashboard.offers.quickSetup.title"),
      description: t("dashboard.offers.quickSetup.description"),
      icon: <Zap className="w-8 h-8" />,
      path: "quick-setup",
      hasPattern: true,
      isHighlighted: true,
      hoverStyles: {
        card: "group-hover:bg-gradient-to-r group-hover:from-primary-blue group-hover:via-[#1e3a8a] group-hover:to-[#4338ca] group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-primary-blue/20",
        icon: "group-hover:bg-white/10 group-hover:border-white/10 group-hover:text-yellow-300 group-hover:fill-current",
        text: "group-hover:text-white",
        description: "group-hover:text-blue-100",
      },
      baseStyles: {
        iconBg:
          "bg-primary-blue/5 dark:bg-slate-800 border border-slate-100 dark:border-slate-700",
        iconColor: "text-secondary-orange",
      },
    },
    {
      id: "customer-delighters",
      title: t("dashboard.offers.customerDelighters.title"),
      description: t("dashboard.offers.customerDelighters.description"),
      icon: <Pizza className="w-8 h-8" />,
      path: "customer-delighters",
      isPopular: true,
      hoverStyles: {
        card: "group-hover:bg-secondary-orange group-hover:border-transparent group-hover:shadow-md group-hover:shadow-secondary-orange/20",
        icon: "group-hover:bg-white/20 group-hover:text-white",
        text: "group-hover:text-white",
        description: "group-hover:text-orange-50",
      },
      baseStyles: {
        iconBg: "bg-secondary-orange/10 dark:bg-secondary-orange/5",
        iconColor: "text-secondary-orange",
      },
    },
    {
      id: "exclusive-offers",
      title: t("dashboard.offers.exclusiveOffers.title"),
      description: t("dashboard.offers.exclusiveOffers.description"),
      icon: <Gem className="w-8 h-8" />,
      path: "exclusive-offers",
      hoverStyles: {
        card: "group-hover:bg-primary-blue group-hover:border-transparent group-hover:shadow-md group-hover:shadow-primary-blue/20",
        icon: "group-hover:bg-white/10 group-hover:text-white",
        text: "group-hover:text-white",
        description: "group-hover:text-blue-100",
      },
      baseStyles: {
        iconBg: "bg-primary-blue/5 dark:bg-slate-800",
        iconColor: "text-primary-blue dark:text-slate-300",
      },
    },
    {
      id: "percentage-discounts",
      title: t("dashboard.offers.percentageDiscounts.title"),
      description: t("dashboard.offers.percentageDiscounts.description"),
      icon: <Percent className="w-8 h-8" />,
      path: "percentage-Discounts",
      hoverStyles: {
        card: "group-hover:bg-terracotta-green group-hover:border-transparent group-hover:shadow-md group-hover:shadow-terracotta-green/20",
        icon: "group-hover:bg-white/20 group-hover:text-white",
        text: "group-hover:text-white",
        description: "group-hover:text-emerald-50",
      },
      baseStyles: {
        iconBg: "bg-terracotta-green/10 dark:bg-slate-800",
        iconColor: "text-terracotta-green",
      },
    },
  ];

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] flex items-center justify-center bg-background-white dark:bg-slate-950 transition-colors duration-300 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto p-6 lg:p-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-blue dark:text-white tracking-tight">
            {t("dashboard.offers.title")}
          </h1>
          <div className="w-24 h-1 bg-secondary-orange rounded-full opacity-80"></div>
        </div>

        <div className="w-full flex flex-col gap-4">
          {offers.map((item, index) => (
            <div key={item.id} className="w-full flex flex-col gap-6">
              <OfferCard
                item={item}
                onClick={() => item.path && navigate(item.path)}
              />
              {index === 0 && (
                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 dark:text-slate-600 tracking-[0.2em] uppercase">
                    {t("dashboard.offers.or")}
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="h-10"></div>
      </div>
    </div>
  );
};
