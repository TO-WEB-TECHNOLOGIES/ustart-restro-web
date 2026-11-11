import { useTranslation } from "react-i18next";
import { ImageIcon } from "lucide-react";
import type { MenuItem } from "@/types/menuTypes";

/**
 * 2026-11-11: a dish's picture, name and (optionally) description - the part of a row the BOGO
 * and Item Level Discount pages share. Same image fallback as the menu editor's item card.
 */
export const DishThumb = ({ item, showDescription = true }: { item: MenuItem; showDescription?: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 min-w-0 flex-1">
      <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" aria-label={t("dashboard.menuEditor.noImageShort")} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#1a2b4b] dark:text-white truncate">{item.name}</p>
        {showDescription && item.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  );
};
