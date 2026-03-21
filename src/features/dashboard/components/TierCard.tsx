import { Check, Star } from "lucide-react";
import type { QuickSetupTierSection } from "../api/data/mockData";

interface TierCardProps {
  id: string;
  name: string;
  desc: string;
  recommended?: boolean;
  recommendedLabel: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  checkColor: string;
  accentBorder: string;
  sections: (Omit<QuickSetupTierSection, "labelKey"> & { label: string })[];
  isSelected: boolean;
  onSelect: () => void;
}

export const TierCard = ({
  id,
  name,
  desc,
  recommended,
  recommendedLabel,
  Icon,
  iconBg,
  iconColor,
  checkColor,
  accentBorder,
  sections,
  isSelected,
  onSelect,
}: TierCardProps) => {
  return (
    <label
      onClick={onSelect}
      className={[
        "relative flex flex-col p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 cursor-pointer transition-all duration-200",
        recommended
          ? `shadow-xl shadow-primary-blue/5 scale-[1.02] z-10 ${isSelected ? accentBorder : "border-slate-200 dark:border-slate-700"}`
          : isSelected
            ? `${accentBorder} shadow-sm`
            : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm",
      ].join(" ")}
    >
      <input
        type="radio"
        name="boost_tier"
        value={id}
        className="sr-only"
        checked={isSelected}
        onChange={onSelect}
      />

      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-blue text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap">
          <Star className="w-3 h-3" />
          {recommendedLabel}
        </div>
      )}

      {/* Icon + selector indicator */}
      <div className={`flex justify-between items-start mb-4 ${recommended ? "pt-2" : ""}`}>
        <div className={`p-3 ${iconBg} ${iconColor} rounded-xl`}>
          <Icon className="w-7 h-7" />
        </div>
        <div
          className={[
            "size-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            isSelected
              ? `${accentBorder} ${accentBorder.replace("border-", "bg-")}`
              : "border-slate-200 dark:border-slate-600",
          ].join(" ")}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>

      {/* Name & description */}
      <div className="mb-4">
        <h3 className={`font-bold text-primary-blue dark:text-white ${recommended ? "text-2xl" : "text-xl"}`}>
          {name}
        </h3>
        <p
          className={`text-xs font-medium mt-2 leading-relaxed h-8 ${
            recommended ? "text-primary-blue/70 dark:text-blue-200/70" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {desc}
        </p>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

      {/* Discount sections */}
      <div className="space-y-5 flex-1">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
              {section.label}
            </p>
            <ul className="space-y-3">
              {section.items.map((item) => (
                <li key={item.promo} className="flex gap-2.5 items-start">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${checkColor}`} />
                  <div>
                    <span className={`font-bold text-primary-blue dark:text-white block ${recommended ? "text-sm" : "text-xs"}`}>
                      {item.promo}: {item.pct}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{item.sub}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </label>
  );
};
