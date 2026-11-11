import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error";
import type { Category } from "@/types/menuTypes";
import { updateItemDiscount } from "../../../api/menuApi";
import { OFFER_MENU_ITEMS_KEY } from "../../../hooks/useOfferMenu";
import { OfferMenuPageShell } from "../menu/OfferMenuPageShell";
import { OfferMenuTree } from "../menu/OfferMenuTree";
import { buildCategoryTree } from "../menu/offerMenuTree";
import { DiscountCategoryItems } from "./DiscountCategoryItems";
import { type DiscountEdit, parseDiscount, validateDiscount } from "./itemDiscountDraft";

/**
 * 2026-11-11: Item Level Discount for one outlet (the page keys it by outlet, so switching outlets
 * drops unsaved edits). One Save sends a PATCH per changed dish (the API has no batch endpoint,
 * same as the menu editor). Dishes that saved leave the edit list; dishes that failed stay, with
 * their names in the toast, so the user can retry without retyping.
 */
interface ItemDiscountEditorProps {
  restroId: string;
  title: string;
  subtitle: string;
}

export const ItemDiscountEditor = ({ restroId, title, subtitle }: ItemDiscountEditorProps) => {
  const { t } = useTranslation();
  const k = "dashboard.offers.itemDiscountPage.";
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<number, DiscountEdit>>({});
  const pending = Object.values(edits);
  const hasErrors = pending.some((e) => validateDiscount(e.discount, e.isAbsolute, e.price) !== null);

  const onChange = (itemId: number, edit: DiscountEdit | null) =>
    setEdits((prev) => {
      const next = { ...prev };
      if (edit) next[itemId] = edit;
      else delete next[itemId];
      return next;
    });

  const saveMutation = useMutation({
    mutationFn: (toSave: DiscountEdit[]) =>
      Promise.allSettled(toSave.map((e) => updateItemDiscount(e.itemId, restroId, parseDiscount(e.discount), e.isAbsolute))),
  });

  const save = async () => {
    const toSave = pending;
    const results = await saveMutation.mutateAsync(toSave);
    const failed = toSave.filter((_, i) => results[i].status === "rejected");
    const savedIds = new Set(toSave.filter((_, i) => results[i].status === "fulfilled").map((e) => e.itemId));
    setEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !savedIds.has(Number(id)))));
    // Reload the opened categories so rows show the saved discount as their new baseline.
    await queryClient.invalidateQueries({ queryKey: [...OFFER_MENU_ITEMS_KEY] });

    if (failed.length === 0) {
      toast.success(t(`${k}toast.saved`, { count: toSave.length }));
    } else {
      const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected")?.reason;
      toast.error(t(`${k}toast.partFailed`, {
        names: failed.map((e) => e.name).join(", "),
        reason: getErrorMessage(firstError, t(`${k}toast.failed`)),
      }));
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {pending.length > 0 ? t(`${k}footer.changed`, { count: pending.length }) : t(`${k}footer.none`)}
        {hasErrors && <span className="block text-xs text-red-500">{t(`${k}footer.fixErrors`)}</span>}
      </p>
      <div className="flex gap-3">
        {pending.length > 0 && (
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => setEdits({})}
            className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {t(`${k}footer.discard`)}
          </button>
        )}
        <button
          type="button"
          disabled={pending.length === 0 || hasErrors || saveMutation.isPending}
          onClick={save}
          className="h-11 px-6 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-secondary-orange/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {t(`${k}footer.save`)}
        </button>
      </div>
    </div>
  );

  const banner = (
    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-3">
      {t(`${k}note`)}
    </p>
  );

  return (
    <OfferMenuPageShell title={title} subtitle={subtitle} needsOutlet={false} banner={banner} footer={footer}>
      {(categories) => <DiscountTree categories={categories} restroId={restroId} edits={edits} onChange={onChange} />}
    </OfferMenuPageShell>
  );
};

/** The category tree with discount rows; the tree index is computed once per menu. */
const DiscountTree = ({ categories, ...rest }: {
  categories: Category[];
  restroId: string;
  edits: Record<number, DiscountEdit>;
  onChange: (itemId: number, edit: DiscountEdit | null) => void;
}) => {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  return <OfferMenuTree tree={tree} renderItems={(category) => <DiscountCategoryItems category={category} {...rest} />} />;
};
