import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IndianRupee, Loader2, Pencil, Percent } from "lucide-react";
import type { MenuItem } from "@/types/menuTypes";
import type { ItemOutletFields } from "../../api/menuApi";
import { useItemOutletSave } from "../../hooks/useItemOutletSave";
import { parseDiscount, validateDiscount } from "../offers/itemDiscount/itemDiscountDraft";
import { AllOutletsConfirmDialog } from "./AllOutletsConfirmDialog";

/**
 * 2026-11-11: the Charges tab's right-hand panel, saved straight away with its own Save button
 * (user decision: price and discount no longer go through the review list).
 * - One outlet picked: shows that outlet's net price; the editor starts from its values and saves
 *   for that outlet only.
 * - "All Locations": no price is shown (each outlet has its own); Edit opens price and discount at 0,
 *   says it applies to every outlet, sends only the fields the user changed, and asks to confirm.
 * Discount limits are the backend's (shared with the Item Level Discount page).
 */
interface ChargesEditorProps {
  item: MenuItem;
  finalPrice: number; // after discount, before packaging (computed by the card)
}

export const ChargesEditor = ({ item, finalPrice }: ChargesEditorProps) => {
  const { t } = useTranslation();
  const k = "dashboard.menuEditor.outletSave.";
  const { save, isAllOutlets, isSaving } = useItemOutletSave();
  const busy = isSaving(item.id);

  // Starting values: the outlet's own, or 0 for "All Locations" (there's no single value to show).
  const initial = isAllOutlets
    ? { price: "0", discount: "0", isAbsolute: true }
    : { price: String(item.itemPrice), discount: String(item.discountAmount || 0), isAbsolute: item.discountIsAbsolute };
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(initial.price);
  const [discount, setDiscount] = useState(initial.discount);
  const [isAbsolute, setIsAbsolute] = useState(initial.isAbsolute);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const priceChanged = price !== initial.price;
  const discountChanged = discount !== initial.discount || isAbsolute !== initial.isAbsolute;
  const priceValue = Number(price);
  const priceError = priceChanged && !(priceValue > 0) ? t(`${k}priceError`) : null;
  // Under "All Locations" each outlet's own price is checked by the backend, unless a new price is set here.
  const priceForCheck = priceChanged ? priceValue : isAllOutlets ? Number.POSITIVE_INFINITY : item.itemPrice;
  const discountErrorKey = discountChanged ? validateDiscount(discount, isAbsolute, priceForCheck) : null;
  const canSave = (priceChanged || discountChanged) && !priceError && !discountErrorKey && !busy;

  const open = () => {
    setPrice(initial.price);
    setDiscount(initial.discount);
    setIsAbsolute(initial.isAbsolute);
    setEditing(true);
  };

  const fields = (): ItemOutletFields => ({
    ...(priceChanged ? { itemPrice: priceValue } : {}),
    // The backend needs the ₹/% flag with every discount.
    ...(discountChanged ? { itemDiscount: parseDiscount(discount), isAbsoluteDiscount: isAbsolute } : {}),
  });

  const submit = async () => {
    // Under "All Locations" the card shows no prices, so there's nothing to update on it.
    const display: Partial<MenuItem> = isAllOutlets ? {} : {
      ...(priceChanged ? { itemPrice: priceValue } : {}),
      ...(discountChanged ? { discountAmount: parseDiscount(discount), discountIsAbsolute: isAbsolute } : {}),
    };
    if (await save(item, fields(), display)) {
      setConfirmOpen(false);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between lg:justify-center lg:flex-col lg:gap-1">
        {isAllOutlets ? (
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest lg:text-center">
            {t(`${k}allOutletsPrice`)}
          </span>
        ) : (
          <div className="flex flex-col lg:items-center">
            <span className="text-[10px] font-black text-[var(--color-primary-blue)] dark:text-[#539987] uppercase tracking-widest leading-none">
              {t("dashboard.menuEditor.netPrice")}
            </span>
            <span className="text-xl font-black text-[var(--color-primary-blue)] dark:text-[#539987]">
              ₹{(finalPrice + item.packagingCharges).toFixed(2)}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={open}
          aria-label={t(`${k}edit`)}
          className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-[var(--color-primary-blue)] transition-colors rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-1.5"
        >
          <Pencil className="w-4 h-4" />
          {isAllOutlets && <span className="text-xs font-bold">{t(`${k}edit`)}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {isAllOutlets && (
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-2.5 py-1.5">
          {t(`${k}appliesToAll`, { count: item.restaurantCount ?? 0 })}
        </p>
      )}

      {/* Price */}
      <div className="flex items-center justify-between">
        <label htmlFor={`price-${item.id}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {t("dashboard.menuEditor.originalPrice")}
        </label>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <input
            id={`price-${item.id}`}
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-16 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
          />
        </div>
      </div>
      {priceError && <p className="text-[11px] text-red-500">{priceError}</p>}

      {/* Discount: ₹ / % and amount */}
      <div className="flex items-center justify-between">
        <label htmlFor={`discount-${item.id}`} className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {t("dashboard.menuEditor.discountLabel")}
        </label>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              aria-pressed={isAbsolute}
              onClick={() => setIsAbsolute(true)}
              className={`p-1 rounded ${isAbsolute ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
            >
              <IndianRupee className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              aria-pressed={!isAbsolute}
              onClick={() => setIsAbsolute(false)}
              className={`p-1 rounded ${!isAbsolute ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400"}`}
            >
              <Percent className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <input
              id={`discount-${item.id}`}
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-14 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
            />
          </div>
        </div>
      </div>
      {discountErrorKey && (
        <p className="text-[11px] text-red-500">
          {t(`dashboard.offers.itemDiscountPage.errors.${discountErrorKey}`, { price: priceForCheck })}
        </p>
      )}

      {/* Cancel / Save */}
      <div className="flex items-center justify-end gap-2 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditing(false)}
          className="py-1.5 px-3 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {t(`${k}cancel`)}
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => (isAllOutlets ? setConfirmOpen(true) : submit())}
          className="py-1.5 px-3 text-[10px] font-black uppercase tracking-widest bg-[var(--color-primary-blue)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {busy && !isAllOutlets && <Loader2 className="w-3 h-3 animate-spin" />}
          {t(`${k}save`)}
        </button>
      </div>

      <AllOutletsConfirmDialog
        open={confirmOpen}
        isLoading={busy}
        title={t(`${k}priceAllTitle`, { name: item.name })}
        description={t(`${k}priceAllText`, { count: item.restaurantCount ?? 0 })}
        onConfirm={submit}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
};
