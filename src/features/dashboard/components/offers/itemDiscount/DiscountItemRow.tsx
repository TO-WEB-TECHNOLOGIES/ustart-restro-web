import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import type { MenuItem } from "@/types/menuTypes";
import { DishThumb } from "../menu/DishThumb";
import { type DiscountEdit, applyChange, finalPrice, rowValues, validateDiscount } from "./itemDiscountDraft";

/**
 * 2026-11-11: one dish (or size variant) on the Item Level Discount page: picture, name, price,
 * ₹/% switch, discount box and the price after discount. Edited rows are highlighted; a row
 * edited back to its saved value is no longer "edited" (applyChange returns null).
 */
interface DiscountItemRowProps {
  item: MenuItem;
  edit?: DiscountEdit;
  isVariant?: boolean;
  onChange: (itemId: number, edit: DiscountEdit | null) => void;
}

export const DiscountItemRow = ({ item, edit, isVariant = false, onChange }: DiscountItemRowProps) => {
  const { t } = useTranslation();
  const k = "dashboard.offers.itemDiscountPage.";
  const { discount, isAbsolute } = rowValues(item, edit);
  const error = validateDiscount(discount, isAbsolute, item.itemPrice);
  const after = finalPrice(item.itemPrice, discount, isAbsolute);
  const change = (patch: { discount?: string; isAbsolute?: boolean }) => onChange(item.id, applyChange(item, edit, patch));

  return (
    <div className={`flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 py-3 px-3 -mx-3 rounded-2xl transition-colors ${edit
      ? "bg-orange-50/70 dark:bg-orange-500/10"
      : ""}`}>
      <DishThumb item={item} showDescription={!isVariant} />

      <div className="flex items-center gap-3 md:justify-end shrink-0">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 w-16 md:text-right">₹{item.itemPrice}</span>

        {/* ₹ / % switch, same segmented look as the menu editor's charges tab */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5" role="group" aria-label={t(`${k}type`)}>
          {[true, false].map((absolute) => (
            <button
              key={String(absolute)}
              type="button"
              aria-pressed={isAbsolute === absolute}
              onClick={() => change({ isAbsolute: absolute })}
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${isAbsolute === absolute
                ? "bg-white dark:bg-slate-700 text-[#1a2b4b] dark:text-white shadow-sm"
                : "text-slate-400"}`}
            >
              {absolute ? "₹" : "%"}
            </button>
          ))}
        </div>

        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={discount}
          aria-label={t(`${k}discountFor`, { name: item.name })}
          aria-invalid={error !== null}
          onChange={(e) => change({ discount: e.target.value })}
          className="w-20 h-9 rounded-lg text-sm font-bold dark:bg-slate-900 dark:border-slate-700"
        />

        <div className="w-24 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t(`${k}finalPrice`)}</p>
          <p className="text-sm font-black text-terracotta-green">₹{after}</p>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500 md:basis-full md:order-last">
          {t(`${k}errors.${error}`, { price: item.itemPrice })}
        </p>
      )}
    </div>
  );
};
