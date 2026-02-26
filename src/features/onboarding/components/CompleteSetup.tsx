import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowRight, FileUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { restaurantService } from "@/api/restaurantService";
import { type Restaurant } from "@/types/restaurantTypes";
import { RestaurantCard } from "./RestaurantCard";
import { AddRestaurantCard } from "./AddRestaurantCard";
import { AddRestaurantForm } from "./AddRestaurantForm";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { BulkScheduleModal } from "./common/BulkScheduleModal";
import { type RestroDay } from "@/types/restaurantTypes";

// --- Main Component ---

export const CompleteSetup = () => {
  const { t } = useTranslation();
  const { isMultipleRestro, setIsMultipleRestro, user } = useAuth();
  const [initialIsMultipleRestro] = useState(isMultipleRestro);
  const navigate = useNavigate();

  // View state: 'list' is the main dashboard, 'add' is the new form
  const [view, setView] = useState<"list" | "add">("list");

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [schedules, setSchedules] = useState<Record<string, RestroDay[]>>({});
  const [isLoadingRestros, setIsLoadingRestros] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "multi">(
    isMultipleRestro ? "multi" : "single",
  );
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState(false);
  const { associatedUsers, setAssociatedUsers } = useOnboardingStore();

  const allSchedulesVerified =
    restaurants.length > 0 &&
    restaurants.every((restro) => {
      const restroDays = schedules[restro.restroId] || [];
      return restroDays.some((d) => !d.isClosed);
    });

  // Fetch Restaurants and Associated Users
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingRestros(true);
      try {
        const [restaurantsRes, usersRes] = await Promise.all([
          restaurantService.getRestaurants(),
          // Only fetch users if not already cached
          associatedUsers.length > 0
            ? Promise.resolve(associatedUsers)
            : restaurantService.getAssociatedUsers(),
        ]);

        const restaurants = restaurantsRes.content;
        setRestaurants(restaurants);

        if (associatedUsers.length === 0 && Array.isArray(usersRes)) {
          // Filter out the current user
          const filteredUsers = usersRes.filter(
            (u: { userId: string }) => u.userId !== user?.id,
          );
          setAssociatedUsers(filteredUsers);
        }

        // Fetch schedules for all restaurants
        const schedulePromises = restaurants.map((r) =>
          restaurantService.getSchedule(r.restroId).catch(() => null),
        );
        const scheduleResults = await Promise.all(schedulePromises);

        const newSchedules: Record<string, RestroDay[]> = {};
        restaurants.forEach((r, idx) => {
          if (scheduleResults[idx] && scheduleResults[idx].data?.days) {
            newSchedules[r.restroId] = scheduleResults[idx].data.days;
          } else {
            // Default 7-day schedule array
            newSchedules[r.restroId] = [];
          }
        });
        setSchedules(newSchedules);

        // Expand all by default (as per original RestaurantCard behavior)
        const initialExpanded = restaurants.reduce(
          (acc: Record<string, boolean>, restro: Restaurant) => {
            acc[restro.restroId] = true;
            return acc;
          },
          {},
        );
        setExpandedIds(initialExpanded);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast.error("Failed to fetch data");
      } finally {
        setIsLoadingRestros(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAssociatedUsers, associatedUsers.length, user?.id]);

  const onAddSuccess = (newRestro: Restaurant) => {
    setRestaurants((prev) => [...prev, newRestro]);
    setExpandedIds((prev) => ({ ...prev, [newRestro.restroId]: true }));
    setView("list");
  };

  // Prevent tab close if there are unsaved drafts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedDrafts = Object.keys(sessionStorage).some((key) =>
        key.startsWith("draft_settings_"),
      );
      if (hasUnsavedDrafts) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleFinalSubmit = async () => {
    if (restaurants.length === 0) {
      toast.error(
        t(
          "onboarding.restaurant.complete.error.noRestaurants",
          "Please add at least one restaurant to proceed",
        ),
      );
      return;
    }

    if (restaurants.length === 1 && isMultipleRestro) {
      toast.error(
        t(
          "onboarding.restaurant.complete.error.singleAsMulti",
          "You have selected 'Multiple Restaurants' but only added one. Please switch to 'Single Restaurant' or add more outlets.",
        ),
      );
      return;
    }

    if (restaurants.length > 1 && !isMultipleRestro) {
      toast.error(
        t(
          "onboarding.restaurant.complete.error.multiAsSingle",
          "You have added multiple restaurants but selected 'Single Restaurant'. Please switch to 'Multiple Restaurants'.",
        ),
      );
      return;
    }

    // Block navigation if any card has unsaved draft changes
    const hasUnsavedDrafts = Object.keys(sessionStorage).some((key) =>
      key.startsWith("draft_settings_"),
    );
    if (hasUnsavedDrafts) {
      toast.error(
        t(
          "onboarding.restaurant.complete.unsavedChanges",
          "Please save or discard all changes before proceeding",
        ),
      );
      return;
    }

    // Check if each restaurant has a schedule saved
    if (!allSchedulesVerified) {
      toast.error(
        t(
          "onboarding.restaurant.complete.schedule.error.bulkRequired",
          "Please verify schedules for all restaurants before proceeding",
        ),
      );
      setIsBulkScheduleModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      // Sync isMultipleRestro flag if it has changed
      if (isMultipleRestro !== initialIsMultipleRestro) {
        await restaurantService.updateBrand({ isMultipleRestro });
      }
      navigate("/grow-with-ustart/upload-menu");
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete setup. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (view === "add") {
    return (
      <AddRestaurantForm
        onCancel={() => setView("list")}
        onSuccess={onAddSuccess}
      />
    );
  }

  // --- STANDARD LIST VIEW (Reverted to Original Style) ---
  return (
    <div className="flex flex-col w-full h-full py-8 px-4 mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {t("onboarding.restaurant.complete.title", "Complete Your Profile")}
          </h2>
          <p className="text-slate-500 text-lg">
            {t(
              "onboarding.restaurant.complete.subtitle",
              "Welcome back, {{name}}. Verify your restaurants to finish setup.",
              { name: user?.name },
            )}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v: string) => {
            const val = v as "single" | "multi";
            // Don't allow changing back to single if they have multiple restaurants
            if (val === "single" && restaurants.length > 1) {
              return;
            }
            setActiveTab(val);
            setIsMultipleRestro(val === "multi");
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-12">
            <TabsTrigger
              value="single"
              className="rounded-lg px-6 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none text-slate-600"
            >
              {t(
                "onboarding.restaurant.complete.singleRestro",
                "I have only single Restaurant",
              )}
            </TabsTrigger>
            <TabsTrigger
              value="multi"
              className="rounded-lg px-6 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none text-slate-600"
            >
              {t(
                "onboarding.restaurant.complete.multiRestro",
                "I have More than 1 restaurant",
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 space-y-4 flex flex-col justify-center">
        <div className="p-8 px-0 flex-grow">
          {isMultipleRestro && (
            <div className="flex items-center justify-end gap-3 mb-8">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl h-11 px-6 font-medium transition-all"
                onClick={() => {
                  /* Handle bulk upload */
                }}
              >
                <FileUp className="w-4 h-4 mr-2" />
                {t("onboarding.restaurant.complete.bulkAdd", "Add in Bulk")}
              </Button>
            </div>
          )}

          {restaurants.length > 0 && (
            <div
              className={`mb-8 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 border transition-all ${allSchedulesVerified ? "bg-green-50 border-green-100" : "bg-secondary-orange/5 border-secondary-orange/20"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${allSchedulesVerified ? "bg-green-100" : "bg-secondary-orange/10"}`}
                >
                  {allSchedulesVerified ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Loader2 className="w-6 h-6 text-secondary-orange" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {allSchedulesVerified
                      ? t(
                          "onboarding.restaurant.complete.schedule.verifiedTitle",
                          "Schedules Verified!",
                        )
                      : t(
                          "onboarding.restaurant.complete.schedule.verifyTitle",
                          "Operational Hours Verification",
                        )}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {allSchedulesVerified
                      ? t(
                          "onboarding.restaurant.complete.schedule.verifiedSubtitle",
                          "All restaurants have their opening hours configured.",
                        )
                      : t(
                          "onboarding.restaurant.complete.schedule.verifySubtitle",
                          "Please verify the opening hours for all your restaurants to continue.",
                        )}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsBulkScheduleModalOpen(true)}
                variant={allSchedulesVerified ? "outline" : "default"}
                className={
                  allSchedulesVerified
                    ? "border-green-200 text-green-700 hover:bg-green-100/50 rounded-xl h-12 px-8"
                    : "bg-secondary-orange hover:bg-orange-600 text-white px-8 h-12 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 whitespace-nowrap"
                }
              >
                {allSchedulesVerified
                  ? t("common.edit", "Edit Schedules")
                  : t(
                      "onboarding.restaurant.complete.schedule.fixButton",
                      "Fix & Verify Schedules",
                    )}
              </Button>
            </div>
          )}

          {isLoadingRestros ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
              <p className="text-slate-400 font-medium">
                Fetching your restaurants...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {restaurants.map((restro) => (
                <div
                  key={restro.restroId}
                  className={
                    !isMultipleRestro || expandedIds[restro.restroId]
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  <div className="flex flex-col gap-6">
                    <RestaurantCard
                      restaurant={restro}
                      isExpanded={
                        !isMultipleRestro || !!expandedIds[restro.restroId]
                      }
                      onToggle={() =>
                        setExpandedIds((prev) => ({
                          ...prev,
                          [restro.restroId]: !prev[restro.restroId],
                        }))
                      }
                      showToggle={isMultipleRestro}
                      onDeleteSuccess={(id) =>
                        setRestaurants((prev) =>
                          prev.filter((r) => r.restroId !== id),
                        )
                      }
                    />
                  </div>
                </div>
              ))}

              {(isMultipleRestro || restaurants.length === 0) && (
                <AddRestaurantCard
                  onClick={() => setView("add")}
                  isMultipleRestro={isMultipleRestro}
                  restaurantsCount={restaurants.length}
                />
              )}
            </div>
          )}
        </div>

        {restaurants.length > 0 && (
          <div className="mt-auto flex justify-end pt-10">
            <Button
              size="lg"
              className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 group w-full md:w-auto"
              onClick={handleFinalSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {t(
                    "onboarding.restaurant.complete.moveToMenu",
                    "Move to Menu",
                  )}
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {isBulkScheduleModalOpen && (
        <BulkScheduleModal
          isOpen={isBulkScheduleModalOpen}
          onClose={() => setIsBulkScheduleModalOpen(false)}
          restaurants={restaurants}
          initialSchedules={schedules}
          onSaveSuccess={(updatedSchedules) => {
            setSchedules(updatedSchedules);
          }}
        />
      )}
    </div>
  );
};
