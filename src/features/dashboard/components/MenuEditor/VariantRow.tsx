import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import type { MenuItem } from "../../../../types/menuTypes";
import { useMenuStore } from "../../store/useMenuStore";
import { getVariants } from "../../store/menuItemLookup";
import { useAuth } from "@/context/AuthContext";
import { CustomizationPanel } from "./CustomizationPanel";

/**
 * 2026-10-26: the expandable row under a menu item card showing the item and its variants
 * (horizontally scrollable). The item itself is the first entry, then saved and newly queued
 * variants, then a dotted "+ Add variant" card. Every card has Edit (the full prefilled Add Item
 * page, for the item and its variants alike - product decision) and Customize (the side panel
 * for the item's and its variants' customizations, opened on that card's tab). Item/variant edits
 * are queued and saved from Review; customizations are saved from the panel.
 */
interface VariantRowProps {
  parent: MenuItem;
}

const FOOD_DOT: Record<MenuItem["foodType"], string> = {
  VEG: "bg-green-600",
  NON_VEG: "bg-red-600",
  CONTAINS_EGG: "bg-yellow-500",
};

export const VariantRow = ({ parent }: VariantRowProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const updatedItems = useMenuStore((state) => state.updatedItems);
  // Row whose customizations the side panel is showing (null = closed).
  const [customizeRowId, setCustomizeRowId] = useState<number | null>(null);

  // Outlet-level users (restroId claim) can only change availability, so they can look at the
  // variants but not add or edit them.
  const canEdit = !user?.restroId;
  const variants = getVariants(parent, updatedItems);

  // Same base-path rule as MenuItemList: the onboarding menu step has its own /new route.
  const basePath = location.pathname.includes("/grow-with-ustart")
    ? "/grow-with-ustart/upload-menu"
    : "/dashboard/menu";

  // 2026-10-26: cards size with the row (was a fixed w-44, ~2.5 tiny cards visible): ~1.3 per
  // row on phones, 2 on tablets, ~3 on desktop (the 0.75rem terms are the gap-3 between cards).
  // The "+ Add variant" card uses the same width and stretches to the cards' height.
  const cardWidth = "w-[75%] sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]";

  const renderCard = (item: MenuItem, isParent: boolean) => {
    const image = item.image || parent.image;
    const isPending = !!updatedItems[item.id];
    const actionClass =
      "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-[var(--color-primary-blue)] dark:hover:bg-slate-700 dark:hover:text-blue-300 transition-colors";
    return (
      <div
        key={item.id}
        className={`snap-start shrink-0 ${cardWidth} rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm flex flex-col`}
      >
        {/* 4:3 frame: item images have no fixed ratio, object-cover fills it without distortion. */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {image ? (
            <img src={image} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          )}
          {isParent && (
            <span className="absolute top-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              {t("dashboard.menuEditor.variants.mainItem")}
            </span>
          )}
          {!isParent && isPending && (
            <span className="absolute top-2 left-2 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              {item.id < 0 ? t("dashboard.menuEditor.variants.new") : t("dashboard.menuEditor.edited")}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${FOOD_DOT[item.foodType] ?? FOOD_DOT.VEG}`} />
          <span className="text-base font-bold text-slate-900 dark:text-white truncate">{item.name}</span>
        </div>
        <p className="text-sm font-black text-[var(--color-primary-blue)] dark:text-blue-400 mt-1">
          ₹{(item.itemPrice ?? 0).toFixed(2)}
        </p>
        {canEdit && (
          // mt-auto keeps the buttons on the bottom edge when a neighbour card is taller.
          <div className="mt-auto pt-3 flex gap-2">
            <button
              type="button"
              className={actionClass}
              onClick={() => navigate(`${basePath}/new?edit=${item.id}`)}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("dashboard.menuEditor.variants.edit")}
            </button>
            <button type="button" className={actionClass} onClick={() => setCustomizeRowId(item.id)}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t("dashboard.menuEditor.variants.customize")}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-3 overflow-x-auto snap-x pb-2 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
      {renderCard(parent, true)}
      {variants.map((variant) => renderCard(variant, false))}
      {canEdit && (
        <button
          type="button"
          onClick={() => navigate(`${basePath}/new?variantOf=${parent.id}`)}
          className={`snap-start shrink-0 ${cardWidth} rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)] dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors`}
        >
          <Plus className="w-8 h-8" />
          <span className="text-sm font-bold">{t("dashboard.menuEditor.variants.add")}</span>
        </button>
      )}
      {canEdit && (
        <CustomizationPanel
          parent={parent}
          initialRowId={customizeRowId ?? parent.id}
          open={customizeRowId !== null}
          onOpenChange={(open) => !open && setCustomizeRowId(null)}
        />
      )}
    </div>
  );
};
