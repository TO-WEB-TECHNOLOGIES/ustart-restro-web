import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useOnboardingStore } from "../store/useOnboardingStore";
import {
  restaurantInfoSchema,
  CITY_STATE_MAP,
  SERVED_CITY_OPTIONS,
  resolveServedCity,
  type RestaurantInfoValues,
  getAboutRestaurantSchema,
  type AboutRestaurantValues,
} from "../schemas";
import { LocationPicker } from "./common/LocationPicker";
import { masterDataService } from "../api/masterData";
import { type AddressSearchResult } from "../api/addressService";
import ReactSelect, { components as SelectComponents, type SingleValueProps } from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/required-mark";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { MapPicker } from "@/components/ui/map-picker";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { INDIAN_STATES } from "../../../utils/constants";
import { Info, BookOpen, LayoutDashboard, Terminal } from "lucide-react";
import { MenuList } from "./common/MenuList";
import { FoodTypeButton } from "./common/FoodTypeSelector";
import { UploadedImageTiles } from "./common/UploadedImageTiles";
import { CroppedImageUpload } from "./common/CroppedImageUpload";
import { DayScheduleEditor } from "./common/DayScheduleEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createDefaultScheduleDays } from "../utils/scheduleValidation";

type AddressLike = { line1?: string; line2?: string; landmark?: string; locality?: string; state?: string; pincode?: string };

