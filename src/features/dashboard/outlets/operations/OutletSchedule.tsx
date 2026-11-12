import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ALL_LOCATIONS_ID } from "@/types/storeTypes";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { OutletListSidebar } from "../../components/OutletSchedule/OutletListSidebar";
import { OutletScheduleView } from "../../components/OutletSchedule/OutletScheduleView";

/**
 * 2026-11-12: Operations → Outlet Schedule (was the "Outlet Status" Coming Soon link).
 * One outlet selected in the header: its schedule view. "All Locations": an outlet sidebar (search +
 * per-outlet switch) beside the view, laid out like the menu editor (collapsible on desktop, slide-in
 * with a floating button on mobile). Picking an outlet in the sidebar is page-local; it doesn't
 * change the header's location.
 */
const PAGE_CLASS = "bg-[#fdfbf7] dark:bg-slate-950 transition-colors duration-300";

export const OutletSchedule = () => {
  const { t } = useTranslation();
  const selectedAddressId = useRestaurantStore((state) => state.selectedAddressId);
  const isAll = !selectedAddressId || selectedAddressId === ALL_LOCATIONS_ID;
  const [sidebarOutlet, setSidebarOutlet] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const selectOutlet = useCallback((id: string) => setSidebarOutlet(id), []);

  if (!isAll) {
    return (
      <div className={`flex-1 min-h-[calc(100vh-64px)] p-4 md:p-6 lg:p-10 ${PAGE_CLASS}`}>
        <div className="max-w-6xl mx-auto">
          <OutletScheduleView key={selectedAddressId} restroId={selectedAddressId!} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full min-h-[calc(100vh-80px)] relative overflow-hidden ${PAGE_CLASS}`}>
      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        aria-label={t("dashboard.outletSchedule.sidebar.open")}
        className={`md:hidden fixed bottom-6 right-6 z-50 p-4 bg-[var(--color-primary-blue)] text-white rounded-full shadow-lg transition-transform active:scale-90 ${isSidebarOpen ? "scale-0" : "scale-100"}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className={`fixed md:relative inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out transform ${isSidebarOpen
        ? "translate-x-0 w-72"
        : "-translate-x-full md:translate-x-0 md:w-0"} bg-white dark:bg-slate-900 shadow-xl md:shadow-none`}>
        <OutletListSidebar
          selectedId={sidebarOutlet}
          onSelect={selectOutlet}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={!isSidebarOpen}
        />
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={t(isSidebarOpen ? "dashboard.outletSchedule.sidebar.close" : "dashboard.outletSchedule.sidebar.open")}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-400 hover:text-[var(--color-primary-blue)] transition-all transform hover:scale-105 active:scale-95"
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          {sidebarOutlet && <OutletScheduleView key={sidebarOutlet} restroId={sidebarOutlet} />}
        </div>
      </div>
    </div>
  );
};
