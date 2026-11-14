import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type AddRestaurantValues,
  addRestaurantSchema,
} from "../validations/outletSchema";
// 2026-10-20: served city/state lists shared with onboarding (was hardcoded Gurugram/Haryana).
import { CITY_STATE_MAP, SERVED_CITY_OPTIONS, SERVED_STATE_OPTIONS } from "../schemas";
import { useOutletStore } from "../store/useOutletStore";
import { MenuList } from "./common/MenuList";
import { MenuImagesPicker } from "./common/MenuImagesPicker";
import { FoodTypeButton } from "./common/FoodTypeSelector";
import { LocationPicker } from "./common/LocationPicker";
import { ManagerDetails } from "./common/ManagerDetails";
import { CroppedImageUpload } from "./common/CroppedImageUpload";
import { DocumentFileBox } from "./common/DocumentFileBox";
import { SameAsBrandCheckbox } from "./common/SameAsBrandCheckbox";
import ReactSelect from "react-select";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import {
  Loader2,
  ArrowRight,
  Utensils,
  CreditCard,
  User,
  Store,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/required-mark";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Restaurant } from "@/types/restaurantTypes";
import { masterDataService } from "../api/masterData";
import { onboardingService } from "../api/onboardingService";
import { restaurantService } from "@/api/restaurantService";
import { multimediaService } from "@/api/multimediaService";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { useErrorScrollObserver, scrollToFirstError } from "../utils/errorScrollObserver";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Helper Components ---

// `required` only draws the label asterisk (2026-10-20) - destructured so it never reaches the
// <input>: native `required` would pop browser validation bubbles over the zod messages.
const FloatingInput = ({ label, error, placeholder, required, ...props }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold uppercase tracking-widest pl-1 dark:text-slate-300">
      {label}
      {required && <RequiredMark />}
    </Label>
    <input
      className="block px-3 py-2.5 w-full text-base text-gray-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all"
      placeholder={placeholder || label}
      {...props}
    />
    {error && <p className="text-red-500 text-xs pl-1 font-medium">{error}</p>}
  </div>
);

// --- Component ---

interface AddRestaurantFormProps {
  onCancel: () => void;
  onSuccess: (newRestro: Restaurant) => void;
  // New props for Edit Mode
  isEditMode?: boolean;
  initialData?: any; // the raw restaurant data from GET
  onDirtyStateChange?: (isDirty: boolean) => void;
  // 2026-11-12 (dashboard Outlet Info page). All default to the onboarding behaviour.
  // showBankSection=false: bank accounts are managed separately there, so the section is hidden
  // and no bank fields are sent (the PATCH only touches bank data when bankDetails is sent).
  showBankSection?: boolean;
  // showLimits: adds the order/COD limits section (partner-editable since 2026-11-12).
  showLimits?: boolean;
  // scrollable (default true): the form scrolls inside itself, for onboarding's fixed-height panel.
  // false (dashboard full page): it just grows with its content and the page scrolls - an inner
  // scroll box there clipped the form (its container has no fixed height).
  scrollable?: boolean;
  // showManagerSection=false: hides the outlet-manager section and sends no manager fields. The
  // PATCH re-runs manager reassignment whenever isUserManaging is sent, and the dashboard edit
  // doesn't manage the manager (contacts are edited separately there).
  showManagerSection?: boolean;
  // Asked after validation, before anything is uploaded or saved; resolve false to stay on the
  // form. Used to warn that saving sends the outlet for approval (offline until approved).
  confirmBeforeSave?: () => Promise<boolean>;
}

const STORAGE_KEY = "add_restaurant_form_data";

export const AddRestaurantForm = ({
  onCancel,
  onSuccess,
  isEditMode = false,
  initialData = null,
  onDirtyStateChange,
  showBankSection = true,
  showLimits = false,
  showManagerSection = true,
  scrollable = true,
  confirmBeforeSave,
}: AddRestaurantFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  // 2026-11-12: only the saving flag still lives in the outlet store; the outlet photo and menu
  // photos now render straight from the form values (CroppedImageUpload / MenuImagesPicker).
  const { isSaving, setIsSaving } = useOutletStore();
  const { associatedUsers } = useOnboardingStore();

  useErrorScrollObserver();


  // Fetch associated users for manager selection
  const [managers, setManagers] = useState<
    {
      userId?: string;
      isUserManaging: boolean;
      name?: string;
      email?: string;
      mobile?: string;
      whatsapp?: string;
    }[]
  >([]);
  useEffect(() => {
    if (associatedUsers && associatedUsers.length > 0) {
      setManagers(
        associatedUsers.map((u) => ({
          userId: u.userId,
          isUserManaging: false,
          name: u.name,
          email: u.email,
          mobile: u.mobileNumber,
          whatsapp: u.whatsappNumber,
        })),
      );
    }
  }, [associatedUsers]);

  // --- Infinite Scroll & Search logic using ReactSelect ---
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: cuisineData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingCuisines,
  } = useInfiniteQuery({
    queryKey: ["cuisines", debouncedSearch],
    queryFn: ({ pageParam = 0 }) =>
      masterDataService.getCuisines({
        search: debouncedSearch,
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
    const allCuisines =
      cuisineData?.pages.flatMap((page) => page.content) || [];
    return allCuisines.map((c) => ({
      value: c.cuisineId,
      label: c.cuisineName,
    }));
  }, [cuisineData]);

  const { data: posProviderData } = useQuery({
    queryKey: ["posProviders"],
    queryFn: () => masterDataService.getPosProviders({ size: 50 }),
  });

  // 2026-10-26: brand values for the "Same as brand" previews (PAN, cuisines). The backend does
  // the actual copy, so this is display-only and best-effort: the endpoint only answers for the
  // user who onboarded the brand, and any other brand user just sees a generic "brand's value
  // will be used" note instead of the value.
  const { data: brandData } = useQuery({
    queryKey: ["brandOnboardingData"],
    queryFn: () => onboardingService.getOnboardingData(),
    enabled: !isEditMode,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const brandPan = brandData?.restaurantInfo?.panNumber || "";
  const brandCuisineIds = brandData?.aboutRestaurant?.cuisines ?? [];

  const posProviderOptions = useMemo(() => {
    return (posProviderData?.content || []).map((p) => ({
      value: p.posProviderName,
      label: p.posProviderName,
    }));
  }, [posProviderData]);

  const savedData = useMemo(() => {
    if (isEditMode) return null; // Don't use session storage in edit mode
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Failed to parse session storage data", e);
      return null;
    }
  }, [isEditMode]);

  // Transform initialData into AddRestaurantValues format
  const getEditValues = () => {
    if (!initialData) return null;

    // Parse address parts
    const parts = (initialData.address || "").split("|");
    const restaurantAddress = {
      line1: parts[0] || "",
      landmark: parts[1] || "",
      line2: parts[2] || "",
      locality: parts[3] || "",
      state: parts[4] || "",
      pincode: parts[5] || "",
    };

    return {
      restaurantName: initialData.restroName || "",
      restaurantAddress,
      location: initialData.coordinates || "",
      usesPos: initialData.usesPos ?? false,
      posProvider: initialData.posProvider || "",
      hasOwnDeliveryPartners: initialData.doHaveDeliveryPartners ?? false,
      deliveryBy: initialData.isDeliveryViaUSTART ? "USTART" : "OWN",
      servingOptions:
        initialData.servingOptions === "BOTH"
          ? ["DELIVERY", "DINE_IN"]
          : initialData.servingOptions
            ? [initialData.servingOptions]
            : ["DELIVERY"],
      foodTypes: {
        isVegAvailable: initialData.isVegAvailable ?? true,
        isNonVegAvailable: initialData.isNonVegAvailable ?? false,
        isEggAvailable: initialData.isEggAvailable ?? false,
      },
      cuisines: initialData.cuisineIds || [],

      // 2026-11-12: with the manager section hidden nothing manager-related is sent, so default to
      // "I manage it" - otherwise the manager-details rule could fail on fields the user can't see.
      isUserManaging: showManagerSection ? (initialData.isAssociated ?? true) : true,
      managerId: initialData.associatedUserId || "",
      managerName: initialData.managerName || "",
      managerMobile: initialData.managerMobile || "",
      managerEmail: initialData.managerEmail || "",
      managerWhatsapp: initialData.managerWhatsapp || "",

      bankAccountType: "BRAND", // Forced in creation flows, keeping it BRAND
      bankDetails: {
        accountNumber: "", // Won't have full acc num from API, will handle differently
        accountHolderName: initialData.accountHolderName || "",
        bankName: "",
        bankBranch: "",
        ifscCode: "",
      },
      // 2026-10-19: FSSAI number/expiry and dining menu are now returned by the detail API.
      fssaiNumber: initialData.fssaiNumber || "",
      fssaiExpiryDate: initialData.fssaiExpiryDate || "",
      panNumber: initialData.panNumber || "",
      gstNumber: initialData.gstNumber || "",
      fssaiCertificate: initialData.fssaiLicenseImage,
      primaryImage: initialData.primaryImage,
      menuImages: initialData.deliveryMenuImages || [],
      diningMenuImages: initialData.diningMenuImages || [],
      // 2026-11-12: limits as strings for the text inputs (detail API returns numbers).
      minOrderValue: initialData.minOrderValue != null ? String(initialData.minOrderValue) : "",
      maxOrderValue: initialData.maxOrderValue != null ? String(initialData.maxOrderValue) : "",
      minCodValue: initialData.minCodValue != null ? String(initialData.minCodValue) : "",
      maxCodValue: initialData.maxCodValue != null ? String(initialData.maxCodValue) : "",
    };
  };

  const initialValues = isEditMode ? getEditValues() : savedData;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty },
    setValue,
  } = useForm<AddRestaurantValues>({
    resolver: zodResolver(addRestaurantSchema),
    mode: "onChange",
    defaultValues: initialValues
      ? {
          ...initialValues,
        }
      : {
          hasOwnDeliveryPartners: false,
          deliveryBy: "USTART",
          servingOptions: ["DELIVERY"],
          foodTypes: {
            isVegAvailable: true,
            isNonVegAvailable: false,
            isEggAvailable: false,
          },
          cuisines: [],
          isUserManaging: true,
          restaurantAddress: {
            line1: "",
            line2: "",
            landmark: "",
            locality: "Gurugram",
            state: "Haryana",
            pincode: "",
          },
          location: "",
          usesPos: false,
          posProvider: "",
          fssaiNumber: "",
          fssaiExpiryDate: "",
          // 2026-10-26: "Same as brand" starts unticked (product decision).
          panSameAsBrand: false,
          cuisinesSameAsBrand: false,
          timingsSameAsBrand: false,
          diningMenuImages: [],
          bankAccountType: "BRAND",
          bankDetails: {
            accountNumber: "",
            accountHolderName: "",
            bankName: "",
            bankBranch: "",
            ifscCode: "",
          },
        },
  });

  // Notify parent of dirty state changes
  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(isDirty);
    }
  }, [isDirty, onDirtyStateChange]);

  // Session Storage Persistence
  useEffect(() => {
    if (isEditMode) return; // Do not persist to session storage in edit mode
    const subscription = watch((value) => {
      // Exclude file objects and other non-serializable data
      const { primaryImage, menuImages, fssaiCertificate, diningMenuImages, ...rest } = value;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    });
    return () => subscription.unsubscribe();
  }, [watch, isEditMode]);

  const onSubmit = async (data: AddRestaurantValues) => {
    // 2026-11-12: optional confirmation (dashboard edit) before any upload or API call.
    if (confirmBeforeSave && !(await confirmBeforeSave())) return;
    setIsSaving(true);
    try {
      // 1. Prepare Address (Pipe-separated: Line1 | Line2 | Landmark | City | State | PostalCode)
      const formattedAddress = [
        data.restaurantAddress.line1,
        data.restaurantAddress.line2,
        data.restaurantAddress.landmark || "",
        data.restaurantAddress.locality,
        data.restaurantAddress.state,
        data.restaurantAddress.pincode,
      ].join("|");

      // 2. File Uploads to S3
      toast.info(
        t("onboarding.restaurant.uploadingDocs", "Uploading documents..."),
      );

      let primaryImageResult: any = "";
      if (data.primaryImage instanceof File) {
        primaryImageResult = await multimediaService.uploadRestaurantDoc(
          data.primaryImage,
          "restaurant_primary_image",
        );
      } else if (typeof data.primaryImage === "string") {
        primaryImageResult = data.primaryImage;
      }

      const menuImageResult: any[] = [];
      if (data.menuImages && data.menuImages.length > 0) {
        for (const file of data.menuImages) {
          if (file instanceof File) {
            const result = await multimediaService.uploadRestaurantDoc(
              file,
              "restaurant_delivery_menu",
            );
            menuImageResult.push(result);
          } else if (typeof file === "string") {
            menuImageResult.push(file);
          }
        }
      }

      // 2026-10-19: dining menu photos - only uploaded/sent for dine-in outlets.
      const offersDineIn = data.servingOptions.includes("DINE_IN");
      const diningMenuImageKeys: string[] = [];
      if (offersDineIn) {
        for (const img of data.diningMenuImages || []) {
          if (img instanceof File) {
            const result = await multimediaService.uploadRestaurantDoc(
              img,
              "restaurant_dining_menu",
            );
            diningMenuImageKeys.push(result.key);
          } else {
            diningMenuImageKeys.push(img);
          }
        }
      }

      let fssaiResult: any = "";
      if (data.fssaiCertificate instanceof File) {
        fssaiResult = await multimediaService.uploadRestaurantDoc(
          data.fssaiCertificate,
          "restaurant_fssai",
        );
      } else if (typeof data.fssaiCertificate === "string") {
        fssaiResult = data.fssaiCertificate;
      }

      // 3. Construct Payload
      // Extract S3 keys — backend expects plain strings, not { key, fileName } objects
      const primaryImageKey =
        typeof primaryImageResult === "object"
          ? primaryImageResult.key
          : primaryImageResult;
      const fssaiKey =
        typeof fssaiResult === "object" ? fssaiResult.key : fssaiResult;
      const menuImageKeys = menuImageResult.map((r: any) =>
        typeof r === "object" ? r.key : r,
      );

      const payload = {
        restroName: data.restaurantName,
        address: formattedAddress,
        coordinates: data.location,
        isDeliveryViaUSTART: data.deliveryBy === "USTART",
        doHaveDeliveryPartners: data.hasOwnDeliveryPartners,
        isVegAvailable: data.foodTypes.isVegAvailable,
        isEggAvailable: data.foodTypes.isEggAvailable,
        isNonVegAvailable: data.foodTypes.isNonVegAvailable,
        servingOptions: data.servingOptions,
        // 2026-10-26: a "same as brand" field is left out; the backend copies the brand's value.
        cuisineIds: data.cuisinesSameAsBrand ? undefined : data.cuisines,
        primaryImage: primaryImageKey,
        deliveryMenuImages: menuImageKeys,
        diningMenuImages: offersDineIn ? diningMenuImageKeys : undefined,
        // 2026-11-12: manager fields only when the section is shown (see showManagerSection).
        isUserManaging: showManagerSection ? data.isUserManaging : undefined,
        managerId: showManagerSection && !data.isUserManaging ? data.managerId : undefined,
        managerName: showManagerSection && !data.isUserManaging ? data.managerName : undefined,
        managerMobile: showManagerSection && !data.isUserManaging ? data.managerMobile : undefined,
        managerEmail: showManagerSection && !data.isUserManaging ? data.managerEmail : undefined,
        managerWhatsapp: showManagerSection && !data.isUserManaging
          ? data.managerWhatsapp
          : undefined,
        // 2026-11-12: no bank fields at all when the section is hidden (dashboard edit).
        bankAccountType: showBankSection ? data.bankAccountType : undefined,
        bankDetails:
          showBankSection && data.bankAccountType === "OTHER"
            ? {
                bankAccountNumber: data.bankDetails?.accountNumber || "",
                ifscCode: data.bankDetails?.ifscCode || "",
                accountHolderName: data.bankDetails?.accountHolderName || "",
                bankName: data.bankDetails?.bankName || "",
                branchName: data.bankDetails?.bankBranch || "",
              }
            : undefined,
        gstNumber: data.gstNumber,
        usesPos: data.usesPos,
        posProvider: data.usesPos ? data.posProvider : undefined,
        fssaiLicenseImage: fssaiKey,
        fssaiNumber: data.fssaiNumber,
        fssaiExpiryDate: data.fssaiExpiryDate,
        panNumber: data.panSameAsBrand ? undefined : data.panNumber,
        // 2026-11-12: limits only from the dashboard edit page; an emptied box isn't sent.
        ...(showLimits && {
          minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : undefined,
          maxOrderValue: data.maxOrderValue ? Number(data.maxOrderValue) : undefined,
          minCodValue: data.minCodValue ? Number(data.minCodValue) : undefined,
          maxCodValue: data.maxCodValue ? Number(data.maxCodValue) : undefined,
        }),
        // Create only - the backend ignores these on update, and the edit flow never sets them.
        ...(!isEditMode && {
          panSameAsBrand: !!data.panSameAsBrand,
          cuisinesSameAsBrand: !!data.cuisinesSameAsBrand,
          timingsSameAsBrand: !!data.timingsSameAsBrand,
        }),
      };

      // 4. API Call
      let response: any;
      if (isEditMode && initialData?.restroId) {
        // Prepare update payload - typically we can send the whole payload
        response = await restaurantService.updateRestaurant(
          initialData.restroId,
          payload as any,
        );
      } else {
        response = await restaurantService.createRestaurant(payload as any);
      }

      // 5. Success Handling
      const newRestro: Restaurant = {
        restroId: response.restroId,
        restroName: response.restroName,
        address: `${data.restaurantAddress.line1}, ${data.restaurantAddress.line2}, ${data.restaurantAddress.locality}`,
        cityName: data.restaurantAddress.locality,
        status: response.newStatus,
        primaryImage: primaryImageKey,
        isBlocked: false,
        brandName: user?.brandId || "My Brand",
        isUserManaging: data.isUserManaging,
        managerId: payload.managerId,
        managerName: payload.managerName,
        managerMobile: payload.managerMobile,
        managerEmail: payload.managerEmail,
        managerWhatsapp: payload.managerWhatsapp,
        // New outlets are never the onboarding restaurant, so never setup-locked.
        isSetupLocked: false,
      };

      // 2026-10-19: no longer forces the auth context's isMultipleRestro to true here - that
      // flipped a single-branch partner into "multiple restaurants" mode after adding just one
      // outlet, which then blocked "Move to Menu". The backend now only switches the brand to
      // multi once it actually has 2+ restaurants; CompleteSetup refreshes the session after a
      // successful add to pick that up.
      onSuccess(newRestro);
      if (!isEditMode) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      toast.success(
        isEditMode
          ? t(
              "onboarding.restaurant.complete.updateSuccess",
              "Restaurant updated successfully",
            )
          : t("onboarding.restaurant.complete.saveSuccess"),
      );
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        t("onboarding.restaurant.complete.saveError");
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // 2026-11-12: two layouts (see `scrollable`). Onboarding: fills its panel and scrolls inside.
    // Dashboard: no height or overflow of its own - it grows with the content.
    <div className={`${scrollable ? "flex-1 flex flex-col h-full" : "flex flex-col"} relative bg-[#f6f8f7] dark:bg-slate-950 animate-in slide-in-from-right duration-300`}>
      {/* Content */}
      <div className={`${scrollable ? "flex-1 overflow-y-auto scroll-smooth" : ""} px-6 md:px-10 py-8`}>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.error("Validation Errors:", errors);
            const errorFields = Object.keys(errors).join(", ");
            toast.error(
              t(
                "onboarding.restaurant.complete.setupForm.validationError",
                `Please fix the following errors: ${errorFields}`,
              ),
            );
            // Scroll to the first validation error
            setTimeout(() => {
              scrollToFirstError();
            }, 500);
          })}
          className="w-full space-y-6 pb-20"
        >
          <Accordion
            type="multiple"
            defaultValue={["details"]}
            className="w-full space-y-6"
          >
            {/* 1. Restaurant Details */}
            <AccordionItem
              value="details"
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden border-none"
            >
              <AccordionTrigger className="p-6 bg-gray-50/50 dark:bg-slate-800/50 hover:no-underline border-b border-gray-50 dark:border-slate-800 dark:text-white [&>svg]:w-5 [&>svg]:h-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  {t(
                    "onboarding.restaurant.complete.setupForm.restaurantDetails",
                  )}
                </h2>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="p-6 md:p-8 space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <FloatingInput
                      required
                      label={t(
                        "onboarding.restaurant.complete.setupForm.restaurantName",
                      )}
                      {...register("restaurantName")}
                      error={errors.restaurantName?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[60%_35%] gap-10 items-start">
                    {/* Left side: Address Fields (60%) */}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold uppercase tracking-wide">
                          {t(
                            "onboarding.restaurant.complete.setupForm.completeAddress",
                          )}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <FloatingInput
                            required
                            label={t(
                              "onboarding.restaurant.form.addressLabels.line1",
                            )}
                            {...register("restaurantAddress.line1")}
                            error={errors.restaurantAddress?.line1?.message}
                          />
                          <FloatingInput
                            required
                            label={t(
                              "onboarding.restaurant.form.addressLabels.line2",
                            )}
                            {...register("restaurantAddress.line2")}
                            error={errors.restaurantAddress?.line2?.message}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FloatingInput
                            label={t(
                              "onboarding.restaurant.form.addressLabels.landmark",
                            )}
                            {...register("restaurantAddress.landmark")}
                            error={errors.restaurantAddress?.landmark?.message}
                          />
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-widest pl-1">
                              {t(
                                "onboarding.restaurant.form.addressLabels.locality",
                              )}<RequiredMark />
                            </Label>
                            <Controller
                              name="restaurantAddress.locality"
                              control={control}
                              render={({ field }) => (
                                <ReactSelect
                                  options={SERVED_CITY_OPTIONS}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(opt: any) => {
                                    // 2026-10-20: the state follows the city (CITY_STATE_MAP), so a city/state
                                    // mismatch like Noida + Haryana can't be submitted.
                                    const city = opt?.value || "";
                                    field.onChange(city);
                                    if (city) setValue("restaurantAddress.state", CITY_STATE_MAP[city], { shouldDirty: true });
                                  }}
                                  className="text-base"
                                  styles={{
                                    control: (base, state) => ({
                                      ...base,
                                      borderRadius: "0.75rem",
                                      borderColor: state.isFocused
                                        ? "#FF9F43"
                                        : "#e2e8f0",
                                      boxShadow: state.isFocused
                                        ? "0 0 0 1px #FF9F43"
                                        : "none",
                                      "&:hover": { borderColor: "#FF9F43" },
                                      minHeight: "44px",
                                    }),
                                  }}
                                />
                              )}
                            />
                            {errors.restaurantAddress?.locality && (
                              <p className="text-red-500 text-xs pl-1 font-medium">
                                {errors.restaurantAddress.locality.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-widest pl-1">
                              {t(
                                "onboarding.restaurant.form.addressLabels.state",
                              )}<RequiredMark />
                            </Label>
                            <Controller
                              name="restaurantAddress.state"
                              control={control}
                              render={({ field }) => (
                                <ReactSelect
                                  options={SERVED_STATE_OPTIONS}
                                  value={
                                    field.value
                                      ? {
                                          value: field.value,
                                          label: field.value,
                                        }
                                      : null
                                  }
                                  onChange={(opt: any) =>
                                    field.onChange(opt?.value || "")
                                  }
                                  className="text-sm"
                                  styles={{
                                    control: (base, state) => ({
                                      ...base,
                                      borderRadius: "0.75rem",
                                      borderColor: state.isFocused
                                        ? "#FF9F43"
                                        : "#e2e8f0",
                                      boxShadow: state.isFocused
                                        ? "0 0 0 1px #FF9F43"
                                        : "none",
                                      "&:hover": { borderColor: "#FF9F43" },
                                      minHeight: "44px",
                                    }),
                                  }}
                                />
                              )}
                            />
                          </div>
                          <FloatingInput
                            required
                            label={t(
                              "onboarding.restaurant.form.addressLabels.pincode",
                            )}
                            {...register("restaurantAddress.pincode")}
                            error={errors.restaurantAddress?.pincode?.message}
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right side: Location & Link (40%) */}
                    <div className="space-y-6 pt-1">
                      <LocationPicker
                        locationValue={watch("location")}
                        onLocationChange={(val) => setValue("location", val)}
                        error={errors.location?.message}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                    {/* Left Column: Logistics */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                          <div className="space-y-0.5">
                            <Label className="text-base font-bold">
                              {t(
                                "onboarding.restaurant.complete.setupForm.ownPartners",
                              )}
                            </Label>
                          </div>
                          <Controller
                            control={control}
                            name="hasOwnDeliveryPartners"
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>

                        <Controller
                          control={control}
                          name="hasOwnDeliveryPartners"
                          render={({ field: { value: hasPartners } }) => (
                            <>
                              {hasPartners && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex flex-col gap-1">
                                    <Label className="text-xs font-bold uppercase tracking-widest pl-1">
                                      {t(
                                        "onboarding.restaurant.complete.setupForm.deliveryBy",
                                      )}
                                    </Label>
                                  </div>
                                  <Controller
                                    control={control}
                                    name="deliveryBy"
                                    render={({ field }) => (
                                      <Tabs
                                        value={
                                          field.value === "USTART"
                                            ? "USTART"
                                            : "SELF"
                                        }
                                        onValueChange={(val) =>
                                          field.onChange(
                                            val === "USTART"
                                              ? "USTART"
                                              : "Restaurant",
                                          )
                                        }
                                        className="w-full text-base"
                                      >
                                        <TabsList className="flex w-auto inline-flex bg-slate-100/50 p-1 rounded-xl gap-1 h-11">
                                          <TabsTrigger
                                            value="USTART"
                                            className="px-6 rounded-lg data-[state=active]:bg-[#0F2441] data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-sm transition-all"
                                          >
                                            USTART
                                          </TabsTrigger>
                                          <TabsTrigger
                                            value="SELF"
                                            className="px-6 rounded-lg data-[state=active]:bg-[#0F2441] data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-sm transition-all"
                                          >
                                            {t(
                                              "onboarding.restaurant.complete.setupForm.management.me",
                                            )}
                                          </TabsTrigger>
                                        </TabsList>
                                      </Tabs>
                                    )}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </div>

                    {/* Right Column: Serving Options */}
                    <div className="space-y-6">
                      <div className="space-y-3 flex w-full items-start justify-between">
                        <div className="flex flex-col">
                          <Label className="text-lg font-bold uppercase tracking-widest pl-1">
                            {t(
                              "onboarding.restaurant.complete.setupForm.servingOptions",
                            )}<RequiredMark />
                          </Label>
                          <p className="text-base pl-1">
                            {t(
                              "onboarding.restaurant.complete.card.diningHint",
                            )}
                          </p>
                        </div>
                        <div>
                          <Controller
                            control={control}
                            name="servingOptions"
                            render={({ field }) => (
                              <div className="flex gap-3 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = field.value || [];
                                    const next = current.includes("DELIVERY")
                                      ? current.filter((o) => o !== "DELIVERY")
                                      : [...current, "DELIVERY"];
                                    field.onChange(next);
                                  }}
                                  className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all border ${field.value?.includes("DELIVERY") ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20" : "bg-white border-slate-200 hover:border-slate-300"}`}
                                >
                                  {t(
                                    "onboarding.restaurant.complete.card.deliveryLabel",
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = field.value || [];
                                    const next = current.includes("DINE_IN")
                                      ? current.filter((o) => o !== "DINE_IN")
                                      : [...current, "DINE_IN"];
                                    field.onChange(next);
                                  }}
                                  className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all border ${field.value?.includes("DINE_IN") ? "bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20" : "bg-white border-slate-200 hover:border-slate-300"}`}
                                >
                                  {t(
                                    "onboarding.restaurant.complete.card.dineInLabel",
                                  )}
                                </button>
                              </div>
                            )}
                          />
                          {errors.servingOptions && (
                            <p className="text-red-500 text-xs">
                              {errors.servingOptions.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 pt-4">
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold uppercase tracking-wide">
                        {t("onboarding.restaurant.about.foodTypeLabel")}<RequiredMark />
                      </h3>
                      <Controller
                        control={control}
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
                                  isNonVegAvailable:
                                    !field.value.isNonVegAvailable,
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
                      {errors.foodTypes?.root && (
                        <p className="text-red-500 text-xs">
                          {errors.foodTypes.root.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-base font-semibold uppercase tracking-wide">
                          {t("onboarding.restaurant.about.cuisineLabel")}<RequiredMark />
                        </Label>
                        {!isEditMode && (
                          <Controller
                            control={control}
                            name="cuisinesSameAsBrand"
                            render={({ field }) => (
                              <SameAsBrandCheckbox
                                id="cuisinesSameAsBrand"
                                label={t("onboarding.restaurant.complete.setupForm.sameAsBrand.label")}
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  // Re-run the cuisines rule now that it depends on this flag.
                                  setValue("cuisines", watch("cuisines") || [], { shouldValidate: true });
                                }}
                              />
                            )}
                          />
                        )}
                      </div>
                      {watch("cuisinesSameAsBrand") ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                          {brandCuisineIds.length > 0
                            ? t("onboarding.restaurant.complete.setupForm.sameAsBrand.brandCuisines", {
                                value: brandCuisineIds
                                  .map((id) => cuisineOptions.find((o) => o.value === id)?.label)
                                  .filter(Boolean)
                                  .join(", ") ||
                                  t("onboarding.restaurant.complete.setupForm.sameAsBrand.cuisineCount", {
                                    count: brandCuisineIds.length,
                                  }),
                              })
                            : t("onboarding.restaurant.complete.setupForm.sameAsBrand.brandValueUsed")}
                        </p>
                      ) : (
                      <Controller
                        control={control}
                        name="cuisines"
                        render={({ field }) => (
                          <ReactSelect
                            isMulti
                            isLoading={isLoadingCuisines}
                            options={cuisineOptions}
                            value={(field.value || []).map((id: number) => {
                              const opt = cuisineOptions.find(
                                (o) => o.value === id,
                              );
                              return (
                                opt || {
                                  value: id,
                                  label: `Selected (ID: ${id})`,
                                }
                              );
                            })}
                            components={{ MenuList }}
                            {...({
                              hasNextPage,
                              isFetchingNextPage,
                              fetchNextPage,
                              t,
                            } as any)}
                            inputValue={searchQuery}
                            onInputChange={(newValue, { action }) => {
                              if (action === "input-change")
                                setSearchQuery(newValue);
                            }}
                            onChange={(newValue: any) => {
                              field.onChange(
                                newValue
                                  ? newValue.map((v: any) => v.value)
                                  : [],
                              );
                              setSearchQuery("");
                            }}
                            closeMenuOnSelect={false}
                            placeholder={t(
                              "onboarding.restaurant.about.cuisinePlaceholder",
                            )}
                            className="react-select-container text-base"
                            classNamePrefix="react-select"
                            filterOption={() => true}
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                borderRadius: "0.75rem",
                                borderColor: state.isFocused
                                  ? "#FF9F43"
                                  : "#e2e8f0",
                                boxShadow: state.isFocused
                                  ? "0 0 0 1px #FF9F43"
                                  : "none",
                                "&:hover": {
                                  borderColor: "#FF9F43",
                                },
                                padding: "2px",
                                minHeight: "48px",
                              }),
                              multiValue: (base) => ({
                                ...base,
                                backgroundColor: "#ffffff",
                                borderRadius: "0.5rem",
                                border: "1px solid #e2e8f0",
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                color: "#000000",
                                fontWeight: 500,
                              }),
                              multiValueRemove: (base) => ({
                                ...base,
                                color: "#000000",
                                ":hover": {
                                  backgroundColor: "#e2e8f0",
                                  color: "#ef4444",
                                },
                              }),
                            }}
                          />
                        )}
                      />
                      )}
                      {errors.cuisines && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.cuisines.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2026-10-26: timings aren't entered on this form (they're set in Verify
                      Schedules); ticking this makes the backend create the outlet's schedule
                      from the brand's hours instead. */}
                  {!isEditMode && (
                    <div className="space-y-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold uppercase tracking-wide">
                          {t("onboarding.restaurant.complete.setupForm.sameAsBrand.timingsTitle")}
                        </h3>
                        <Controller
                          control={control}
                          name="timingsSameAsBrand"
                          render={({ field }) => (
                            <SameAsBrandCheckbox
                              id="timingsSameAsBrand"
                              label={t("onboarding.restaurant.complete.setupForm.sameAsBrand.label")}
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {watch("timingsSameAsBrand")
                          ? t("onboarding.restaurant.complete.setupForm.sameAsBrand.timingsTicked")
                          : t("onboarding.restaurant.complete.setupForm.sameAsBrand.timingsUnticked")}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* 2026-11-12: the shared image box - shows the current photo, a click picks a new
                        one and crops it to 16:9 (1MB on the cropped file, as before), and clicking the
                        preview enlarges it. Replaces this form's own box, which couldn't enlarge. */}
                    <Controller
                      control={control}
                      name="primaryImage"
                      render={({ field }) => (
                        <CroppedImageUpload
                          value={field.value as File | string | undefined}
                          onChange={(file) => field.onChange(file)}
                          aspect={16 / 9}
                          maxFileSizeMb={1}
                          label={t("onboarding.restaurant.complete.setupForm.primaryImage")}
                          uploadText={t("onboarding.restaurant.complete.setupForm.uploadPhoto")}
                          uploadSubtext={t("onboarding.restaurant.complete.setupForm.imgSpecs", "Max 1MB, JPG/PNG")}
                          error={errors.primaryImage?.message as string | undefined}
                        />
                      )}
                    />
                    <div>
                      <h3 className="text-base font-semibold uppercase tracking-wide mb-3 dark:text-zinc-100">
                        {t("onboarding.restaurant.complete.setupForm.deliveryMenu")}
                      </h3>
                      {/* 2026-11-12: same picker as the dine-in menu - current photos shown, new
                          ones cropped at 3:4, click a tile to replace it, expand icon to enlarge. */}
                      <Controller
                        control={control}
                        name="menuImages"
                        render={({ field }) => (
                          <MenuImagesPicker
                            images={field.value || []}
                            onChange={field.onChange}
                            label={t("onboarding.restaurant.complete.setupForm.deliveryMenu")}
                            error={errors.menuImages?.message as string | undefined}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* 2026-10-19: dining menu - collected (and required) only for dine-in outlets */}
                  {watch("servingOptions")?.includes("DINE_IN") && (
                    <div className="pt-2">
                      <h3 className="text-base font-semibold uppercase tracking-wide mb-3 dark:text-zinc-100">
                        {t("onboarding.restaurant.complete.setupForm.diningMenu")}<RequiredMark />
                      </h3>
                      <Controller
                        control={control}
                        name="diningMenuImages"
                        render={({ field }) => (
                          <MenuImagesPicker
                            images={field.value || []}
                            onChange={field.onChange}
                            error={errors.diningMenuImages?.message}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Government Details */}
            <AccordionItem
              value="government"
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden border-none"
            >
              <AccordionTrigger className="p-6 bg-gray-50/50 dark:bg-slate-800/50 hover:no-underline border-b border-gray-50 dark:border-slate-800 dark:text-white [&>svg]:w-5 [&>svg]:h-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {t(
                    "onboarding.restaurant.complete.setupForm.governmentDetails",
                  )}
                </h2>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="p-6 md:p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <FloatingInput
                        required
                        label={t(
                          "onboarding.restaurant.complete.setupForm.panNumber",
                        )}
                        {...register("panNumber")}
                        // 2026-10-26: read-only (not disabled - RHF drops disabled values, which
                        // would fail the string schema) while the brand's PAN is used.
                        readOnly={!!watch("panSameAsBrand")}
                        placeholder={
                          watch("panSameAsBrand") && !brandPan
                            ? t("onboarding.restaurant.complete.setupForm.sameAsBrand.brandValueUsed")
                            : undefined
                        }
                        error={errors.panNumber?.message}
                      />
                      {!isEditMode && (
                        <Controller
                          control={control}
                          name="panSameAsBrand"
                          render={({ field }) => (
                            <SameAsBrandCheckbox
                              id="panSameAsBrand"
                              label={t("onboarding.restaurant.complete.setupForm.sameAsBrand.label")}
                              checked={!!field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                // Show the brand's PAN while ticked; clear it on untick so the
                                // user types the outlet's own instead of keeping the brand's.
                                setValue("panNumber", checked ? brandPan : "", { shouldValidate: true });
                              }}
                            />
                          )}
                        />
                      )}
                    </div>
                    <FloatingInput
                      label={t(
                        "onboarding.restaurant.complete.setupForm.gstNumber",
                      )}
                      {...register("gstNumber")}
                      error={errors.gstNumber?.message}
                    />
                    {/* 2026-10-19: each outlet's own FSSAI licence number + expiry */}
                    <FloatingInput
                      required
                      label={t(
                        "onboarding.restaurant.complete.setupForm.fssaiNumber",
                      )}
                      {...register("fssaiNumber")}
                      error={errors.fssaiNumber?.message}
                      inputMode="numeric"
                      maxLength={14}
                    />
                    <FloatingInput
                      required
                      label={t(
                        "onboarding.restaurant.complete.setupForm.fssaiExpiryDate",
                      )}
                      type="date"
                      {...register("fssaiExpiryDate")}
                      error={errors.fssaiExpiryDate?.message}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                      <Label className="text-base font-bold">
                        {t("onboarding.restaurant.form.posQuestion")}
                      </Label>
                      <Controller
                        control={control}
                        name="usesPos"
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) setValue("posProvider", "");
                            }}
                          />
                        )}
                      />
                    </div>
                    {watch("usesPos") && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Controller
                          control={control}
                          name="posProvider"
                          render={({ field }) => (
                            <CreatableSelect
                              options={posProviderOptions}
                              value={field.value ? { value: field.value, label: field.value } : null}
                              onChange={(opt) => field.onChange(opt?.value || "")}
                              placeholder={t("onboarding.restaurant.form.posProviderPlaceholder")}
                              formatCreateLabel={(input) => `${t("onboarding.restaurant.form.posCreateOptionLabel")} "${input}"`}
                              isClearable
                              menuPortalTarget={document.body}
                              className="react-select-container"
                              classNamePrefix="react-select"
                            />
                          )}
                        />
                        {errors.posProvider && (
                          <p className="text-red-500 text-xs pl-1">{errors.posProvider.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2026-11-12: shared document box - thumbnail (click to enlarge) for an image,
                      clean name + View for a PDF, Change to replace. */}
                  <Controller
                    control={control}
                    name="fssaiCertificate"
                    render={({ field }) => (
                      <DocumentFileBox
                        value={field.value as File | string | undefined}
                        onChange={(file) => field.onChange(file)}
                        label={t("onboarding.restaurant.complete.setupForm.fssaiLicense")}
                        emptyText={t("onboarding.restaurant.complete.setupForm.uploadFssai")}
                        error={errors.fssaiCertificate?.message as string | undefined}
                      />
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {showManagerSection && (
              <AccordionItem
                value="management"
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden border-none"
              >
                <AccordionTrigger className="p-6 bg-gray-50/50 dark:bg-slate-800/50 hover:no-underline border-b border-gray-50 dark:border-slate-800 dark:text-white [&>svg]:w-5 [&>svg]:h-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {t(
                      "onboarding.restaurant.complete.setupForm.management.outletTitle",
                      "Outlet Manager Details",
                    )}
                  </h2>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="p-6 md:p-8 space-y-6">
                    <Controller
                      control={control}
                      name="isUserManaging"
                      render={({ field }) => (
                        <ManagerDetails
                          isUserManaging={field.value}
                          onToggleManaging={field.onChange}
                          managerDetails={{
                            userId: watch("managerId"),
                            name: watch("managerName"),
                            email: watch("managerEmail"),
                            mobile: watch("managerMobile"),
                            whatsapp: watch("managerWhatsapp"),
                          }}
                          managersList={managers as any}
                          onSelectManagerFromList={(mgr) => {
                            setValue("managerId", mgr.userId);
                            setValue("managerName", mgr.name);
                            setValue("managerEmail", mgr.email);
                            setValue("managerMobile", mgr.mobile);
                            setValue("managerWhatsapp", mgr.whatsapp);
                          }}
                          user={user || undefined}
                          onSaveManager={(mgmt) => {
                            setValue("managerId", mgmt.userId);
                            setValue("managerName", mgmt.name);
                            setValue("managerEmail", mgmt.email);
                            setValue("managerMobile", mgmt.mobile);
                            setValue("managerWhatsapp", mgmt.whatsapp);
                          }}
                          onRemoveManager={() => {
                            setValue("managerId", "");
                            setValue("managerName", "");
                            setValue("managerEmail", "");
                            setValue("managerMobile", "");
                            setValue("managerWhatsapp", "");
                          }}
                        />
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* 2026-11-12: order / COD limits (dashboard edit only, showLimits). */}
            {showLimits && (
              <AccordionItem
                value="limits"
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden border-none"
              >
                <AccordionTrigger className="p-6 bg-gray-50/50 dark:bg-slate-800/50 hover:no-underline border-b border-gray-50 dark:border-slate-800 [&>svg]:w-5 [&>svg]:h-5">
                  <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                    <IndianRupee className="w-5 h-5" />
                    {t("dashboard.outletInfo.limits.title")}
                  </h2>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="p-6 md:p-8 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("dashboard.outletInfo.limits.hint")}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(["minOrderValue", "maxOrderValue", "minCodValue", "maxCodValue"] as const).map((field) => (
                        <FloatingInput
                          key={field}
                          inputMode="numeric"
                          label={t(`dashboard.outletInfo.limits.${field}`)}
                          {...register(field)}
                          error={errors[field]?.message}
                        />
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* 3. Bank Details (hidden on the dashboard edit page - showBankSection) */}
            {showBankSection && (
              <AccordionItem
                value="bank"
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden border-none"
              >
                <AccordionTrigger className="p-6 bg-gray-50/50 dark:bg-slate-800/50 hover:no-underline border-b border-gray-50 dark:border-slate-800 dark:text-white [&>svg]:w-5 [&>svg]:h-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t("onboarding.restaurant.complete.setupForm.bank.title")}
                  </h2>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold uppercase tracking-wide">
                          {t(
                            "onboarding.restaurant.complete.setupForm.bank.subtitle",
                          )}
                        </Label>
                      </div>

                      <Controller
                        control={control}
                        name="bankAccountType"
                        render={({ field }) => (
                          <Tabs
                            value={field.value}
                            onValueChange={field.onChange}
                            className="w-full sm:w-auto"
                          >
                            <TabsList className="flex w-full sm:w-auto inline-flex bg-white p-1.5 rounded-2xl gap-1.5 h-12 border border-slate-200">
                              <TabsTrigger
                                value="BRAND"
                                className="flex-1 sm:flex-none px-8 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0F2441] data-[state=active]:shadow-sm font-bold text-base transition-all"
                              >
                                {t(
                                  "onboarding.restaurant.complete.setupForm.bank.sameAsBrand",
                                )}
                              </TabsTrigger>
                              <TabsTrigger
                                value="OTHER"
                                className="flex-1 sm:flex-none px-8 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-base transition-all"
                              >
                                {t(
                                  "onboarding.restaurant.complete.setupForm.bank.other",
                                )}
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        )}
                      />
                    </div>

                    {watch("bankAccountType") === "OTHER" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <FloatingInput
                          required
                          label={t(
                            "onboarding.restaurant.complete.setupForm.bank.accountNumber",
                          )}
                          {...register("bankDetails.accountNumber")}
                          error={errors.bankDetails?.accountNumber?.message}
                        />
                        <FloatingInput
                          required
                          label={t(
                            "onboarding.restaurant.complete.setupForm.bank.holderName",
                          )}
                          {...register("bankDetails.accountHolderName")}
                          error={errors.bankDetails?.accountHolderName?.message}
                        />
                        <FloatingInput
                          required
                          label={t(
                            "onboarding.restaurant.complete.setupForm.bank.bankName",
                          )}
                          {...register("bankDetails.bankName")}
                          error={errors.bankDetails?.bankName?.message}
                        />
                        <FloatingInput
                          required
                          label={t(
                            "onboarding.restaurant.complete.setupForm.bank.branch",
                          )}
                          {...register("bankDetails.bankBranch")}
                          error={errors.bankDetails?.bankBranch?.message}
                        />
                        <FloatingInput
                          required
                          label={t(
                            "onboarding.restaurant.complete.setupForm.bank.ifsc",
                          )}
                          {...register("bankDetails.ifscCode")}
                          error={errors.bankDetails?.ifscCode?.message}
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-slate-800 pb-10">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="font-semibold text-base hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {t("onboarding.restaurant.complete.setupForm.management.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-10 py-6 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t("onboarding.restaurant.complete.setupForm.saveContinue")}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
