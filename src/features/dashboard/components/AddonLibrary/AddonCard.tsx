import { useTranslation } from "react-i18next";
import { Ban, EyeOff, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Addon } from "../../api/addonLibraryApi";
import { FoodTypeMarker } from "../MenuEditor/MenuItemCard";
import { formatTaxRate } from "../MenuEditor/TaxRateSelect";

/**
 * 2026-10-27: one add-on in the library list - image, food marker, default price and tax (no
 * packaging: add-ons don't take one, product decision). Brand users get Edit / Delete; outlet users get only their outlet's in-stock box
 * (product decision: read-only + stock toggle).
 * Styled after the menu editor's MenuItemCard (product feedback: same look), reusing its
 * FoodTypeMarker, badge and action-button styles. Stock uses the shadcn Checkbox, not the menu's
 * Switch: components/ui/switch.tsx has no Radix behind it (CLAUDE.local.md §1).
 */
interface AddonCardProps {
  addon: Addon;
  canManage: boolean;
  isStockPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStockChange: (isAvailable: boolean) => void;
}

const K = "dashboard.addonLibrary.";
const BADGE = "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider";

export const AddonCard = ({ addon, canManage, isStockPending, onEdit, onDelete, onStockChange }: AddonCardProps) => {
  const { t } = useTranslation();
  const isOff = !addon.isActive || addon.isAdminDeactivated;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col sm:flex-row sm:items-center gap-4 ${isOff ? "opacity-60" : ""}`}
    >
      <div className="w-full sm:w-24 h-48 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
        {addon.imageUrl ? (
          <img src={addon.imageUrl} alt={addon.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <FoodTypeMarker type={addon.foodType} />
            <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
              {addon.name}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Why it is hidden from customers, when it is */}
            {addon.isAdminDeactivated ? (
              <div className={`${BADGE} bg-slate-900 text-white dark:bg-slate-800`} title={t(`${K}adminDeactivated`)}>
                <Ban className="w-3 h-3" />
                <span>{t("dashboard.menuEditor.blocked")}</span>
              </div>
            ) : (
              !addon.isActive && (
                <div className={`${BADGE} bg-orange-50 dark:bg-orange-900/20 text-orange-600`}>
                  <EyeOff className="w-3 h-3" />
                  <span>{t(`${K}inactive`)}</span>
                </div>
              )
            )}

            {canManage ? (
              <>
                <div
                  className={`${BADGE} ${addon.isAvailable ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"}`}
                >
                  {addon.isAvailable ? t("dashboard.menuEditor.inStock") : t("dashboard.menuEditor.outOfStock")}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onEdit}
                    title={t(`${K}edit`)}
                    aria-label={t(`${K}edit`)}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[var(--color-primary-blue)] dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    title={t(`${K}delete`)}
                    aria-label={t(`${K}delete`)}
                    className="p-2 rounded-xl transition-colors bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              // Outlet users: their own outlet's stock, in the menu card's stock pill.
              <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${addon.isAvailable ? "text-green-500" : "text-red-500"}`}
                >
                  {addon.isAvailable ? t("dashboard.menuEditor.inStock") : t("dashboard.menuEditor.outOfStock")}
                </span>
                <Checkbox
                  checked={addon.isAvailable}
                  disabled={isStockPending || isOff}
                  onCheckedChange={(v) => onStockChange(v === true)}
                  aria-label={t("dashboard.menuEditor.inStock")}
                />
              </label>
            )}
          </div>
        </div>

        <p
          className={`text-xs mb-1 line-clamp-1 ${addon.description ? "text-slate-500 dark:text-slate-400" : "text-orange-500 font-medium italic"}`}
        >
          {addon.description || t("dashboard.menuEditor.noDescription")}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-base font-black text-slate-900 dark:text-white">₹{addon.price}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            + {formatTaxRate(t, addon.taxPercentage)} {t("dashboard.menuEditor.taxLabel")}
          </span>
        </div>
      </div>
    </div>
  );
};
