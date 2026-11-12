import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search, X } from "lucide-react";
import type { OutletStatusItem } from "../../api/outletStatusApi";
import { useOutletStatusList } from "../../hooks/useOutletStatus";
import { OutletToggle } from "./OutletToggle";
import { TONE_CLASSES, describeStatus } from "./outletTime";

/**
 * 2026-11-12: the "All Locations" outlet list on the Outlet Schedule page, built like the menu
 * editor's CategorySidebar (mobile header with close, search box, scrolling list, selected row
 * with a left border). Search runs on the server (300 ms debounce) so it covers every outlet, not
 * just the 10 the header's address list loads. Each row has its own open/closed switch.
 */
interface OutletListSidebarProps {
  selectedId: string | null;
  onSelect: (restroId: string) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

export const OutletListSidebar = ({ selectedId, onSelect, onClose, isCollapsed }: OutletListSidebarProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletSchedule.sidebar.";
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const list = useOutletStatusList(search, true);
  const outlets = list.data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Nothing picked yet: show the first outlet.
  useEffect(() => {
    if (!selectedId && outlets.length > 0) onSelect(outlets[0].restroId);
  }, [selectedId, outlets, onSelect]);

  return (
    <div className={`w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-opacity duration-200 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
      <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t(`${k}title`)}</span>
        <button type="button" onClick={onClose} aria-label={t(`${k}close`)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="hidden md:flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t(`${k}title`)}</span>
          {list.data && <span className="text-xs font-bold text-slate-400">{list.data.pages[0]?.totalItems ?? 0}</span>}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(`${k}search`)}
            aria-label={t(`${k}search`)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[var(--color-primary-blue)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {list.isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>
        ) : list.isError ? (
          <div className="px-4 py-6 text-center space-y-3">
            <p className="text-xs text-red-500">{t(`${k}loadFailed`)}</p>
            <button type="button" onClick={() => list.refetch()} className="text-xs font-bold text-[var(--color-primary-blue)] dark:text-blue-400">
              {t("dashboard.outletSchedule.retry")}
            </button>
          </div>
        ) : outlets.length === 0 ? (
          <p className="px-4 py-6 text-xs italic text-slate-400 text-center">{t(`${k}empty`)}</p>
        ) : (
          <>
            {outlets.map((outlet) => (
              <OutletRow
                key={outlet.restroId}
                outlet={outlet}
                selected={outlet.restroId === selectedId}
                onSelect={() => {
                  onSelect(outlet.restroId);
                  if (window.innerWidth < 768) onClose?.();
                }}
              />
            ))}
            {list.hasNextPage && (
              <div className="px-4 py-3">
                <button
                  type="button"
                  disabled={list.isFetchingNextPage}
                  onClick={() => list.fetchNextPage()}
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {list.isFetchingNextPage && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {t(`${k}loadMore`)}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const OutletRow = ({ outlet, selected, onSelect }: { outlet: OutletStatusItem; selected: boolean; onSelect: () => void }) => {
  const { t, i18n } = useTranslation();
  const { label, tone } = describeStatus(t, outlet.status, i18n.language);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={`group flex items-center justify-between gap-2 px-4 py-3 cursor-pointer border-l-4 transition-colors ${selected
        ? "bg-blue-50/50 dark:bg-blue-600/20 border-[var(--color-primary-blue)]"
        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent"}`}
    >
      <div className="min-w-0 flex items-start gap-2.5">
        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TONE_CLASSES[tone].dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{outlet.restroName}</p>
          <p className={`text-[11px] font-medium truncate ${TONE_CLASSES[tone].text}`}>{label}</p>
        </div>
      </div>
      <OutletToggle item={outlet} />
    </div>
  );
};
