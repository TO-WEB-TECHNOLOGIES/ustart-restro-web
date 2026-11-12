import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Restaurant } from "@/types/restaurantTypes";
import { AddRestaurantForm } from "@/features/onboarding/components/AddRestaurantForm";
import { useOutletStore } from "@/features/onboarding/store/useOutletStore";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useAssociatedUsersReady, useRefreshOutletInfo } from "../../hooks/useOutletInfo";
import { INFO_PATH } from "../../components/OutletInfo/OutletCards";
import { OutletFormPage } from "./OutletFormPage";

/**
 * 2026-11-12: /dashboard/info/new - add an outlet with the onboarding outlet form, as a full page.
 * The backend creates it as APPROVAL_PENDING (admin approves it before it goes live). On success:
 * refresh Outlet Info and the live status, add it to the header's location list, open its page.
 * Outlet-level logins can't add outlets, so they're sent back to Outlet Info.
 */
export const AddOutletPage = () => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.";
  const navigate = useNavigate();
  const { user } = useAuth();
  const ready = useAssociatedUsersReady(user?.id);
  const refresh = useRefreshOutletInfo();
  const addAddress = useRestaurantStore((state) => state.addAddress);

  // The form's image previews live in a shared store; start clean (not a previous add/edit's).
  useEffect(() => {
    useOutletStore.getState().resetForm();
  }, []);

  if (user?.restroId) return <Navigate to={INFO_PATH} replace />;

  const onSuccess = async (outlet: Restaurant) => {
    addAddress({ id: outlet.restroId, label: outlet.restroName, address: outlet.address });
    await refresh();
    navigate(`${INFO_PATH}/${outlet.restroId}`);
  };

  return (
    <OutletFormPage backTo={INFO_PATH} backLabel={t(`${k}back`)} title={t(`${k}add.title`)} subtitle={t(`${k}add.subtitle`)}>
      {ready ? (
        <AddRestaurantForm scrollable={false} onCancel={() => navigate(INFO_PATH)} onSuccess={onSuccess} />
      ) : (
        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-secondary-orange animate-spin" /></div>
      )}
    </OutletFormPage>
  );
};
