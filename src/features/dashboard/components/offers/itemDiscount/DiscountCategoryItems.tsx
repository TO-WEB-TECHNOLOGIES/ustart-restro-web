import { useTranslation } from "react-i18next";
import type { Category } from "@/types/menuTypes";
import { useOfferCategoryItems, OFFER_MENU_PAGE_SIZE } from "../../../hooks/useOfferMenu";
import { CategoryItemsState } from "../menu/CategoryItemsState";
import { DiscountItemRow } from "./DiscountItemRow";
import type { DiscountEdit } from "./itemDiscountDraft";

/**
 * 2026-11-11: one category's dishes with the outlet's prices (fetched with restroId, when the
 * category is first opened). Size variants (Half/Full) have their own price, so each gets its own
 * row, grouped in an indented sub-list under its dish (2026-11-12).
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
          {/* 2026-11-12 (user request): variants as an always-open sub-list under their dish, so
              they read as the dish's sizes rather than separate dishes. Each still has its own
              price and discount row. */}
          {item.productVariants && item.productVariants.length > 0 && (
            <div className="ml-4 md:ml-10 mb-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
              <p className="pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("dashboard.offers.itemDiscountPage.variants", { count: item.productVariants.length })}
              </p>
              {item.productVariants.map((variant) => (
                <DiscountItemRow key={variant.id} item={variant} edit={edits[variant.id]} isVariant onChange={onChange} />
              ))}
            </div>
          )}
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
