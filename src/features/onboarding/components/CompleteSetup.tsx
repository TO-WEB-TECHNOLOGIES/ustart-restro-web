import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowRight, FileUp } from "lucide-react";
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

// --- Main Component ---

export const CompleteSetup = () => {
  const { t } = useTranslation();
  const { isMultipleRestro, setIsMultipleRestro, user } = useAuth();
  const navigate = useNavigate();

  // View state: 'list' is the main dashboard, 'add' is the new form
  const [view, setView] = useState<"list" | "add">("list");

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestros, setIsLoadingRestros] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "multi">(
    isMultipleRestro ? "multi" : "single",
  );
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const { associatedUsers, setAssociatedUsers } = useOnboardingStore();

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
            (u: any) => u.userId !== user?.id,
          );
          setAssociatedUsers(filteredUsers);
        }

        // Expand all by default (as per original RestaurantCard behavior)
        const initialExpanded = restaurants.reduce((acc: any, restro: any) => {
          acc[restro.restroId] = true;
          return acc;
        }, {});
        setExpandedIds(initialExpanded);
      } catch (error) {
        toast.error("Failed to fetch data");
      } finally {
        setIsLoadingRestros(false);
      }
    };
    fetchInitialData();
  }, [setAssociatedUsers, associatedUsers.length]);

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
      toast.error("Please add at least one restaurant to proceed");
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

    setIsSaving(true);
    try {
      navigate("/grow-with-ustart/upload-menu");
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
                  {t("onboarding.restaurant.complete.moveToMenu")}
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
