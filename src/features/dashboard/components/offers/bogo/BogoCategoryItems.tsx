import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import type { Category } from "@/types/menuTypes";
import { useOfferCategoryItems, OFFER_MENU_PAGE_SIZE } from "../../../hooks/useOfferMenu";
import { DishThumb } from "../menu/DishThumb";
import { CategoryItemsState } from "../menu/CategoryItemsState";
import type { Coverage } from "./bogoSelection";

/**
 * 2026-11-11: one category's dishes on the BOGO page - checkbox, picture, name, description; no
 * prices (BOGO doesn't depend on them). Size variants aren't listed: the BOGO rule is on the dish.
 * Fetched when the category is first opened.
 */
interface BogoCategoryItemsProps {
  category: Category;
  coverage: (itemId: number) => Coverage; // ticks of the unsaved selection
  isApplied: (itemId: number) => boolean; // covered by the saved BOGO
  onToggle: (itemId: number, on: boolean) => void;
}

export const BogoCategoryItems = ({ category, coverage, isApplied, onToggle }: BogoCategoryItemsProps) => {
  const { t } = useTranslation();
  const itemsQuery = useOfferCategoryItems(category.id);
  const items = itemsQuery.data?.items ?? [];

  const state = (
    <CategoryItemsState
      isLoading={itemsQuery.isLoading}
      error={itemsQuery.error}
      isEmpty={items.length === 0}
      onRetry={() => itemsQuery.refetch()}
    />
  );
  if (itemsQuery.isLoading || itemsQuery.error || items.length === 0) return state;

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => {
        const { checked, locked } = coverage(item.id);
        const inputId = `bogo-item-${item.id}`;
        return (
          <label key={item.id} htmlFor={inputId} className={`flex items-center gap-4 py-3 ${locked ? "cursor-default" : "cursor-pointer"}`}>
            <Checkbox
              id={inputId}
              checked={checked}
              disabled={locked}
              onCheckedChange={(value) => onToggle(item.id, value === true)}
              className="size-5 data-[state=checked]:bg-secondary-orange data-[state=checked]:border-secondary-orange"
            />
            <DishThumb item={item} />
            {isApplied(item.id) && <AppliedChip />}
          </label>
        );
      })}
      {(itemsQuery.data?.totalPages ?? 1) > 1 && (
        <p className="pt-3 text-xs text-slate-400 dark:text-slate-500">
          {t("dashboard.offers.offerMenu.moreItems", { count: OFFER_MENU_PAGE_SIZE })}
        </p>
      )}
    </div>
  );
};

/** "Offer applied" chip: shows what the saved BOGO covers, whatever is ticked right now. */
export const AppliedChip = () => {
  const { t } = useTranslation();
  return (
    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold bg-terracotta-green/10 text-terracotta-green border-terracotta-green/20">
      {t("dashboard.offers.bogoPage.applied")}
    </span>
  );
};
