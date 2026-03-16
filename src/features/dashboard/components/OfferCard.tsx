import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
  isPopular?: boolean;
  isHighlighted?: boolean;
  hasPattern?: boolean;
  hoverStyles: {
    card: string;
    icon: string;
    text: string;
    description: string;
  };
  baseStyles: {
    iconBg: string;
    iconColor: string;
  };
}

export const OfferCard = ({ item, onClick }: { item: OfferItem; onClick: () => void }) => {
  const { t } = useTranslation();
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left group transition-all duration-300 hover:scale-[1.01] ${item.isHighlighted ? 'scale-[1.02]' : ''}`}
    >
      <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border flex items-center justify-between relative overflow-hidden transition-all duration-300 ${item.isHighlighted ? 'border-secondary-orange shadow-lg shadow-secondary-orange/10 ring-1 ring-secondary-orange/20' : 'border-slate-100 dark:border-slate-800'} ${item.hoverStyles.card}`}>
        {item.isHighlighted && (
          <div className="absolute top-0 left-0 px-4 py-1.5 bg-secondary-orange text-white text-[10px] font-black rounded-br-xl uppercase tracking-widest z-20 shadow-sm translate-x-[-1px] translate-y-[-1px]">
            {t("dashboard.offers.recommended")}
          </div>
        )}
        {item.hasPattern && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/5 rounded-full -mr-16 -mt-32 blur-3xl pointer-events-none group-hover:bg-white/10"></div>
        )}
        
        <div className="flex items-center gap-5 relative z-10">
          <div className={`size-14 rounded-xl flex items-center justify-center transition-colors ${item.baseStyles.iconBg} ${item.baseStyles.iconColor} ${item.hoverStyles.icon}`}>
            {item.icon}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg font-bold transition-colors ${item.hoverStyles.text} text-primary-blue dark:text-white`}>
                {item.title}
              </h3>
              {item.isPopular && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-orange/10 text-secondary-orange uppercase tracking-wide border border-secondary-orange/20 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30">
                  {t("dashboard.offers.customerDelighters.popular")}
                </span>
              )}
            </div>
            <p className={`text-sm transition-colors ${item.hoverStyles.description} text-slate-500 dark:text-slate-400`}>
              {item.description}
            </p>
          </div>
        </div>
        <div className={`size-10 rounded-full flex items-center justify-center transition-colors bg-slate-50 dark:bg-slate-800 group-hover:bg-white/10`}>
          <ChevronRight className="text-slate-400 group-hover:text-white w-6 h-6" />
        </div>
      </div>
    </button>
  );
};
