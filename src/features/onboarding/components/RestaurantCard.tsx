import { type Restaurant } from "@/types/restaurantTypes";
import {
  Bike,
  UtensilsCrossed,
  ChevronUp,
  PencilLine,
  User,
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

interface RestaurantCardProps {
  restaurant: Restaurant;
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

export const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const statusDisplay = getStatusDisplay(restaurant.status, t);
  const formattedAddress = formatAddress(restaurant.address);
  const { user } = useAuth();
  const { restaurantSettings, setRestaurantSettings } = useOnboardingStore();

  const settings = restaurantSettings[restaurant.restroId] || {
    servingOptions: ["DELIVERY"],
    hasDeliveryPartners: false,
    isDeliveryViaUSTART: false,
    management: { isUserManaging: true },
  };

  const [managers, setManagers] = useState<
    { name: string; mobile: string; email: string; whatsapp: string }[]
  >([]);
  // Mock API call to fetch managers
  useEffect(() => {
    const fetchManagers = async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setManagers([
        {
          name: "Rahul Sharma",
          mobile: "9876543210",
          email: "rahul@example.com",
          whatsapp: "9876543210",
        },
        {
          name: "Priya Verma",
          mobile: "9123456789",
          email: "priya@example.com",
          whatsapp: "9123456789",
        },
      ]);
    };
    fetchManagers();
  }, []);

  // Ensure management exists (for backward compatibility if any)
  const management = settings.management || { isUserManaging: true };
  const toggleServingOption = (
    option: "DELIVERY" | "DINE_IN",
    checked: boolean,
  ) => {
    const currentOptions = settings.servingOptions || [];
    const newOptions = checked
      ? [...new Set([...currentOptions, option])]
      : currentOptions.filter((o) => o !== option);

    setRestaurantSettings(restaurant.restroId, { servingOptions: newOptions });
  };

  const handleToggleDelivery = (checked: boolean) => {
    setRestaurantSettings(restaurant.restroId, {
      hasDeliveryPartners: checked,
    });
  };

  const handleToggleUStartDelivery = (checked: boolean) => {
    setRestaurantSettings(restaurant.restroId, {
      isDeliveryViaUSTART: checked,
    });
  };

  return (
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
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="line-clamp-1">
                    {formattedAddress || restaurant.address}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isExpanded ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20 ring-4 ring-primary-blue/10" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60"}`}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <PencilLine className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Summary Badges (Only shown when collapsed) */}
            {!isExpanded && (
              <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                {settings.servingOptions?.includes("DELIVERY") && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/50 border border-blue-100/50 shadow-sm">
                    <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Bike className="w-3 h-3 text-primary-blue" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">
                      {t("onboarding.restaurant.complete.card.deliveryLabel")}{" "}
                      {settings.isDeliveryViaUSTART &&
                        `(${t("onboarding.restaurant.complete.card.ustartLabel")})`}
                    </span>
                  </div>
                )}
                {settings.servingOptions?.includes("DINE_IN") && (
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
                          !settings.servingOptions?.includes("DELIVERY"),
                        )
                      }
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${settings.servingOptions?.includes("DELIVERY") ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
                    >
                      {t("onboarding.restaurant.complete.card.deliveryLabel")}
                    </button>
                    <button
                      onClick={() =>
                        toggleServingOption(
                          "DINE_IN",
                          !settings.servingOptions?.includes("DINE_IN"),
                        )
                      }
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${settings.servingOptions?.includes("DINE_IN") ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
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
                      checked={settings.hasDeliveryPartners}
                      onCheckedChange={handleToggleDelivery}
                    />
                  </div>

                  {settings.hasDeliveryPartners && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                          {t(
                            "onboarding.restaurant.complete.setupForm.deliveryBy",
                          )}
                        </Label>
                      </div>
                      <Tabs
                        value={settings.isDeliveryViaUSTART ? "USTART" : "SELF"}
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
                  setRestaurantSettings(restaurant.restroId, {
                    management: { ...management, isUserManaging: val },
                  })
                }
                managerDetails={management}
                managersList={managers as ManagerInfo[]}
                onSelectManagerFromList={(mgr) => {
                  setRestaurantSettings(restaurant.restroId, {
                    management: {
                      ...mgr,
                    },
                  });
                }}
                user={user || undefined}
                onSaveManager={(newMgr) => {
                  const existingIndex = managers.findIndex(
                    (m) => m.mobile === management.mobile,
                  );
                  if (existingIndex > -1) {
                    const updated = [...managers];
                    updated[existingIndex] = newMgr as any;
                    setManagers(updated);
                  } else {
                    setManagers((prev) => [...prev, newMgr as any]);
                  }

                  setRestaurantSettings(restaurant.restroId, {
                    management: {
                      ...newMgr,
                    },
                  });
                }}
                onRemoveManager={() => {
                  setRestaurantSettings(restaurant.restroId, {
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
          </div>
        </div>
      </div>
    </div>
  );
};
