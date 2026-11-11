import { useTranslation } from "react-i18next";
import type { Category } from "@/types/menuTypes";
import { useOfferCategoryItems, OFFER_MENU_PAGE_SIZE } from "../../../hooks/useOfferMenu";
import { CategoryItemsState } from "../menu/CategoryItemsState";
import { DiscountItemRow } from "./DiscountItemRow";
import type { DiscountEdit } from "./itemDiscountDraft";

/**
 * 2026-11-11: one category's dishes with the outlet's prices (fetched with restroId, when the
 * category is first opened). Size variants (Half/Full) have their own price, so each gets its own
 * row under its dish.
 */
interface DiscountCategoryItemsProps {
  category: Category;
  restroId: string;
  edits: Record<number, DiscountEdit>;
  onChange: (itemId: number, edit: DiscountEdit | null) => void;
}

export const DiscountCategoryItems = ({ category, restroId, edits, onChange }: DiscountCategoryItemsProps) => {
  const { t } = useTranslation();
  const itemsQuery = useOfferCategoryItems(category.id, restroId);
  const items = itemsQuery.data?.items ?? [];

  if (itemsQuery.isLoading || itemsQuery.error || items.length === 0) {
    return (
      <CategoryItemsState
        isLoading={itemsQuery.isLoading}
        error={itemsQuery.error}
        isEmpty={items.length === 0}
        onRetry={() => itemsQuery.refetch()}
      />
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((item) => (
        <div key={item.id}>
          <DiscountItemRow item={item} edit={edits[item.id]} onChange={onChange} />
          {item.productVariants?.map((variant) => (
            <DiscountItemRow key={variant.id} item={variant} edit={edits[variant.id]} isVariant onChange={onChange} />
          ))}
        </div>
      ))}
      {(itemsQuery.data?.totalPages ?? 1) > 1 && (
        <p className="pt-3 text-xs text-slate-400 dark:text-slate-500">
          {t("dashboard.offers.offerMenu.moreItems", { count: OFFER_MENU_PAGE_SIZE })}
        </p>
      )}
    </div>
  );
};
