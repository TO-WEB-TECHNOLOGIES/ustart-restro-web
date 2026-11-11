import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Category } from "@/types/menuTypes";
import type { CategoryTree } from "./offerMenuTree";

/**
 * 2026-11-11: the menu as collapsible category sections, shared by the BOGO and Item Level Discount
 * pages (same look as the menu editor's cards). The pages supply what differs:
 * - renderControl: something left of the category name (BOGO's category checkbox). It sits outside
 *   the accordion trigger so the checkbox isn't a button inside a button;
 * - renderBadge: a chip after the name ("Offer applied");
 * - renderItems: the category's dishes. Radix unmounts closed sections, so a category's dishes are
 *   fetched only when it's first opened.
 * Sub-categories nest inside their parent's section, after its own dishes.
 */

interface OfferMenuTreeProps {
  tree: CategoryTree;
  renderControl?: (category: Category) => ReactNode;
  renderBadge?: (category: Category) => ReactNode;
  renderItems: (category: Category) => ReactNode;
}

export const OfferMenuTree = (props: OfferMenuTreeProps) => (
  <CategoryList categories={props.tree.roots} depth={0} {...props} />
);

const CategoryList = ({ categories, depth, ...props }: OfferMenuTreeProps & { categories: Category[]; depth: number }) => {
  const { t } = useTranslation();
  if (categories.length === 0) return null;

  return (
    <Accordion type="multiple" className={depth === 0 ? "space-y-4" : "space-y-3 mt-3"}>
      {categories.map((category) => {
        const children = props.tree.childrenOf.get(category.id) ?? [];
        return (
          <AccordionItem
            key={category.id}
            value={String(category.id)}
            className={`border rounded-[24px] px-5 ${depth === 0
              ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm"
              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"}`}
          >
            <div className="flex items-center gap-3">
              {props.renderControl?.(category)}
              <AccordionTrigger className="hover:no-underline text-left gap-3">
                <span className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className={`font-bold text-[#1a2b4b] dark:text-white ${depth === 0 ? "text-base" : "text-sm"}`}>
                    {category.name}
                  </span>
                  {typeof category.itemCount === "number" && (
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {t("dashboard.offers.offerMenu.dishCount", { count: category.itemCount })}
                    </span>
                  )}
                  {props.renderBadge?.(category)}
                </span>
              </AccordionTrigger>
            </div>
            <AccordionContent>
              {props.renderItems(category)}
              <CategoryList {...props} categories={children} depth={depth + 1} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
