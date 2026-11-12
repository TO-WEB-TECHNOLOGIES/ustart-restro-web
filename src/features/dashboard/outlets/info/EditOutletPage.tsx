import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/error";
import { AddRestaurantForm } from "@/features/onboarding/components/AddRestaurantForm";
import { useOutletStore } from "@/features/onboarding/store/useOutletStore";
import { AllOutletsConfirmDialog } from "../../components/MenuEditor/AllOutletsConfirmDialog";
import { useAssociatedUsersReady, useOutletDetail, useRefreshOutletInfo } from "../../hooks/useOutletInfo";
import { INFO_PATH } from "../../components/OutletInfo/OutletCards";
import { OutletFormPage } from "./OutletFormPage";

/**
 * 2026-11-12: /dashboard/info/:restroId/edit - the outlet form in edit mode, as a full page.
 * - Bank accounts are hidden (managed separately on the detail page), and so is the outlet
 *   manager (the PATCH would re-run manager reassignment); limits are shown.
 * - Saving sends the outlet for approval (UPDATE_APPROVAL_PENDING), which takes it offline until an
 *   admin approves (user decision), so the save is confirmed first. Pre-live outlets
 *   (APPROVAL_PENDING, APPROVED_BUT_MENU_PENDING) keep their status and skip the confirmation.
 * - A setup-locked outlet goes back to its page (the PATCH would reject its fields).
 */
const NO_STATUS_CHANGE = ["APPROVAL_PENDING", "APPROVED_BUT_MENU_PENDING"];

export const EditOutletPage = () => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.";
  const { restroId } = useParams<{ restroId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ready = useAssociatedUsersReady(user?.id);
  const detail = useOutletDetail(restroId);
  const refresh = useRefreshOutletInfo();
  // Resolver of the pending confirmBeforeSave promise while the dialog is open.
  const [confirming, setConfirming] = useState<((ok: boolean) => void) | null>(null);
  const detailPath = `${INFO_PATH}/${restroId}`;

  useEffect(() => {
    useOutletStore.getState().resetForm();
  }, []);

  const outlet = detail.data;
  if (outlet?.isSetupLocked) return <Navigate to={detailPath} replace />;

  const confirmBeforeSave = outlet && !NO_STATUS_CHANGE.includes(outlet.status)
    ? () => new Promise<boolean>((resolve) => setConfirming(() => resolve))
    : undefined;
  const answer = (ok: boolean) => {
    confirming?.(ok);
    setConfirming(null);
  };

  return (
    <OutletFormPage
      backTo={detailPath}
      backLabel={t(`${k}editPage.back`)}
      title={outlet ? t(`${k}editPage.title`, { name: outlet.restroName }) : t(`${k}edit`)}
      subtitle={t(`${k}editPage.subtitle`)}
    >
      {detail.isError ? (
        <p className="px-6 md:px-10 py-12 text-sm font-medium text-red-500">{getErrorMessage(detail.error, t(`${k}loadFailed`))}</p>
      ) : !outlet || !ready ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-secondary-orange animate-spin" /></div>
      ) : (
        <AddRestaurantForm
          isEditMode
          scrollable={false}
          initialData={outlet}
          showBankSection={false}
          showLimits
          showManagerSection={false}
          confirmBeforeSave={confirmBeforeSave}
          onCancel={() => navigate(detailPath)}
          onSuccess={async () => {
            await refresh();
            navigate(detailPath);
          }}
        />
      )}

      <AllOutletsConfirmDialog
        open={confirming !== null}
        title={t(`${k}editPage.confirmTitle`)}
        description={t(`${k}editPage.confirmText`)}
        confirmLabel={t(`${k}editPage.confirm`)}
        cancelLabel={t(`${k}editPage.keepEditing`)}
        onConfirm={() => answer(true)}
        onClose={() => answer(false)}
      />
    </OutletFormPage>
  );
};
