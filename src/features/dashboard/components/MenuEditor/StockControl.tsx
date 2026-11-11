import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { MenuItem } from "@/types/menuTypes";
import { useItemOutletSave } from "../../hooks/useItemOutletSave";
import { AllOutletsConfirmDialog } from "./AllOutletsConfirmDialog";

/**
 * 2026-11-11: a dish's availability on the menu editor's Stock tab, saved straight away.
 * - One outlet picked: that outlet's switch (isAvailable with restaurantId).
 * - "All Locations": "available in X of Y outlets" and a switch that sets every outlet, after a
 *   confirmation (isAvailable without restaurantId = all outlets).
 * Replaces the old switch, which read a key the list never filled (always "out of stock") and was
 * dropped before reaching the API.
 */
export const StockControl = ({ item }: { item: MenuItem }) => {
  const { t } = useTranslation();
  const k = "dashboard.menuEditor.outletSave.";
  const { save, outletId, isAllOutlets, isSaving } = useItemOutletSave();
  const [pending, setPending] = useState<boolean | null>(null); // value awaiting the all-outlets confirm
  const busy = isSaving(item.id);

  if (!isAllOutlets && outletId) {
    const inStock = item.inStock[outletId] ?? false;
    return (
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
        <span className={`hidden md:inline text-[10px] font-black uppercase tracking-widest ${inStock ? "text-green-500" : "text-red-500"}`}>
          {inStock ? t("dashboard.menuEditor.inStock") : t("dashboard.menuEditor.outOfStock")}
        </span>
        {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        <Switch
          checked={inStock}
          disabled={busy}
          onCheckedChange={(value) => save(item, { isAvailable: value }, { inStock: { ...item.inStock, [outletId]: value } })}
          className="data-[state=checked]:bg-[#539987]"
        />
      </div>
    );
  }

  const total = item.restaurantCount ?? 0;
  const available = item.availableRestaurantCount ?? 0;
  const confirm = async () => {
    if (pending === null) return;
    const ok = await save(item, { isAvailable: pending }, { availableRestaurantCount: pending ? total : 0 });
    if (ok) setPending(null);
  };

  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
      <span className={`text-xs font-bold ${available === 0 ? "text-red-500" : available === total ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
        {t(`${k}availableIn`, { available, total })}
      </span>
      {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      <Switch
        checked={total > 0 && available === total}
        disabled={busy || total === 0}
        onCheckedChange={(value) => setPending(value)}
        className="data-[state=checked]:bg-[#539987]"
      />
      <AllOutletsConfirmDialog
        open={pending !== null}
        isLoading={busy}
        title={t(pending ? `${k}stockAllOnTitle` : `${k}stockAllOffTitle`, { name: item.name })}
        description={t(`${k}stockAllText`, { count: total })}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      />
    </div>
  );
};

/** 2026-11-11: the Edit tab's small availability chip, from the same per-outlet data. */
export const AvailabilityBadge = ({ item }: { item: MenuItem }) => {
  const { t } = useTranslation();
  const { outletId } = useItemOutletSave();
  const chip = "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider";

  if (outletId) {
    const inStock = item.inStock[outletId] ?? false;
    return (
      <div className={`${chip} ${inStock ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"}`}>
        {inStock ? t("dashboard.menuEditor.inStock") : t("dashboard.menuEditor.outOfStock")}
      </div>
    );
  }
  const total = item.restaurantCount ?? 0;
  const available = item.availableRestaurantCount ?? 0;
  return (
    <div className={`${chip} ${available > 0 ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-red-50 text-red-600 dark:bg-red-900/20"}`}>
      {t("dashboard.menuEditor.outletSave.outletsShort", { available, total })}
    </div>
  );
};
