import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";
import { Loader2, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { getErrorMessage } from "@/utils/error";
import type { Category } from "@/types/menuTypes";
import type { BogoState } from "../../../api/restaurantOffersApi";
import { useSaveBogo } from "../../../hooks/useRestaurantOffers";
import { OfferMenuPageShell } from "../menu/OfferMenuPageShell";
import { OfferMenuTree } from "../menu/OfferMenuTree";
import { ancestorsOf, buildCategoryTree, withDescendants } from "../menu/offerMenuTree";
import { AppliedChip, BogoCategoryItems } from "./BogoCategoryItems";
import {
  type BogoDraft,
  categoryCoverage,
  draftFromServer,
  isDraftDirty,
  isDraftEmpty,
  itemCoverage,
  toSaveRequest,
  toggleAll,
  toggleCategory,
  toggleItem,
} from "./bogoSelection";

/**
 * 2026-11-11: the BOGO page for one outlet (BogoOffers mounts it once the outlet's BOGO state has
 * loaded, keyed by outlet so switching outlets starts fresh). Holds the unsaved ticks; the saved
 * state (server) drives the "Offer applied" chips. Save sends the whole selection.
 */
interface BogoEditorProps {
  restroId: string;
  server: BogoState;
  title: string;
  subtitle: string;
}

const CHECKBOX_CLASS = "size-5 data-[state=checked]:bg-secondary-orange data-[state=checked]:border-secondary-orange";

export const BogoEditor = ({ restroId, server, title, subtitle }: BogoEditorProps) => {
  const { t } = useTranslation();
  const k = "dashboard.offers.bogoPage.";
  const [draft, setDraft] = useState<BogoDraft>(() => draftFromServer(server));
  const saveBogo = useSaveBogo();
  const savedDraft = useMemo(() => draftFromServer(server), [server]);
  const dirty = isDraftDirty(draft, server);

  const save = async () => {
    try {
      const saved = await saveBogo.mutateAsync(toSaveRequest(draft, restroId));
      // The response is the new saved state; start the board from it (the query refetches too).
      setDraft(draftFromServer(saved));
      toast.success(t(saved.offerId ? `${k}toast.saved` : `${k}toast.ended`));
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}toast.failed`)));
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {dirty ? t(`${k}footer.unsaved`) : summary(t, k, draft)}
        {dirty && isDraftEmpty(draft) && server.offerId && (
          <span className="block text-xs text-red-500">{t(`${k}footer.willEnd`)}</span>
        )}
      </p>
      <div className="flex gap-3">
        {dirty && (
          <button
            type="button"
            disabled={saveBogo.isPending}
            onClick={() => setDraft(draftFromServer(server))}
            className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {t(`${k}footer.discard`)}
          </button>
        )}
        <button
          type="button"
          disabled={!dirty || saveBogo.isPending}
          onClick={save}
          className="h-11 px-6 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-secondary-orange/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
        >
          {saveBogo.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {t(`${k}footer.save`)}
        </button>
      </div>
    </div>
  );

  const banner = (
    <div className="space-y-4">
      {server.status === "PAUSED" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <PauseCircle className="w-5 h-5 shrink-0" />
          <p>
            {t(`${k}paused`)}{" "}
            <Link to="/dashboard/offers" className="font-bold underline">{t(`${k}openMyOffers`)}</Link>
          </p>
        </div>
      )}
      <label htmlFor="bogo-all" className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm px-5 py-4 cursor-pointer">
        <Checkbox
          id="bogo-all"
          checked={draft.allDishes}
          onCheckedChange={(value) => setDraft(toggleAll(draft, value === true))}
          className={CHECKBOX_CLASS}
        />
        <span className="flex-1">
          <span className="block text-base font-bold text-[#1a2b4b] dark:text-white">{t(`${k}selectAll`)}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`${k}selectAllHint`)}</span>
        </span>
        {server.allDishes && <AppliedChip />}
      </label>
    </div>
  );

  return (
    <OfferMenuPageShell title={title} subtitle={subtitle} needsOutlet={false} banner={banner} footer={footer}>
      {(categories) => <BogoTree categories={categories} draft={draft} saved={savedDraft} onChange={setDraft} />}
    </OfferMenuPageShell>
  );
};

/** Footer text when nothing is unsaved: what the saved BOGO covers. */
const summary = (t: TFunction, k: string, draft: BogoDraft) => {
  if (draft.allDishes) return t(`${k}footer.allDishes`);
  if (isDraftEmpty(draft)) return t(`${k}footer.off`);
  return t(`${k}footer.selection`, { categories: draft.categoryIds.length, dishes: draft.itemIds.length });
};

/** The category tree with BOGO checkboxes; split out so the tree indexes are computed per menu. */
const BogoTree = ({ categories, draft, saved, onChange }: {
  categories: Category[];
  draft: BogoDraft;
  saved: BogoDraft;
  onChange: (draft: BogoDraft) => void;
}) => {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const ancestors = useMemo(
    () => new Map(categories.map((c) => [c.id, ancestorsOf(c.id, categories)])),
    [categories],
  );

  return (
    <OfferMenuTree
      tree={tree}
      renderControl={(category) => {
        const { checked, locked } = categoryCoverage(draft, category.id, ancestors.get(category.id) ?? []);
        return (
          <Checkbox
            checked={checked}
            disabled={locked}
            aria-label={category.name}
            onCheckedChange={(value) => onChange(toggleCategory(draft, withDescendants(category.id, tree.childrenOf), value === true))}
            className={CHECKBOX_CLASS}
          />
        );
      }}
      renderBadge={(category) =>
        categoryCoverage(saved, category.id, ancestors.get(category.id) ?? []).checked ? <AppliedChip /> : null}
      renderItems={(category) => {
        const chain = [category.id, ...(ancestors.get(category.id) ?? [])];
        return (
          <BogoCategoryItems
            category={category}
            coverage={(itemId) => itemCoverage(draft, itemId, chain)}
            isApplied={(itemId) => itemCoverage(saved, itemId, chain).checked}
            onToggle={(itemId, on) => onChange(toggleItem(draft, itemId, category.id, on))}
          />
        );
      }}
    />
  );
};
