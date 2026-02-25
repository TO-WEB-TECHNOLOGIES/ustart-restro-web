import { type Restaurant } from "@/types/restaurantTypes";
import { restaurantService } from "@/api/restaurantService";
import {
  Bike,
  UtensilsCrossed,
  ChevronUp,
  PencilLine,
  User,
  Check,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  useOnboardingStore,
  type ManagerInfo,
} from "../store/useOnboardingStore";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManagerDetails } from "./common/ManagerDetails";
import { EditRestaurantModal } from "./EditRestaurantModal";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RestaurantCardProps {
  restaurant: Restaurant;
  isExpanded: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  onDeleteSuccess?: (restroId: string) => void;
}

const getStatusDisplay = (status: string, t: any) => {
  switch (status) {
    case "APPROVAL_PENDING":
    case "ACTION_REQUIRED":
    case "APPROVED_BUT_MENU_PENDING":
      return {
        label: t("onboarding.restaurant.complete.status.pending"),
        className: "bg-amber-100 text-amber-700",
      };
    case "ACTIVE":
      return {
        label: t("onboarding.restaurant.complete.status.active"),
        className: "bg-green-100 text-green-700",
      };
    case "RESTRICTED":
      return {
        label: t("onboarding.restaurant.complete.status.restricted"),
        className: "bg-orange-100 text-orange-700",
      };
    case "BLOCKED":
    case "REJECTED":
      return {
        label: t("onboarding.restaurant.complete.status.blocked"),
        className: "bg-red-100 text-red-700",
      };
    case "ON_HOLD":
      return {
        label: t("onboarding.restaurant.complete.status.onHold"),
        className: "bg-slate-100 text-slate-700",
      };
    case "UPDATE_APPROVAL_PENDING":
      return {
        label: t("onboarding.restaurant.complete.status.updateApproval"),
        className: "bg-blue-100 text-blue-700",
      };
    default:
      return { label: status, className: "bg-slate-100 text-slate-700" };
  }
};

const formatAddress = (address: string) => {
  if (!address) return "";
  return address
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && part.length > 0 && part.toLowerCase() !== "null")
    .join(", ");
};

