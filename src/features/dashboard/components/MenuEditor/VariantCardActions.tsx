import { useTranslation } from "react-i18next";
import { Pencil, SlidersHorizontal } from "lucide-react";
import type { MenuItem } from "@/types/menuTypes";
import { useMenuStore } from "../../store/useMenuStore";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { StockControl } from "./StockControl";
import { ChargesEditor } from "./ChargesEditor";
import { TaxRateSelect } from "./TaxRateSelect";
import { itemFinalPrice } from "./menuPrice";

/**
 * 2026-11-11: the bottom of a card in the variants row, following the menu editor tab the same
 * way the parent card does:
 * - stock: the outlet / all-outlets availability switch (saved straight away);
 * - charges: the price + discount editor (saved straight away);
 * - taxes: the GST slab (queued for Review, like the parent card's);
 * - edit (and the onboarding menu step): Edit + Customize, as before.
 * Each variant has its own price, stock and tax rows, so it gets its own controls.
 * A variant that isn't saved yet (temp negative id) has nothing on the server to update, so stock
 * and charges say to save it first.
 */
interface VariantCardActionsProps {
  item: MenuItem;
  activeTab: string;
  canEdit: boolean; // false for outlet-level users: they may only change availability
  onEdit: () => void;
  onCustomize: () => void;
}

const actionClass =
  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-[var(--color-primary-blue)] dark:hover:bg-slate-700 dark:hover:text-blue-300 transition-colors";

export const VariantCardActions = ({ item, activeTab, canEdit, onEdit, onCustomize }: VariantCardActionsProps) => {
  const { t } = useTranslation();
  const updateMenuItem = useMenuStore((state) => state.updateMenuItem);
  const selectedCategoryId = useMenuStore((state) => state.selectedCategoryId);
  const selectedAddressId = useRestaurantStore((state) => state.selectedAddressId);
  const isUnsaved = item.id < 0;

  if ((activeTab === "stock" || activeTab === "charges") && isUnsaved) {
    return <p className="mt-auto pt-3 text-xs font-medium text-slate-400 dark:text-slate-500">{t("dashboard.menuEditor.variants.saveFirst")}</p>;
  }

  if (activeTab === "stock") {
    return (
      <div className="mt-auto pt-3 flex justify-end">
        <StockControl item={item} />
      </div>
    );
  }

  if (activeTab === "charges") {
    if (!canEdit) return null;
    return (
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
        <ChargesEditor item={item} finalPrice={itemFinalPrice(item)} />
      </div>
    );
  }

  if (activeTab === "taxes") {
    if (!canEdit || selectedCategoryId === null) return null;
    return (
      <div className="mt-auto pt-3 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("dashboard.menuEditor.taxLabel")}</span>
        <TaxRateSelect
          value={item.taxAmount}
          onChange={(rate) => updateMenuItem(selectedCategoryId, item.id, { taxAmount: rate }, selectedAddressId)}
          className="bg-transparent dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white outline-none cursor-pointer"
        />
      </div>
    );
  }

  if (!canEdit) return null;
  return (
    // mt-auto keeps the buttons on the bottom edge when a neighbour card is taller.
    <div className="mt-auto pt-3 flex gap-2">
      <button type="button" className={actionClass} onClick={onEdit}>
        <Pencil className="w-3.5 h-3.5" />
        {t("dashboard.menuEditor.variants.edit")}
      </button>
      <button type="button" className={actionClass} onClick={onCustomize}>
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {t("dashboard.menuEditor.variants.customize")}
      </button>
    </div>
  );
};
