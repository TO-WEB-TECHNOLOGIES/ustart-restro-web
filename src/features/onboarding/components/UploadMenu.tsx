import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { CategorySidebar } from "../../dashboard/components/MenuEditor/CategorySidebar";
import { MenuItemList } from "../../dashboard/components/MenuEditor/MenuItemList";
import { AddItemPage } from "../../dashboard/components/MenuEditor/AddItemPage";
import { useMenu } from "../../dashboard/hooks/useMenu";
import {
  Loader2,
  PanelLeftOpen,
  PanelLeftClose,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { onboardingService } from "../api/onboardingService";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/**
 * UploadMenu component for the onboarding flow.
 * Reuses components from the Dashboard MenuEditor to provide a rich, consistent experience.
 */
export const UploadMenu = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    fetchCategories,
    isCategoriesLoading,
    categories,
    isSubmitting,
    isDirty,
    submitChanges,
  } = useMenu();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const isAddPage = location.pathname.endsWith("/new");

  /**
   * Fetch menu categories on component mount.
   */
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Handles the final step of the onboarding menu setup.
   * Persists any pending menu changes and then completes the onboarding step via the service.
   */
  const handleFinalSubmit = async () => {
    setIsCompleting(true);
    try {
      // First submit any pending menu changes if dirty
      if (isDirty) {
        await submitChanges();
      }

      const response = await onboardingService.completeOnboarding();

      // Refresh JWT tokens for the current session to reflect ACTIVE status
      if (response.accessToken && response.refreshToken) {
        login(response.accessToken, response.refreshToken);
      }

      toast.success("Onboarding completed successfully!");
      navigate("/grow-with-ustart/verification");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to complete onboarding"));
    } finally {
      setIsCompleting(false);
    }
  };

  if (isCategoriesLoading && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] w-full bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary-blue)] mb-4" />
        <p className="text-slate-500 font-bold">
          {t("dashboard.menuEditor.loadingMenu")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-slate-50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Category Sidebar - Desktop collapsible, Mobile overlay */}
        <div
          className={`
                            fixed md:relative inset-y-0 left-0 z-40 md:z-auto
                            transition-all duration-300 ease-in-out transform
                            ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:w-0"}
                            bg-white shadow-xl md:shadow-none
                        `}
        >
          <CategorySidebar
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={!isSidebarOpen}
            hideScore={true}
          />

          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 p-1.5 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-[var(--color-primary-blue)] transition-all hover:scale-110 active:scale-90"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mobile Backdrop Overlay */}
        {!isAddPage && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Menu Management Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-white relative">
          {isAddPage ? (
            <AddItemPage />
          ) : (
            <MenuItemList onOpenSidebar={() => setIsSidebarOpen(true)} />
          )}
        </div>

        {/* Floating Actions Container */}
        {!isAddPage && (
          <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Save Changes Floating Bar - Only shown when dirty */}
            {isDirty && (
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-blue-100 shadow-xl pointer-events-auto animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-[var(--color-primary-blue)] rounded-xl">
                  <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {t(
                      "dashboard.menuEditor.tabs.unsavedChanges",
                      "Unsaved Changes",
                    )}
                  </span>
                </div>

                <button
                  onClick={submitChanges}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t("dashboard.menuEditor.submitChanges", "Save Changes")
                  )}
                </button>
              </div>
            )}

            {/* Finish & Complete Button */}
            <Button
              onClick={handleFinalSubmit}
              disabled={isCompleting || isSubmitting}
              className="bg-slate-900 hover:bg-black text-white px-8 h-14 rounded-2xl flex items-center gap-4 shadow-2xl shadow-black/20 transition-all active:scale-95 group border border-slate-700/30 backdrop-blur-md pointer-events-auto"
            >
              {isCompleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              )}
              <span className="font-black text-sm uppercase tracking-widest">
                {t("common.finishAndComplete", "Finish & Complete")}
              </span>
              {!isCompleting && <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Global Submission / Completion Overlay */}
      {(isSubmitting || isCompleting) && (
        <div className="absolute inset-0 z-[60] bg-white/60 backdrop-blur-[4px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <Loader2 className="w-14 h-14 animate-spin text-[var(--color-primary-blue)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-[var(--color-primary-blue)] rounded-full" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {isCompleting
                  ? t(
                      "onboarding.steps.upload.completing",
                      "Finalizing Onboarding...",
                    )
                  : t(
                      "dashboard.menuEditor.submittingChanges",
                      "Saving Your Menu...",
                    )}
              </h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">
                {t("dashboard.menuEditor.pleaseWait", "Please wait a moment")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