export const RestaurantCard = ({
  restaurant,
  isExpanded,
  onToggle,
  showToggle = true,
  onDeleteSuccess,
}: RestaurantCardProps) => {
  const { t } = useTranslation();
  const statusDisplay = getStatusDisplay(restaurant.status, t);
  const formattedAddress = formatAddress(restaurant.address);
  const { user } = useAuth();
  const { setRestaurantSettings } = useOnboardingStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fullRestroData, setFullRestroData] = useState<Restaurant | null>(null);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRestaurant = async () => {
    setIsDeleting(true);
    try {
      await restaurantService.deleteRestaurant(restaurant.restroId);
      toast.success(t("common.success", "Restaurant deleted successfully"));
      sessionStorage.removeItem(`draft_settings_${restaurant.restroId}`);
      setShowDeleteConfirm(false);
      onDeleteSuccess?.(restaurant.restroId);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("common.error.generic", "Failed to delete restaurant"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAndOpenEditModal = async () => {
    setIsLoadingFullData(true);
    try {
      const data = await restaurantService.getRestaurantById(
        restaurant.restroId,
      );
      setFullRestroData(data);
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error(
        t("common.error.generic", "Failed to fetch restaurant details"),
      );
    } finally {
      setIsLoadingFullData(false);
    }
  };

  const computedInitial = {
    servingOptions:
      restaurant.servingOptions === "BOTH"
        ? ["DELIVERY", "DINE_IN"]
        : restaurant.servingOptions
          ? [restaurant.servingOptions]
          : ["DINE_IN"],
    hasDeliveryPartners: restaurant.doHaveDeliveryPartners ?? false,
    isDeliveryViaUSTART: restaurant.isDeliveryViaUSTART ?? false,
    management: {
      isUserManaging: restaurant.isAssociated ?? true,
      name: restaurant.managerName,
      mobile: restaurant.managerMobile,
      email: restaurant.managerEmail,
      whatsapp: restaurant.managerWhatsapp,
      userId: restaurant.associatedUserId,
    },
  };

  const [initialSettings, setInitialSettings] = useState<any>(computedInitial);

  const getSessionSettings = () => {
    try {
      const stored = sessionStorage.getItem(
        `draft_settings_${restaurant.restroId}`,
      );
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  };

  const [draftSettings, setDraftSettings] = useState<any>(
    getSessionSettings() || computedInitial,
  );

  const hasChanges =
    JSON.stringify(draftSettings) !== JSON.stringify(initialSettings);

  const updateDraft = (newDraft: any) => {
    setDraftSettings(newDraft);
    sessionStorage.setItem(
      `draft_settings_${restaurant.restroId}`,
      JSON.stringify(newDraft),
    );
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Only send fields that actually changed
      const payload: any = {};

      if (
        JSON.stringify(draftSettings.servingOptions) !==
        JSON.stringify(initialSettings.servingOptions)
      ) {
        payload.servingOptions = draftSettings.servingOptions;
      }

      if (
        draftSettings.hasDeliveryPartners !==
        initialSettings.hasDeliveryPartners
      ) {
        payload.doHaveDeliveryPartners = draftSettings.hasDeliveryPartners;
      }

      if (
        draftSettings.isDeliveryViaUSTART !==
        initialSettings.isDeliveryViaUSTART
      ) {
        payload.isDeliveryViaUSTART = draftSettings.isDeliveryViaUSTART;
      }

      const mgmtChanged =
        JSON.stringify(draftSettings.management) !==
        JSON.stringify(initialSettings.management);
      if (mgmtChanged) {
        payload.isUserManaging = draftSettings.management.isUserManaging;
        if (!draftSettings.management.isUserManaging) {
          if (draftSettings.management.userId) {
            payload.managerId = draftSettings.management.userId;
          } else {
            payload.managerName = draftSettings.management.name;
            payload.managerMobile = draftSettings.management.mobile;
            payload.managerEmail = draftSettings.management.email;
            payload.managerWhatsapp = draftSettings.management.whatsapp;
          }
        }
      }

      if (Object.keys(payload).length === 0) {
        toast.info(t("common.noChanges", "No changes to save"));
        setIsSaving(false);
        return;
      }

      await restaurantService.updateRestaurant(restaurant.restroId, payload);

      setRestaurantSettings(restaurant.restroId, draftSettings);
      sessionStorage.removeItem(`draft_settings_${restaurant.restroId}`);
      setInitialSettings(draftSettings);
      toast.success(t("common.success", "Restaurant updated successfully"));

      if (typeof window !== "undefined") {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("common.error.generic", "Failed to update restaurant"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardDraft = () => {
    setDraftSettings(initialSettings);
    sessionStorage.removeItem(`draft_settings_${restaurant.restroId}`);
  };

  // Extract associatedUsers from state
  const { associatedUsers } = useOnboardingStore();

  const [managers, setManagers] = useState<ManagerInfo[]>([]);
  useEffect(() => {
    if (!associatedUsers) return;
    const mapped = associatedUsers.map((u) => ({
      userId: u.userId,
      isUserManaging: false,
      name: u.name,
      email: u.email,
      mobile: u.mobileNumber,
      whatsapp: u.whatsappNumber,
    }));
    setManagers(mapped);

    // If restaurant has an associatedUserId, enrich management from the matched user
    if (restaurant.associatedUserId && !getSessionSettings()) {
      const matched = mapped.find(
        (m) => m.userId === restaurant.associatedUserId,
      );
      if (matched) {
        const enriched = {
          ...computedInitial,
          management: {
            ...computedInitial.management,
            name: matched.name || computedInitial.management.name,
            email: matched.email || computedInitial.management.email,
            mobile: matched.mobile || computedInitial.management.mobile,
            whatsapp: matched.whatsapp || computedInitial.management.whatsapp,
          },
        };
        // Update both so no false "hasChanges"
        setInitialSettings(enriched);
        setDraftSettings(enriched);
      }
    }
  }, [associatedUsers, restaurant.associatedUserId]);

  const management = draftSettings.management || { isUserManaging: true };
  const toggleServingOption = (
    option: "DELIVERY" | "DINE_IN",
    checked: boolean,
  ) => {
    const currentOptions = draftSettings.servingOptions || [];
    const newOptions = checked
      ? [...new Set([...currentOptions, option])]
      : currentOptions.filter((o: string) => o !== option);

    updateDraft({ ...draftSettings, servingOptions: newOptions });
  };

  const handleToggleDelivery = (checked: boolean) => {
    updateDraft({ ...draftSettings, hasDeliveryPartners: checked });
  };

  const handleToggleUStartDelivery = (checked: boolean) => {
    updateDraft({ ...draftSettings, isDeliveryViaUSTART: checked });
  };
  return (
    <>
      <div
        className={`group relative rounded-3xl border-2 transition-all duration-300 ${isExpanded ? "border-primary-blue bg-primary-blue/[0.02] shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-md"}`}
      >
        <div className="p-5">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Image Section */}
            <div className="relative w-full sm:w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
              <img
                src={
                  restaurant.primaryImage ||
                  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop"
                }
                alt={restaurant.restroName}
                className="w-full h-full object-cover transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-xl leading-tight group-hover:text-primary-blue transition-colors">
                      {restaurant.restroName}
                    </h4>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm ${statusDisplay.className}`}
                    >
                      {statusDisplay.label}
                    </span>
                    {hasChanges && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm bg-blue-100 text-primary-blue">
                        {t("common.edited")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <span className="line-clamp-1">
                      {formattedAddress || restaurant.address}
                    </span>
                  </div>

                  {/* View/Modify & Delete Action Buttons (Moved out of expanded area) */}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {(restaurant.status === "APPROVAL_PENDING" ||
                      restaurant.status === "ACTION_REQUIRED") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchAndOpenEditModal();
                        }}
                        disabled={isLoadingFullData}
                        className="px-5 py-2 rounded-xl border border-[#0F2441] text-[#0F2441] font-bold text-xs hover:bg-[#0F2441]/5 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto disabled:opacity-50 disabled:grayscale"
                      >
                        {isLoadingFullData
                          ? t("common.loading", "Loading...")
                          : t(
                              "onboarding.restaurant.complete.card.viewModifyDetails",
                              "View / Modify Details",
                            )}
                      </button>
                    )}

                    {/* Delete button for APPROVAL_PENDING only */}
                    {restaurant.status === "APPROVAL_PENDING" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
                        className="px-5 py-2 rounded-xl border border-red-300 text-red-600 font-bold text-xs hover:bg-red-50 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t("common.delete", "Delete")}
                      </button>
                    )}
                  </div>
                </div>

                {showToggle && (
                  <div className="flex items-center gap-2">
                    {!isExpanded && hasChanges && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveDraft();
                          }}
                          disabled={isSaving}
                          className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200 disabled:opacity-50 disabled:grayscale"
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDiscardDraft();
                          }}
                          disabled={isSaving}
                          className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50 disabled:grayscale"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={onToggle}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isExpanded ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20 ring-4 ring-primary-blue/10" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60"}`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6" />
                      ) : (
                        <PencilLine className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Badges (Only shown when collapsed) */}
              {!isExpanded && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  {draftSettings.servingOptions?.includes("DELIVERY") && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/50 border border-blue-100/50 shadow-sm">
                      <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Bike className="w-3 h-3 text-primary-blue" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {t("onboarding.restaurant.complete.card.deliveryLabel")}{" "}
                        {draftSettings.isDeliveryViaUSTART &&
                          `(${t("onboarding.restaurant.complete.card.ustartLabel")})`}
                      </span>
                    </div>
                  )}
                  {draftSettings.servingOptions?.includes("DINE_IN") && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50/50 border border-orange-100/50 shadow-sm">
                      <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {t("onboarding.restaurant.complete.card.dineInLabel")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/50 border border-slate-100/50 shadow-sm">
                    <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <User className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">
                      {t("onboarding.restaurant.complete.card.managedBy")}{" "}
                      {management.isUserManaging
                        ? user?.name ||
                          t("onboarding.restaurant.complete.card.owner")
                        : management.name ||
                          t("onboarding.restaurant.complete.card.manager")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editable Details Form */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? "max-h-[1200px] opacity-100 mt-8" : "max-h-0 opacity-0"}`}
          >
            <div className="pt-6 border-t border-slate-200/60 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left Column: Serving Options */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                        {t(
                          "onboarding.restaurant.complete.setupForm.servingOptions",
                        )}
                      </Label>
                      <p className="text-[10px] text-slate-500 pl-1">
                        {t("onboarding.restaurant.complete.card.diningHint")}
                      </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() =>
                          toggleServingOption(
                            "DELIVERY",
                            !draftSettings.servingOptions?.includes("DELIVERY"),
                          )
                        }
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${draftSettings.servingOptions?.includes("DELIVERY") ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
                      >
                        {t("onboarding.restaurant.complete.card.deliveryLabel")}
                      </button>
                      <button
                        onClick={() =>
                          toggleServingOption(
                            "DINE_IN",
                            !draftSettings.servingOptions?.includes("DINE_IN"),
                          )
                        }
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${draftSettings.servingOptions?.includes("DINE_IN") ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
                      >
                        {t("onboarding.restaurant.complete.card.dineInLabel")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Logistics */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-800">
                          {t(
                            "onboarding.restaurant.complete.setupForm.ownPartners",
                          )}
                        </Label>
                      </div>
                      <Switch
                        checked={draftSettings.hasDeliveryPartners}
                        onCheckedChange={handleToggleDelivery}
                      />
                    </div>

                    {draftSettings.hasDeliveryPartners && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                            {t(
                              "onboarding.restaurant.complete.setupForm.deliveryBy",
                            )}
                          </Label>
                        </div>
                        <Tabs
                          value={
                            draftSettings.isDeliveryViaUSTART
                              ? "USTART"
                              : "SELF"
                          }
                          onValueChange={(value) =>
                            handleToggleUStartDelivery(value === "USTART")
                          }
                          className="w-full"
                        >
                          <TabsList className="flex w-auto inline-flex bg-slate-100/50 p-1 rounded-xl gap-1 h-11">
                            <TabsTrigger
                              value="USTART"
                              className="px-6 rounded-lg data-[state=active]:bg-primary-blue data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs transition-all"
                            >
                              USTART
                            </TabsTrigger>
                            <TabsTrigger
                              value="SELF"
                              className="px-6 rounded-lg data-[state=active]:bg-primary-blue data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs transition-all"
                            >
                              {t(
                                "onboarding.restaurant.complete.setupForm.management.me",
                              )}
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Management Section */}
              <div className="pt-6 border-t border-slate-200/60 space-y-6">
                <ManagerDetails
                  isUserManaging={management.isUserManaging}
                  onToggleManaging={(val) =>
                    updateDraft({
                      ...draftSettings,
                      management: { ...management, isUserManaging: val },
                    })
                  }
                  managerDetails={management}
                  managersList={managers as ManagerInfo[]}
                  onSelectManagerFromList={(mgr) => {
                    updateDraft({
                      ...draftSettings,
                      management: {
                        ...mgr,
                      },
                    });
                  }}
                  user={user || undefined}
                  onSaveManager={(newMgr) => {
                    const existingIndex = managers.findIndex(
                      (m) =>
                        (m.userId && m.userId === management.userId) ||
                        m.mobile === management.mobile,
                    );
                    if (existingIndex > -1) {
                      const updated = [...managers];
                      updated[existingIndex] = newMgr as any;
                      setManagers(updated);
                    } else {
                      setManagers((prev) => [...prev, newMgr as any]);
                    }

                    updateDraft({
                      ...draftSettings,
                      management: {
                        ...newMgr,
                      },
                    });
                  }}
                  onRemoveManager={() => {
                    updateDraft({
                      ...draftSettings,
                      management: {
                        isUserManaging: false,
                        name: undefined,
                        mobile: undefined,
                        email: undefined,
                        whatsapp: undefined,
                      },
                    });
                  }}
                />
              </div>

              {/* Expanded Form Floating Actions */}
              {hasChanges && (
                <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 p-4 mt-6 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4">
                  <button
                    onClick={handleDiscardDraft}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    {t("common.discard")}
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#0F2441] text-white shadow-md shadow-[#0F2441]/20 hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t("common.saveChanges")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Edit Modal */}
      <EditRestaurantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          if (typeof window !== "undefined") {
            setTimeout(() => window.location.reload(), 1500);
          }
        }}
        restaurantData={fullRestroData}
      />

      {/* Discard Warning Modal for Edit Modal has been moved inside EditRestaurantModal, so we remove the duplicate here */}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t("common.warning", "Warning")}
        className="max-w-md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            {t(
              "onboarding.restaurant.complete.card.deleteConfirm",
              "Are you sure you want to delete this restaurant? This action cannot be undone.",
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="rounded-xl font-bold"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDeleteRestaurant}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t("common.delete", "Delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