const formatAddressForDisplay = (addr?: AddressLike) => {
  if (!addr) return "";
  return [addr.line1, addr.line2, addr.landmark, addr.locality, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");
};

const parseLatLng = (value?: string) => {
  if (!value) return undefined;
  const [lat, lng] = value.split(":").map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return undefined;
  return { lat, lng };
};

type SelectOption = { value: string; label: string };

// Renders the selected/typed POS provider as a pill rather than plain text, so a committed
// value reads as clearly "selected" at a glance (same rounded-pill language as elsewhere in
// this form, e.g. the confirm modal's address chip).
const PosProviderPill = (props: SingleValueProps<SelectOption, false>) => (
  <SelectComponents.SingleValue {...props}>
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-50 border border-secondary-orange text-secondary-orange text-sm font-semibold">
      {props.data.label}
    </span>
  </SelectComponents.SingleValue>
);

/**
 * RestaurantInfo Component
 * Step 2 of the onboarding flow, with two internal views on the same route: "info" (identity/
 * PAN/GST - GSTIN replaces the old CIN yes/no gate - and Registered Address only) and "about"
 * (Primary Address + map location, plus food type/cuisine/menu/dish images moved in from the
 * old AboutRestaurant.tsx "details" view - step 3 is documents-only now). Primary Address/map
 * are conditional on hasMultipleBranches (a multi-branch brand's individual outlets/addresses
 * are added later via Step 5), so they live on "about" rather than crowding the mandatory
 * fields on "info". The address-confirm modal gates leaving "about" (not "info"), since that's
 * where the address actually being cross-checked - Primary Address, or Registered Address for
 * multi-branch - is now collected/known.
 */
export const RestaurantInfo = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { restaurantInfo, setRestaurantInfo, aboutRestaurant, setAboutRestaurant, setCurrentStep } = useOnboardingStore();

  const [isSameAsRegistered, setIsSameAsRegistered] = useState(false);
  // "info" = identity/PAN/GST/address (this component's original single view), "about" = food
  // type/cuisine/menu/dish images (moved in from AboutRestaurant.tsx's old "details" view) -
  // both are step 2 (same route), only the "documents" (FSSAI/bank) view stays on step 3.
  const [view, setView] = useState<"info" | "about">("info");
  // Tracks in-progress typing in the POS provider CreatableSelect so a value typed but never
  // explicitly submitted (no Enter, no clicking "Add") still gets committed on blur/focus
  // change instead of silently being discarded.
  const [posProviderInput, setPosProviderInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<RestaurantInfoValues>({
    resolver: zodResolver(restaurantInfoSchema),
    defaultValues: {
      restaurantName: restaurantInfo.restaurantName || "",
      panNumber: restaurantInfo.panNumber || "",
      gstNumber: restaurantInfo.gstNumber || "",
      isCompanySameAsRestaurantName: !restaurantInfo.companyName
        || restaurantInfo.companyName === restaurantInfo.restaurantName,
      companyName: restaurantInfo.companyName || "",
      hasMultipleBranches: restaurantInfo.hasMultipleBranches ?? false,
      usesPos: restaurantInfo.usesPos ?? false,
      posProvider: restaurantInfo.posProvider || "",
      registeredAddress: {
        line1: restaurantInfo.registeredAddress?.split("|")[0] || "",
        line2: restaurantInfo.registeredAddress?.split("|")[1] || "",
        landmark: restaurantInfo.registeredAddress?.split("|")[2] || "",
        locality: restaurantInfo.registeredAddress?.split("|")[3] || "",
        state: restaurantInfo.registeredAddress?.split("|")[4] || "",
        pincode: restaurantInfo.registeredAddress?.split("|")[5] || "",
      },
    },
    mode: "onSubmit",
  });

  const gstNumber = watch("gstNumber");
  const isCompanySame = watch("isCompanySameAsRestaurantName");
  const hasMultipleBranches = watch("hasMultipleBranches");
  const usesPos = watch("usesPos");
  const restaurantNameValue = watch("restaurantName");
  const registeredAddress = watch("registeredAddress");

  // Company name is driven purely by GSTIN + "same as restaurant name" - no association
  // with hasMultipleBranches (which only ever controls isMultipleRestro server-side).
  const showCompanyName = !!gstNumber && isCompanySame === false;

  // While GSTIN is filled and "same as restaurant name" is on, keep companyName mirrored to
  // restaurantName - the input is disabled in that state (see JSX), so this is the only
  // thing keeping the actual submitted value correct and in sync.
  useEffect(() => {
    if (!!gstNumber && isCompanySame) {
      setValue("companyName", restaurantNameValue || "");
    }
  }, [gstNumber, isCompanySame, restaurantNameValue, setValue]);

  const { data: posProviderData } = useQuery({
    queryKey: ["posProviders"],
    queryFn: () => masterDataService.getPosProviders({ size: 50 }),
  });
  const posProviderOptions = useMemo(
    () => (posProviderData?.content || []).map((p) => ({ value: p.posProviderName, label: p.posProviderName })),
    [posProviderData],
  );

  // Info view's submit - no confirm modal here anymore, since Primary Address (the thing
  // actually being cross-checked) is no longer collected on this view. Goes straight to
  // "about" once identity/Registered Address are valid.
  const submitData = (data: RestaurantInfoValues) => {
    const transformedData: any = { ...data };
    // Safe to delete - this field is UI-only and was never part of the store's
    // RestaurantInfoState shape to begin with, so there's no stale value to worry about.
    delete transformedData.isCompanySameAsRestaurantName;

    if (data.registeredAddress) {
      const ra = data.registeredAddress;
      transformedData.registeredAddress = `${ra.line1 || ""}|${ra.line2 || ""}|${ra.landmark || ""}|${ra.locality}|${ra.state}|${ra.pincode}`;
    }

    // setRestaurantInfo shallow-merges onto the existing store ({...state.restaurantInfo,
    // ...data}) - explicitly clearing to '' instead of omitting the key ensures a stale value
    // from a prior submission actually gets overwritten (see the "about" submit below for the
    // full history of this bug: switching hasMultipleBranches must clear the address it hides).
    if (!showCompanyName) {
      transformedData.companyName = "";
    }

    if (!data.usesPos) {
      transformedData.posProvider = "";
    }

    setRestaurantInfo(transformedData);
    setView("about");
  };

  const handleBack = () => {
    setCurrentStep(1);
    navigate("/grow-with-ustart/personal-info");
  };

  // --- "About Restaurant" view (moved from AboutRestaurant.tsx's old "details" view; also
  // now owns Primary Address + map location, moved off the "info" view above since they're
  // conditional/optional (single-outlet only) rather than core identity fields) ---
  const [aboutSearchQuery, setAboutSearchQuery] = useState("");
  const [aboutDebouncedSearch, setAboutDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setAboutDebouncedSearch(aboutSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [aboutSearchQuery]);

  const {
    data: cuisineData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCuisines,
  } = useInfiniteQuery({
    queryKey: ["cuisines", aboutDebouncedSearch],
    queryFn: ({ pageParam = 0 }) =>
      masterDataService.getCuisines({
        search: aboutDebouncedSearch,
        page: pageParam as number,
        size: 10,
      }),
    getNextPageParam: (lastPage) => {
      const { number, totalPages } = lastPage.page;
      return number + 1 < totalPages ? number + 1 : undefined;
    },
    initialPageParam: 0,
  });

  const cuisineOptions = useMemo(() => {
    const allCuisines = cuisineData?.pages.flatMap((page) => page.content) || [];
    return allCuisines.map((c) => ({ value: c.cuisineId, label: c.cuisineName }));
  }, [cuisineData]);

  // Primary Address/location's requiredness depends on hasMultipleBranches, which lives in
  // the "info" form above, not this one - re-derive the schema whenever it changes so the
  // resolver react-hook-form uses at the next validation reflects the current value.
  const stepTwoSchema = useMemo(() => getAboutRestaurantSchema(hasMultipleBranches), [hasMultipleBranches]);

  const {
    register: registerAbout,
    control: aboutControl,
    handleSubmit: handleSubmitAbout,
    watch: watchAbout,
    setValue: setValueAbout,
    setError: setErrorAbout,
    clearErrors: clearErrorsAbout,
    formState: { errors: aboutErrors },
  } = useForm<AboutRestaurantValues>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      ...aboutRestaurant,
      restaurantAddress: {
        line1: restaurantInfo.restaurantAddress?.split("|")[0] || "",
        line2: restaurantInfo.restaurantAddress?.split("|")[1] || "",
        landmark: restaurantInfo.restaurantAddress?.split("|")[2] || "",
        locality: restaurantInfo.restaurantAddress?.split("|")[3] || "",
        state: restaurantInfo.restaurantAddress?.split("|")[4] || "",
        pincode: restaurantInfo.restaurantAddress?.split("|")[5] || "",
      },
      location: restaurantInfo.location || "",
      servingOptions: aboutRestaurant.servingOptions?.length ? aboutRestaurant.servingOptions : ["DELIVERY"],
      operatingHours: aboutRestaurant.operatingHours?.length ? aboutRestaurant.operatingHours : createDefaultScheduleDays(),
      diningHours: aboutRestaurant.diningHours?.length ? aboutRestaurant.diningHours : createDefaultScheduleDays(),
      diningMenuImages: aboutRestaurant.diningMenuImages || [],
      // UI-only, mirrors isCompanySameAsRestaurantName/isSameAsRegistered - stripped before
      // the store write in finalizeAboutSubmit. Default checked: reduces friction for the
      // common case (most restaurants keep the same hours/menu for dine-in and delivery).
      isDiningHoursSameAsOperating: true,
      isDiningMenuSameAsDelivery: true,
    } as any,
    mode: "onSubmit",
  });

  const restaurantAddressLocality = watchAbout("restaurantAddress.locality");

  // "Same as Registered Address" copies registeredAddress (from the "info" form/view) into
  // restaurantAddress whenever it's checked. The effect depends on the individual strings, not
  // the watched object: it can set form errors (re-render), and an object dependency whose
  // reference changes per render would re-fire it in a loop.
  const regLine1 = registeredAddress?.line1;
  const regLine2 = registeredAddress?.line2;
  const regLandmark = registeredAddress?.landmark;
  const regLocality = registeredAddress?.locality;
  const regState = registeredAddress?.state;
  const regPincode = registeredAddress?.pincode;
  useEffect(() => {
    if (!hasMultipleBranches && isSameAsRegistered) {
      setValueAbout("restaurantAddress.line1", regLine1 || "");
      setValueAbout("restaurantAddress.line2", regLine2 || "");
      setValueAbout("restaurantAddress.landmark", regLandmark || "");
      setValueAbout("restaurantAddress.pincode", regPincode || "");
      // Registered Address's locality is free text (any city/state) while Primary Address is
      // locked to the served cities (CITY_STATE_MAP). 2026-10-19: matched via resolveServedCity (case/space-
      // insensitive + known renames) instead of an exact key lookup, which silently skipped
      // "gurugram"/"Gurgaon" etc., and falls back to the registered state (Delhi), since
      // "Locality/ City" usually holds an actual locality like "Saket". State then follows from
      // the locality (effect below). If the registered address isn't in a served city, say so -
      // same feedback as the address-search path - rather than leaving city/state blank.
      const servedCity = resolveServedCity(regLocality, regState);
      if (servedCity) {
        setValueAbout("restaurantAddress.locality", servedCity, { shouldValidate: true });
        clearErrorsAbout("restaurantAddress.locality");
      } else if (regLocality?.trim() || regState?.trim()) {
        setValueAbout("restaurantAddress.locality", "");
        setErrorAbout("restaurantAddress.locality", {
          type: "manual",
          message: t("onboarding.restaurant.form.unsupportedCity"),
        });
      }
    }
  }, [hasMultipleBranches, isSameAsRegistered, regLine1, regLine2, regLandmark, regLocality, regState, regPincode, setValueAbout, clearErrorsAbout, setErrorAbout, t]);

  // Primary Address's state always follows its locality (e.g. Gurugram -> Haryana, Noida -> Uttar
  // Pradesh - see CITY_STATE_MAP).
  // 2026-10-19: case-insensitive via resolveServedCity (e.g. a resumed draft holding "gurugram").
  const restaurantAddressCity = resolveServedCity(restaurantAddressLocality);
  useEffect(() => {
    if (restaurantAddressCity) {
      setValueAbout("restaurantAddress.state", CITY_STATE_MAP[restaurantAddressCity]);
    }
  }, [restaurantAddressCity, setValueAbout]);

  // Auto-fills Primary Address from a selected search result's structured components -
  // best-effort (Google doesn't always resolve every component), fields stay editable
  // afterward so the user can correct anything. If the resolved city isn't one we serve
  // (CITY_STATE_MAP), flag it immediately (toast + inline field error) rather than
  // silently leaving locality blank and only surfacing the problem at submit time.
  const handleAddressSelected = (result: AddressSearchResult) => {
    const line1 = result.name || result.streetAddress;
    if (line1) setValueAbout("restaurantAddress.line1", line1);
    if (result.area) setValueAbout("restaurantAddress.line2", result.area);
    if (result.pincode) setValueAbout("restaurantAddress.pincode", result.pincode);

    // 2026-10-19: case-insensitive (+ "Gurgaon") match, storing the canonical city name.
    const searchedCity = resolveServedCity(result.city);
    if (searchedCity) {
      setValueAbout("restaurantAddress.locality", searchedCity, { shouldValidate: true });
      clearErrorsAbout("restaurantAddress.locality");
    } else {
      setValueAbout("restaurantAddress.locality", "");
      const message = t("onboarding.restaurant.form.unsupportedCity");
      setErrorAbout("restaurantAddress.locality", { type: "manual", message });
      toast.error(message);
    }
  };

  // 2026-10-20: id -> name cache of the SELECTED cuisines, written in the select's onChange
  // (react-select hands back the picked options with their labels). cuisineOptions only holds
  // the CURRENT search's results, so typing a search used to drop the selected cuisines'
  // names and their chips fell back to showing the raw id. Filled at selection time, not
  // synced from query results in an effect - no extra render per results page.
  const [selectedCuisineNames, setSelectedCuisineNames] = useState<Record<number, string>>({});

  const selectedCuisineIds = watchAbout("cuisines");
  // Hoisted out of the cuisines Controller's render prop - calling useMemo inside a
  // Controller render callback isn't a real component/hook, so it violated rules-of-hooks.
  // Label priority: name cached at selection -> current results (covers a resumed draft,
  // selected before this page mounted) -> generic fallback (resumed-draft id not in the
  // current results).
  const selectedCuisineOptions = useMemo(() => {
    const ids = selectedCuisineIds || [];
    return ids.map((id: number) => ({
      value: id,
      label:
        selectedCuisineNames[id] ??
        cuisineOptions.find((o) => o.value === id)?.label ??
        t("onboarding.restaurant.about.cuisineSelectedFallback"),
    }));
  }, [selectedCuisineNames, cuisineOptions, selectedCuisineIds, t]);

  const menuInputRef = useRef<HTMLInputElement>(null);

  const menuImages = watchAbout("menuImages");
  // 2026-10-20: the outlet image (16:9, `dishImage`) is always required; a multi-branch brand
  // additionally uploads a square brand logo (`brandLogo`). Both boxes are CroppedImageUpload.
  const dishImage = watchAbout("dishImage");
  const brandLogo = watchAbout("brandLogo");
  const hasMenuImages = Array.isArray(menuImages) && menuImages.length > 0;

  const handleMenuFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const currentFiles = (watchAbout("menuImages") as File[]) || [];
      setValueAbout("menuImages", [...currentFiles, ...newFiles], { shouldValidate: true });
    }
    // Reset so the same file can be re-added after removing it (onChange wouldn't fire).
    e.target.value = "";
  };

  const removeMenuFile = (index: number) => {
    const currentFiles = (watchAbout("menuImages") as File[]) || [];
    const updated = currentFiles.filter((_, i) => i !== index);
    setValueAbout("menuImages", updated, { shouldValidate: true });
  };

  // --- Serving Options / Restaurant & Dining Timings / Dining Menu ---
  const servingOptions = watchAbout("servingOptions");
  const operatingHours = watchAbout("operatingHours");
  const isDiningHoursSameAsOperating = watchAbout("isDiningHoursSameAsOperating");
  const diningMenuImages = watchAbout("diningMenuImages");
  const hasDiningMenuImages = Array.isArray(diningMenuImages) && diningMenuImages.length > 0;
  const isDiningMenuSameAsDelivery = watchAbout("isDiningMenuSameAsDelivery");

  // "Same as operating timings" / "Same as Delivery Menu" live-copy while checked - same
  // pattern "Same as Registered Address" already uses above, so the hidden section's data is
  // always in sync by submit time without needing to special-case the checkbox in validation.
  useEffect(() => {
    if (isDiningHoursSameAsOperating) {
      setValueAbout("diningHours", operatingHours);
    }
  }, [isDiningHoursSameAsOperating, operatingHours, setValueAbout]);

  useEffect(() => {
    if (isDiningMenuSameAsDelivery) {
      setValueAbout("diningMenuImages", menuImages);
    }
  }, [isDiningMenuSameAsDelivery, menuImages, setValueAbout]);

  const diningMenuInputRef = useRef<HTMLInputElement>(null);

  const handleDiningMenuFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const currentFiles = (watchAbout("diningMenuImages") as File[]) || [];
      setValueAbout("diningMenuImages", [...currentFiles, ...newFiles], { shouldValidate: true });
    }
    // Reset so the same file can be re-added after removing it (onChange wouldn't fire).
    e.target.value = "";
  };

  const removeDiningMenuFile = (index: number) => {
    const currentFiles = (watchAbout("diningMenuImages") as File[]) || [];
    const updated = currentFiles.filter((_, i) => i !== index);
    setValueAbout("diningMenuImages", updated, { shouldValidate: true });
  };

  // Validated "about" data waits here while the confirmation modal is open - Continue no
  // longer submits directly, it opens a "cross-check your address" confirmation first. This
  // now gates leaving "about" (not "info"), since Primary Address/location - the thing being
  // cross-checked - is collected here.
  const [pendingSubmit, setPendingSubmit] = useState<AboutRestaurantValues | null>(null);

  const onAboutValidated = (data: AboutRestaurantValues) => {
    setPendingSubmit(data);
  };

  const finalizeAboutSubmit = (data: AboutRestaurantValues) => {
    setAboutRestaurant({
      foodTypes: data.foodTypes,
      cuisines: data.cuisines,
      menuImages: data.menuImages,
      // Outlet image always kept; the logo only for multi-branch, so a logo left over from
      // toggling hasMultipleBranches off can't be submitted (2026-10-20).
      dishImage: data.dishImage,
      brandLogo: hasMultipleBranches ? data.brandLogo : undefined,
      servingOptions: data.servingOptions,
      operatingHours: data.operatingHours,
      // Dining Timings only matter when Dine-In is offered - store a fresh all-closed default
      // rather than whatever stale value the hidden section held, mirroring how
      // restaurantAddress/location get explicitly cleared below rather than just omitted.
      diningHours: data.servingOptions.includes("DINE_IN") ? data.diningHours : createDefaultScheduleDays(),
      diningMenuImages: data.diningMenuImages,
    });

    // Same shallow-merge-clearing concern as the "info" view's submit: explicitly clear to ''
    // rather than omitting the key, so switching to multi-branch actually overwrites whatever
    // Primary Address/location was saved from an earlier single-outlet submission.
    const restaurantInfoUpdate: any = {};
    if (hasMultipleBranches) {
      restaurantInfoUpdate.restaurantAddress = "";
      restaurantInfoUpdate.location = "";
    } else if (data.restaurantAddress) {
      const ra = data.restaurantAddress;
      // 2026-10-19: city/state sent in canonical form (validation accepts any case/"Gurgaon").
      // Validation guarantees a served city here; the fallbacks only keep the types honest.
      const city = resolveServedCity(ra.locality) ?? ra.locality ?? "";
      const state = (city && CITY_STATE_MAP[city]) || ra.state;
      restaurantInfoUpdate.restaurantAddress = `${ra.line1 || ""}|${ra.line2 || ""}|${ra.landmark || ""}|${city}|${state}|${ra.pincode}`;
      restaurantInfoUpdate.location = data.location || "";
    }
    setRestaurantInfo(restaurantInfoUpdate);

    setCurrentStep(3);
    navigate("/grow-with-ustart/documents");
  };

  const handleConfirmSubmit = () => {
    if (pendingSubmit) {
      finalizeAboutSubmit(pendingSubmit);
    }
    setPendingSubmit(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
          {view === "info"
            ? t("onboarding.restaurant.titleDefault")
            : t("onboarding.restaurant.about.title")}
        </h2>
        <p className="md:text-2xl text-slate-500 mt-2">
          {view === "info"
            ? t("onboarding.restaurant.subtitleDefault")
            : t("onboarding.restaurant.about.subtitle")}
        </p>
      </div>

      <div className="py-8 flex-grow overflow-y-auto px-1">
        {view === "info" ? (
        <form id="restaurant-info-form" onSubmit={handleSubmit(submitData)} className="space-y-8 max-w-full">
          {/* Section 1: Identity */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="font-semibold text-slate-700">
                {t("onboarding.restaurant.form.restaurantNameLabel")}<RequiredMark />
              </Label>
              <Input
                id="restaurantName"
                {...register("restaurantName")}
                className="h-12 bg-background-white border-slate-200"
                placeholder={t("onboarding.restaurant.form.restaurantNamePlaceholder")}
              />
              {errors.restaurantName && (
                <p className="text-red-500 text-xs">{errors.restaurantName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="panNumber" className="font-semibold text-slate-700">
                  {t("onboarding.restaurant.form.panLabel")}<RequiredMark />
                </Label>
                <Input
                  id="panNumber"
                  {...register("panNumber")}
                  className="h-12 bg-background-white border-slate-200 uppercase"
                  placeholder={t("onboarding.restaurant.form.panPlaceholder")}
                />
                {errors.panNumber && (
                  <p className="text-red-500 text-xs">{errors.panNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstNumber" className="font-semibold text-slate-700">
                  {t("onboarding.restaurant.form.gstLabel")}
                  {!gstNumber && (
                    <span className="text-slate-400 font-normal text-xs ml-1">
                      {t("onboarding.restaurant.form.optional")}
                    </span>
                  )}
                </Label>
                <Input
                  id="gstNumber"
                  {...register("gstNumber")}
                  className="h-12 bg-background-white border-slate-200 uppercase"
                  placeholder={t("onboarding.restaurant.form.gstPlaceholder")}
                />
                {errors.gstNumber && (
                  <p className="text-red-500 text-xs">{errors.gstNumber.message}</p>
                )}
              </div>
            </div>

            {!!gstNumber && (
              // GSTIN filled: company name field and the "same as restaurant name" toggle
              // sit in one row - the field itself is always visible once GSTIN is filled,
              // just disabled+mirrored to restaurantName while "same" is on. No association
              // with hasMultipleBranches - that only controls isMultipleRestro server-side.
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="companyName" className="font-semibold text-slate-700">
                  {t("onboarding.restaurant.form.companyNameLabel")}<RequiredMark />
                </Label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      id="companyName"
                      {...register("companyName")}
                      disabled={isCompanySame}
                      className={`h-12 bg-background-white border-slate-200 ${isCompanySame ? "bg-slate-100 text-slate-500" : ""}`}
                      placeholder={t("onboarding.restaurant.form.companyNamePlaceholder")}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Controller
                      control={control}
                      name="isCompanySameAsRestaurantName"
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <label className="text-sm font-medium text-slate-700 cursor-pointer whitespace-nowrap">
                      {t("onboarding.restaurant.form.companySameQuestion")}
                    </label>
                  </div>
                </div>
                {errors.companyName && (
                  <p className="text-red-500 text-xs">{errors.companyName.message}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasMultipleBranches"
                {...register("hasMultipleBranches")}
                className="w-5 h-5 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
              />
              <label htmlFor="hasMultipleBranches" className="text-sm font-medium text-slate-700 cursor-pointer">
                {t("onboarding.restaurant.form.multipleBranches")}
              </label>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-slate-700">
                {t("onboarding.restaurant.form.posQuestion")}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setValue("usesPos", false);
                    setValue("posProvider", "");
                  }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    !usesPos
                      ? "bg-[#0F2441] border-[#0F2441] text-white shadow-md shadow-[#0F2441]/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <LayoutDashboard className={`w-8 h-8 mb-3 ${!usesPos ? "text-white" : "text-slate-400"}`} />
                  <p className="font-bold text-base">
                    {t("onboarding.restaurant.form.posOptionDashboardLabel")}
                  </p>
                  <p className={`text-xs mt-1 ${!usesPos ? "text-slate-200" : "text-slate-500"}`}>
                    {t("onboarding.restaurant.form.posOptionDashboardSubtext")}
                  </p>
                </button>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setValue("usesPos", true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setValue("usesPos", true);
                  }}
                  className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                    usesPos
                      ? "bg-[#0F2441] border-[#0F2441] text-white shadow-md shadow-[#0F2441]/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Terminal className={`w-8 h-8 mb-3 ${usesPos ? "text-white" : "text-slate-400"}`} />
                  <p className="font-bold text-base">
                    {t("onboarding.restaurant.form.posOptionPosLabel")}
                  </p>
                  <p className={`text-xs mt-1 ${usesPos ? "text-slate-200" : "text-slate-500"}`}>
                    {t("onboarding.restaurant.form.posOptionPosSubtext")}
                  </p>

                  {usesPos && (
                    <div
                      className="mt-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Controller
                        control={control}
                        name="posProvider"
                        render={({ field }) => (
                          <CreatableSelect
                            options={posProviderOptions}
                            value={field.value ? { value: field.value, label: field.value } : null}
                            inputValue={posProviderInput}
                            onInputChange={(newValue, { action }) => {
                              if (action === "input-change") setPosProviderInput(newValue);
                            }}
                            onChange={(opt) => {
                              field.onChange(opt?.value || "");
                              setPosProviderInput("");
                            }}
                            onBlur={() => {
                              // Enter/clicking "Add" already commits via onChange - this
                              // covers the case where the user types then clicks/tabs away
                              // without either, so a typed value is never silently dropped.
                              const trimmed = posProviderInput.trim();
                              if (trimmed && trimmed !== field.value) {
                                field.onChange(trimmed);
                              }
                              setPosProviderInput("");
                            }}
                            placeholder={t("onboarding.restaurant.form.posProviderPlaceholder")}
                            noOptionsMessage={() => t("onboarding.restaurant.form.posProviderNoOptions")}
                            formatCreateLabel={(input) => `${t("onboarding.restaurant.form.posCreateOptionLabel")} "${input}"`}
                            components={{ SingleValue: PosProviderPill }}
                            isClearable
                            menuPortalTarget={document.body}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        )}
                      />
                      {/* CreatableSelect looks like a plain dropdown at a glance - this makes
                          the "or type your own" affordance explicit rather than relying on
                          the user to discover it by typing. */}
                      <p className="text-sm font-medium text-secondary-orange pl-1">
                        {t("onboarding.restaurant.form.posProviderHint")}
                      </p>
                      {errors.posProvider && (
                        <p className="text-red-300 text-xs pl-1">{errors.posProvider.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address(es) */}
          <div className="space-y-4">
            <Label className="font-semibold text-slate-700">
              {t("onboarding.restaurant.form.addressLabel")}
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input
                  {...register("registeredAddress.line1")}
                  placeholder={t("onboarding.restaurant.form.addressLabels.line1")}
                  className="h-10 bg-background-white border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Input
                  {...register("registeredAddress.line2")}
                  placeholder={t("onboarding.restaurant.form.addressLabels.sector")}
                  className="h-10 bg-background-white border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Input
                  {...register("registeredAddress.landmark")}
                  placeholder={t("onboarding.restaurant.form.addressLabels.landmark")}
                  className="h-10 bg-background-white border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Input
                  {...register("registeredAddress.locality")}
                  placeholder={`${t("onboarding.restaurant.form.addressLabels.locality")} *`}
                  className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.registeredAddress?.locality ? "border-red-500" : ""}`}
                />
                {errors.registeredAddress?.locality && (
                  <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.locality.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Controller
                  name="registeredAddress.state"
                  control={control}
                  render={({ field }) => (
                    <ReactSelect
                      options={INDIAN_STATES.map((state) => ({ value: state, label: state }))}
                      value={field.value ? { value: field.value, label: field.value } : null}
                      onChange={(opt: any) => field.onChange(opt?.value || "")}
                      placeholder={`${t("onboarding.restaurant.form.addressLabels.state")} *`}
                      isSearchable
                      menuPortalTarget={document.body}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          borderColor: errors.registeredAddress?.state ? "#ef4444" : state.isFocused ? "#f97316" : "#e2e8f0",
                          boxShadow: state.isFocused ? "0 0 0 1px #f97316" : "none",
                          minHeight: "40px",
                          fontSize: "0.75rem",
                        }),
                      }}
                    />
                  )}
                />
                {errors.registeredAddress?.state && (
                  <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.state.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  {...register("registeredAddress.pincode")}
                  placeholder={`${t("onboarding.restaurant.form.addressLabels.pincode")} *`}
                  maxLength={6}
                  className={`h-10 bg-background-white border-slate-200 rounded-lg ${errors.registeredAddress?.pincode ? "border-red-500" : ""}`}
                />
                {errors.registeredAddress?.pincode && (
                  <p className="text-red-500 text-[10px] ml-1">{errors.registeredAddress.pincode.message}</p>
                )}
              </div>
            </div>
          </div>

        </form>
        ) : (
        <form
          id="about-restaurant-form"
          onSubmit={handleSubmitAbout(onAboutValidated)}
          className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300"
        >
          {!hasMultipleBranches && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-slate-700">
                    {t("onboarding.restaurant.form.restaurantAddressLabel")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAsRegistered"
                      checked={isSameAsRegistered}
                      onChange={(e) => setIsSameAsRegistered(e.target.checked)}
                      className="w-4 h-4 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
                    />
                    <label htmlFor="sameAsRegistered" className="text-sm text-slate-600 cursor-pointer select-none">
                      {t("onboarding.restaurant.form.sameAsRegistered")}
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input
                      {...registerAbout("restaurantAddress.line1")}
                      placeholder={t("onboarding.restaurant.form.addressLabels.line1")}
                      disabled={isSameAsRegistered}
                      className={`h-10 bg-background-white border-slate-200 rounded-lg ${isSameAsRegistered ? "bg-slate-100" : ""}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      {...registerAbout("restaurantAddress.line2")}
                      placeholder={t("onboarding.restaurant.form.addressLabels.sector")}
                      disabled={isSameAsRegistered}
                      className={`h-10 bg-background-white border-slate-200 rounded-lg ${isSameAsRegistered ? "bg-slate-100" : ""}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      {...registerAbout("restaurantAddress.landmark")}
                      placeholder={t("onboarding.restaurant.form.addressLabels.landmark")}
                      disabled={isSameAsRegistered}
                      className={`h-10 bg-background-white border-slate-200 rounded-lg ${isSameAsRegistered ? "bg-slate-100" : ""}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <Controller
                      name="restaurantAddress.locality"
                      control={aboutControl}
                      render={({ field }) => (
                        <ReactSelect
                          options={SERVED_CITY_OPTIONS}
                          value={field.value ? { value: field.value, label: field.value } : null}
                          onChange={(opt: any) => field.onChange(opt?.value || "")}
                          placeholder={`${t("onboarding.restaurant.form.addressLabels.locality")} *`}
                          isDisabled={isSameAsRegistered}
                          isSearchable={false}
                          menuPortalTarget={document.body}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              borderRadius: "0.5rem",
                              borderColor: aboutErrors.restaurantAddress?.locality ? "#ef4444" : state.isFocused ? "#f97316" : "#e2e8f0",
                              backgroundColor: isSameAsRegistered ? "#f1f5f9" : "white",
                              minHeight: "40px",
                              fontSize: "0.75rem",
                            }),
                          }}
                        />
                      )}
                    />
                    {aboutErrors.restaurantAddress?.locality && (
                      <p className="text-red-500 text-[10px] ml-1">{aboutErrors.restaurantAddress.locality.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      value={restaurantAddressCity ? CITY_STATE_MAP[restaurantAddressCity] : ""}
                      readOnly
                      placeholder={`${t("onboarding.restaurant.form.addressLabels.state")} *`}
                      className="h-10 bg-slate-100 border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      {...registerAbout("restaurantAddress.pincode")}
                      placeholder={`${t("onboarding.restaurant.form.addressLabels.pincode")} *`}
                      maxLength={6}
                      disabled={isSameAsRegistered}
                      className={`h-10 bg-background-white border-slate-200 rounded-lg ${aboutErrors.restaurantAddress?.pincode ? "border-red-500" : ""} ${isSameAsRegistered ? "bg-slate-100" : ""}`}
                    />
                    {aboutErrors.restaurantAddress?.pincode && (
                      <p className="text-red-500 text-[10px] ml-1">{aboutErrors.restaurantAddress.pincode.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <LocationPicker
                locationValue={watchAbout("location")}
                onLocationChange={(val) => setValueAbout("location", val)}
                onAddressSelected={handleAddressSelected}
                error={aboutErrors.location?.message}
                label={t("onboarding.restaurant.form.locationLabel")}
                required
              />
            </div>
          )}

          {/* Serving Options + Food Type - one flex row instead of two stacked blocks */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <Label className="font-semibold text-slate-700">
                {t("onboarding.restaurant.about.servingOptionsLabel")}<RequiredMark />
              </Label>
              <Controller
                control={aboutControl}
                name="servingOptions"
                render={({ field }) => (
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const current = field.value || [];
                        field.onChange(
                          current.includes("DELIVERY")
                            ? current.filter((o) => o !== "DELIVERY")
                            : [...current, "DELIVERY"],
                        );
                      }}
                      className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all border ${
                        field.value?.includes("DELIVERY")
                          ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {t("onboarding.restaurant.about.servingDelivery")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = field.value || [];
                        field.onChange(
                          current.includes("DINE_IN")
                            ? current.filter((o) => o !== "DINE_IN")
                            : [...current, "DINE_IN"],
                        );
                      }}
                      className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all border ${
                        field.value?.includes("DINE_IN")
                          ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {t("onboarding.restaurant.about.servingDineIn")}
                    </button>
                  </div>
                )}
              />
              {aboutErrors.servingOptions && (
                <p className="text-red-500 text-xs mt-1">{aboutErrors.servingOptions.message}</p>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <Label className="font-semibold text-slate-700">
                {t("onboarding.restaurant.about.foodTypeLabel")}<RequiredMark />
              </Label>
              <Controller
                control={aboutControl}
                name="foodTypes"
                render={({ field }) => (
                  <div className="flex gap-4 flex-wrap">
                    <FoodTypeButton
                      label={t("onboarding.restaurant.about.veg")}
                      colorClass="bg-green-500"
                      isSelected={field.value.isVegAvailable}
                      onClick={() =>
                        field.onChange({
                          ...field.value,
                          isVegAvailable: !field.value.isVegAvailable,
                        })
                      }
                    />
                    <FoodTypeButton
                      label={t("onboarding.restaurant.about.nonVeg")}
                      colorClass="bg-red-500"
                      isSelected={field.value.isNonVegAvailable}
                      onClick={() =>
                        field.onChange({
                          ...field.value,
                          isNonVegAvailable: !field.value.isNonVegAvailable,
                        })
                      }
                    />
                    <FoodTypeButton
                      label={t("onboarding.restaurant.about.egg")}
                      colorClass="bg-yellow-500"
                      isSelected={field.value.isEggAvailable}
                      onClick={() =>
                        field.onChange({
                          ...field.value,
                          isEggAvailable: !field.value.isEggAvailable,
                        })
                      }
                    />
                  </div>
                )}
              />
              {aboutErrors.foodTypes?.root && (
                <p className="text-red-500 text-xs">
                  {aboutErrors.foodTypes.root.message}
                </p>
              )}
            </div>
          </div>

          {/* Restaurant Timings - collapsible, day-pill layout (like Food Type's buttons).
              Defaults open (defaultValue) - collapsible so it can still be tucked away once set. */}
          <Accordion type="single" collapsible defaultValue="operating-hours" className="border border-slate-200 rounded-xl px-4">
            <AccordionItem value="operating-hours" className="border-b-0">
              <AccordionTrigger className="hover:no-underline">
                <Label className="font-semibold text-slate-700 cursor-pointer">
                  {t("onboarding.restaurant.about.operatingHoursLabel")}<RequiredMark />
                </Label>
              </AccordionTrigger>
              <AccordionContent>
                <Controller
                  control={aboutControl}
                  name="operatingHours"
                  render={({ field }) => (
                    <DayScheduleEditor days={field.value} onChange={field.onChange} layout="cards" />
                  )}
                />
                {aboutErrors.operatingHours && (
                  <p className="text-red-500 text-xs mt-2">{aboutErrors.operatingHours.message as string}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Dining Timings - only relevant when Dine-In is actually offered */}
          {servingOptions?.includes("DINE_IN") && (
            <Accordion type="single" collapsible defaultValue="dining-hours" className="border border-slate-200 rounded-xl px-4">
              <AccordionItem value="dining-hours" className="border-b-0">
                <AccordionTrigger className="hover:no-underline">
                  <Label className="font-semibold text-slate-700 cursor-pointer">
                    {t("onboarding.restaurant.about.diningHoursLabel")}<RequiredMark />
                  </Label>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      id="sameAsOperatingHours"
                      {...registerAbout("isDiningHoursSameAsOperating")}
                      className="w-4 h-4 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
                    />
                    <label htmlFor="sameAsOperatingHours" className="text-sm text-slate-600 cursor-pointer select-none">
                      {t("onboarding.restaurant.about.sameAsOperatingHours")}
                    </label>
                  </div>
                  {!isDiningHoursSameAsOperating && (
                    <Controller
                      control={aboutControl}
                      name="diningHours"
                      render={({ field }) => (
                        <DayScheduleEditor days={field.value} onChange={field.onChange} layout="cards" />
                      )}
                    />
                  )}
                  {aboutErrors.diningHours && (
                    <p className="text-red-500 text-xs">{aboutErrors.diningHours.message as string}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Cuisine Type - ReactSelect with Infinite Scroll & Search */}
          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">
              {t("onboarding.restaurant.about.cuisineLabel")}<RequiredMark />
            </Label>

            <Controller
              control={aboutControl}
              name="cuisines"
              render={({ field }) => {
                return (
                  <ReactSelect
                    isMulti
                    isLoading={isLoadingCuisines}
                    options={cuisineOptions}
                    value={selectedCuisineOptions}
                    components={{ MenuList }}
                    {...({
                      hasNextPage,
                      isFetchingNextPage,
                      fetchNextPage,
                      t,
                    } as any)}
                    inputValue={aboutSearchQuery}
                    onInputChange={(newValue, { action }) => {
                      if (action === "input-change") setAboutSearchQuery(newValue);
                    }}
                    onChange={(newValue: any) => {
                      field.onChange(
                        newValue ? newValue.map((v: any) => v.value) : [],
                      );
                      // Remember picked names so the chips survive the next search (see
                      // selectedCuisineNames). Merged, never pruned: a removed id is simply
                      // no longer looked up.
                      if (newValue?.length) {
                        setSelectedCuisineNames((prev) => {
                          const next = { ...prev };
                          newValue.forEach((v: any) => { next[v.value] = v.label; });
                          return next;
                        });
                      }
                      setAboutSearchQuery("");
                    }}
                    closeMenuOnSelect={false}
                    placeholder={t("onboarding.restaurant.about.cuisinePlaceholder")}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    filterOption={() => true}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: "0.75rem",
                        borderColor: state.isFocused ? "#f97316" : "#e2e8f0",
                        boxShadow: state.isFocused ? "0 0 0 1px #f97316" : "none",
                        "&:hover": {
                          borderColor: "#f97316",
                        },
                        padding: "2px",
                        minHeight: "48px",
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: "#f1f5f9",
                        borderRadius: "0.5rem",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: "#334155",
                        fontWeight: 500,
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: "#64748b",
                        ":hover": {
                          backgroundColor: "#e2e8f0",
                          color: "#ef4444",
                        },
                      }),
                    }}
                  />
                );
              }}
            />
            {aboutErrors.cuisines && (
              <p className="text-red-500 text-xs mt-1">
                {aboutErrors.cuisines.message}
              </p>
            )}
          </div>

          {/* Upload Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Menu */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">
                {t("onboarding.restaurant.about.menuLabel")}<RequiredMark />
              </Label>
              {/* 2026-10-20: picked pages render as thumbnails inside the box (plus an "Add
                  Page" tile) instead of file-name chips below it, so the partner can see what
                  they uploaded. The whole box only opens the file picker while it's empty -
                  once it holds thumbnails, a click on one must not reopen the picker. */}
              <div
                onClick={hasMenuImages ? undefined : () => menuInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl min-h-[160px] flex transition-colors ${hasMenuImages ? "p-3 items-center" : "p-8 flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"} ${aboutErrors.menuImages ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-zinc-700"}`}
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={menuInputRef}
                  accept="image/*"
                  onChange={handleMenuFiles}
                />
                {hasMenuImages ? (
                  <UploadedImageTiles
                    images={menuImages as (File | string)[]}
                    onAdd={() => menuInputRef.current?.click()}
                    onRemove={removeMenuFile}
                    altLabel={t("onboarding.restaurant.about.menuLabel")}
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-secondary-orange">
                      {t("onboarding.restaurant.about.menuUploadText")}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("onboarding.restaurant.about.menuUploadSubtext")}
                    </p>
                  </>
                )}
              </div>
              {aboutErrors.menuImages && (
                <p className="text-red-500 text-xs">
                  {aboutErrors.menuImages.message as string}
                </p>
              )}
            </div>

            {/* Dining Menu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-slate-700">
                  {t("onboarding.restaurant.about.diningMenuLabel")}<RequiredMark />
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sameAsDeliveryMenu"
                    {...registerAbout("isDiningMenuSameAsDelivery")}
                    className="w-4 h-4 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
                  />
                  <label htmlFor="sameAsDeliveryMenu" className="text-xs text-slate-600 cursor-pointer select-none">
                    {t("onboarding.restaurant.about.sameAsDeliveryMenu")}
                  </label>
                </div>
              </div>
              {!isDiningMenuSameAsDelivery && (
                <>
                  {/* Same in-box thumbnails as the delivery menu above. */}
                  <div
                    onClick={hasDiningMenuImages ? undefined : () => diningMenuInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl min-h-[160px] flex transition-colors ${hasDiningMenuImages ? "p-3 items-center" : "p-8 flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"} ${aboutErrors.diningMenuImages ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-zinc-700"}`}
                  >
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={diningMenuInputRef}
                      accept="image/*"
                      onChange={handleDiningMenuFiles}
                    />
                    {hasDiningMenuImages ? (
                      <UploadedImageTiles
                        images={diningMenuImages as (File | string)[]}
                        onAdd={() => diningMenuInputRef.current?.click()}
                        onRemove={removeDiningMenuFile}
                        altLabel={t("onboarding.restaurant.about.diningMenuLabel")}
                      />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-secondary-orange">
                          {t("onboarding.restaurant.about.menuUploadText")}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {t("onboarding.restaurant.about.menuUploadSubtext")}
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
              {aboutErrors.diningMenuImages && (
                <p className="text-red-500 text-xs">
                  {aboutErrors.diningMenuImages.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Outlet image (always) + brand logo (multi-branch only) - 2026-10-20. */}
          <CroppedImageUpload
            value={dishImage}
            onChange={(file) => setValueAbout("dishImage", file, { shouldValidate: true })}
            aspect={16 / 9}
            label={t("onboarding.restaurant.about.dishLabel")}
            uploadText={t("onboarding.restaurant.about.dishUploadText")}
            uploadSubtext={t("onboarding.restaurant.about.dishUploadSubtext")}
            error={aboutErrors.dishImage?.message as string | undefined}
          />
          {hasMultipleBranches && (
            <CroppedImageUpload
              value={brandLogo}
              onChange={(file) => setValueAbout("brandLogo", file, { shouldValidate: true })}
              aspect={1}
              label={t("onboarding.restaurant.about.brandLogoLabel")}
              uploadText={t("onboarding.restaurant.about.brandLogoUploadText")}
              uploadSubtext={t("onboarding.restaurant.about.brandLogoUploadSubtext")}
              error={aboutErrors.brandLogo?.message as string | undefined}
            />
          )}

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-700 mb-1">
                {t("onboarding.restaurant.about.imageSpecTitle")}
              </p>
              <p className="text-xs text-blue-600 leading-relaxed">
                {t("onboarding.restaurant.about.imageSpecText")}
                {hasMultipleBranches && ` ${t("onboarding.restaurant.about.brandLogoSpecText")}`}
              </p>
            </div>
          </div>
        </form>
        )}
      </div>

      <div className="flex flex-col justify-start">
        {view === "info" ? (
          <>
            <Button
              type="submit"
              form="restaurant-info-form"
              className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all hover:scale-[1.01]"
            >
              {t("onboarding.restaurant.form.continue")} →
            </Button>

            <Button type="button" variant="link" onClick={handleBack} className="w-full text-slate-600 text-sm">
              ← {t("onboarding.restaurant.form.goBack")}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="submit"
              form="about-restaurant-form"
              className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all hover:scale-[1.01]"
            >
              {t("Continue")} →
            </Button>

            <Button
              type="button"
              variant="link"
              onClick={() => setView("info")}
              className="w-full text-slate-600 text-sm"
            >
              ← {t("onboarding.restaurant.documents.backToDetails")}
            </Button>
          </>
        )}
      </div>

      <Modal
        isOpen={!!pendingSubmit}
        onClose={() => setPendingSubmit(null)}
        title={t("onboarding.restaurant.form.confirmTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("onboarding.restaurant.form.confirmSubtitle")}
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {hasMultipleBranches
                ? t("onboarding.restaurant.form.addressLabel")
                : t("onboarding.restaurant.form.restaurantAddressLabel")}
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              {formatAddressForDisplay(
                hasMultipleBranches ? registeredAddress : pendingSubmit?.restaurantAddress
              )}
            </p>
          </div>
          {!hasMultipleBranches && pendingSubmit?.location && (
            <MapPicker
              initialLocation={parseLatLng(pendingSubmit.location)}
              readOnly
            />
          )}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingSubmit(null)}
              className="flex-1"
            >
              {t("onboarding.restaurant.form.confirmEdit")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              className="flex-1 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold"
            >
              {t("onboarding.restaurant.form.confirmProceed")}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
