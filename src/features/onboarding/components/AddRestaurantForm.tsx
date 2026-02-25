import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  type AddRestaurantValues,
  addRestaurantSchema,
} from "../validations/outletSchema";
import { useOutletStore } from "../store/useOutletStore";
import { MenuList } from "./common/MenuList";
import { FoodTypeButton } from "./common/FoodTypeSelector";
import { LocationPicker } from "./common/LocationPicker";
import { ManagerDetails } from "./common/ManagerDetails";
import ReactSelect from "react-select";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowRight,
  Utensils,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  CreditCard,
  PencilLine,
  Plus,
  User,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Restaurant } from "@/types/restaurantTypes";
import { masterDataService } from "../api/masterData";
import { restaurantService } from "@/api/restaurantService";
import { multimediaService } from "@/api/multimediaService";
import { useOnboardingStore } from "../store/useOnboardingStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Helper Components ---

const FloatingInput = ({ label, error, placeholder, ...props }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold uppercase tracking-widest pl-1">
      {label}
    </Label>
    <input
      className="block px-3 py-2.5 w-full text-base text-gray-900 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FF9F43] focus:border-[#FF9F43] transition-all"
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
}

const STORAGE_KEY = "add_restaurant_form_data";

export const AddRestaurantForm = ({
  onCancel,
  onSuccess,
  isEditMode = false,
  initialData = null,
  onDirtyStateChange,
}: AddRestaurantFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setIsMultipleRestro } = useAuth();
  const {
    isSaving,
    setIsSaving,
    primaryPreview,
    setPrimaryPreview,
    menuPreviews,
    setMenuPreviews,
  } = useOutletStore();
  const { associatedUsers } = useOnboardingStore();

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);
  const fssaiInputRef = useRef<HTMLInputElement>(null);

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
      googleMapsLink: initialData.googleMapLink || "",
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

      isUserManaging: initialData.isAssociated ?? true,
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
      fssaiLicenseNumber: "", // Not returned by normal API
      panNumber: initialData.panNumber || "",
      gstNumber: initialData.gstNumber || "",
      fssaiCertificate: initialData.fssaiLicenseImage,
      primaryImage: initialData.primaryImage,
      menuImages: initialData.deliveryMenuImages || [],
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
          googleMapsLink: "",
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
      const { primaryImage, menuImages, fssaiCertificate, ...rest } = value;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    });
    return () => subscription.unsubscribe();
  }, [watch, isEditMode]);

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Primary image size must be less than 1MB");
        return;
      }
      setPrimaryPreview(URL.createObjectURL(file));
      setValue("primaryImage", file);
    }
  };

  const handleMenuImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setMenuPreviews((prev) => [...prev, ...newPreviews]);
      const currentImages = watch("menuImages") || [];
      setValue("menuImages", [...currentImages, ...validFiles]);
    }
  };

  const removeMenuImage = (index: number) => {
    setMenuPreviews((prev) => {
      const url = prev[index];
      URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    const currentImages = watch("menuImages") || [];
    setValue(
      "menuImages",
      currentImages.filter((_: any, i: number) => i !== index),
    );
  };

  const handleFssaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setValue("fssaiCertificate", file);
    }
  };

  const onSubmit = async (data: AddRestaurantValues) => {
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
        cuisineIds: data.cuisines,
        primaryImage: primaryImageKey,
        deliveryMenuImages: menuImageKeys,
        isUserManaging: data.isUserManaging,
        managerId: !data.isUserManaging ? data.managerId : undefined,
        managerName: !data.isUserManaging ? data.managerName : undefined,
        managerMobile: !data.isUserManaging ? data.managerMobile : undefined,
        managerEmail: !data.isUserManaging ? data.managerEmail : undefined,
        managerWhatsapp: !data.isUserManaging
          ? data.managerWhatsapp
          : undefined,
        bankAccountType: data.bankAccountType,
        bankDetails:
          data.bankAccountType === "OTHER"
            ? {
                bankAccountNumber: data.bankDetails?.accountNumber || "",
                ifscCode: data.bankDetails?.ifscCode || "",
                accountHolderName: data.bankDetails?.accountHolderName || "",
                bankName: data.bankDetails?.bankName || "",
                branchName: data.bankDetails?.bankBranch || "",
              }
            : undefined,
        gstNumber: data.gstNumber,
        googleMapLink: data.googleMapsLink,
        fssaiLicenseImage: fssaiKey,
        panNumber: data.panNumber,
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
      };

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
      setIsMultipleRestro(true);
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
    <div className="flex-1 flex flex-col relative h-full bg-[#f6f8f7] animate-in slide-in-from-right duration-300">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 scroll-smooth">
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
            // Optionally scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
              const element = document.getElementsByName(firstErrorField)[0];
              element?.scrollIntoView({ behavior: "smooth", block: "center" });
              element?.focus();
            }
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
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-none"
            >
              <AccordionTrigger className="p-6 bg-gray-50/50 hover:no-underline border-b border-gray-50 [&>svg]:w-5 [&>svg]:h-5">
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
                            label={t(
                              "onboarding.restaurant.form.addressLabels.line1",
                            )}
                            {...register("restaurantAddress.line1")}
                            error={errors.restaurantAddress?.line1?.message}
                          />
                          <FloatingInput
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
                              )}
                            </Label>
                            <Controller
                              name="restaurantAddress.locality"
                              control={control}
                              render={({ field }) => (
                                <ReactSelect
                                  options={[
                                    { value: "Gurugram", label: "Gurugram" },
                                  ]}
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
                              )}
                            </Label>
                            <Controller
                              name="restaurantAddress.state"
                              control={control}
                              render={({ field }) => (
                                <ReactSelect
                                  options={[
                                    { value: "Haryana", label: "Haryana" },
                                  ]}
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
                        googleMapsLink={watch("googleMapsLink")}
                        onGoogleMapsLinkChange={(val) =>
                          setValue("googleMapsLink", val)
                        }
                        googleMapsLinkError={errors.googleMapsLink?.message}
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
                            )}
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
                        {t("onboarding.restaurant.about.foodTypeLabel")}
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
                      <Label className="text-base font-semibold uppercase tracking-wide">
                        {t("onboarding.restaurant.about.cuisineLabel")}
                      </Label>
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
                      {errors.cuisines && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.cuisines.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <h3 className="text-base font-semibold uppercase tracking-wide mb-3">
                        {t(
                          "onboarding.restaurant.complete.setupForm.primaryImage",
                        )}
                      </h3>
                      <input
                        type="file"
                        ref={primaryInputRef}
                        onChange={handlePrimaryImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div
                        onClick={() => primaryInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-[#FF9F43] transition-all cursor-pointer h-40 overflow-hidden relative"
                      >
                        {primaryPreview ? (
                          <>
                            <img
                              src={primaryPreview}
                              alt="Primary Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PencilLine className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-base font-medium">
                              {t(
                                "onboarding.restaurant.complete.setupForm.uploadPhoto",
                              )}
                            </span>
                            <span className="text-xs mt-1">
                              {t(
                                "onboarding.restaurant.complete.setupForm.imgSpecs",
                                "Max 1MB, JPG/PNG",
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold  uppercase tracking-wide mb-3">
                        {t(
                          "onboarding.restaurant.complete.setupForm.deliveryMenu",
                        )}
                      </h3>
                      <input
                        type="file"
                        ref={menuInputRef}
                        onChange={handleMenuImagesChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <div className="flex gap-3 h-40 overflow-x-auto pb-1 custom-scrollbar pr-2">
                        {menuPreviews.map((url, index) => (
                          <div
                            key={index}
                            className="h-full aspect-[3/4] border border-gray-200 rounded-xl relative group overflow-hidden bg-gray-100 flex-shrink-0"
                          >
                            <img
                              src={url}
                              alt={`Menu ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMenuImage(index);
                                }}
                                className="text-white hover:text-red-400"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div
                          onClick={() => menuInputRef.current?.click()}
                          className={`border-2 border-dashed border-gray-300 rounded-xl p-2 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-[#FF9F43] transition-all cursor-pointer flex-shrink-0 ${menuPreviews.length > 0 ? "aspect-[3/4] h-full" : "w-full h-full"}`}
                        >
                          <Plus
                            className={`${menuPreviews.length > 0 ? "w-6 h-6" : "w-8 h-8"} mb-2`}
                          />
                          <span
                            className={`${menuPreviews.length > 0 ? "text-xs" : "text-base"} font-medium text-center px-2`}
                          >
                            {t(
                              "onboarding.restaurant.complete.setupForm.addPage",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Government Details */}
            <AccordionItem
              value="government"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-none"
            >
              <AccordionTrigger className="p-6 bg-gray-50/50 hover:no-underline border-b border-gray-50 [&>svg]:w-5 [&>svg]:h-5">
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
                    <FloatingInput
                      label={t(
                        "onboarding.restaurant.complete.setupForm.panNumber",
                      )}
                      {...register("panNumber")}
                      error={errors.panNumber?.message}
                    />
                    <FloatingInput
                      label={t(
                        "onboarding.restaurant.complete.setupForm.gstNumber",
                      )}
                      {...register("gstNumber")}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide mb-3">
                      {t(
                        "onboarding.restaurant.complete.setupForm.fssaiLicense",
                      )}
                    </h3>
                    <input
                      type="file"
                      ref={fssaiInputRef}
                      onChange={handleFssaiChange}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    {watch("fssaiCertificate") ? (
                      <div className="flex items-center justify-between p-4 border border-green-200 rounded-xl bg-green-50/50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 ">
                            {(() => {
                              const cert = watch("fssaiCertificate");
                              return cert instanceof File &&
                                cert.type === "application/pdf" ? (
                                <FileText className="w-6 h-6" />
                              ) : (
                                <ImageIcon className="w-6 h-6" />
                              );
                            })()}
                          </div>
                          <div>
                            <p className="text-base font-medium truncate max-w-[200px]">
                              {(() => {
                                const cert = watch("fssaiCertificate");
                                return cert instanceof File
                                  ? cert.name
                                  : typeof cert === "string"
                                    ? cert.split("/").pop()
                                    : "";
                              })()}
                            </p>
                            <p className="text-xs">
                              {(() => {
                                const cert = watch("fssaiCertificate");
                                return cert instanceof File
                                  ? `${(cert.size / (1024 * 1024)).toFixed(2)} MB`
                                  : "";
                              })()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fssaiInputRef.current?.click()}
                          className="text-base font-medium"
                        >
                          {t("onboarding.restaurant.complete.setupForm.change")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fssaiInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-[#FF9F43] transition-all group"
                      >
                        <Upload className="w-5 h-5 group-hover:text-[#FF9F43] transition-colors" />
                        <span className="text-base font-medium">
                          {t(
                            "onboarding.restaurant.complete.setupForm.uploadFssai",
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="management"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-none"
            >
              <AccordionTrigger className="p-6 bg-gray-50/50 hover:no-underline border-b border-gray-50 [&>svg]:w-5 [&>svg]:h-5">
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

            {/* 3. Bank Details */}
            <AccordionItem
              value="bank"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-none"
            >
              <AccordionTrigger className="p-6 bg-gray-50/50 hover:no-underline border-b border-gray-50 [&>svg]:w-5 [&>svg]:h-5">
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
                        label={t(
                          "onboarding.restaurant.complete.setupForm.bank.accountNumber",
                        )}
                        {...register("bankDetails.accountNumber")}
                        error={errors.bankDetails?.accountNumber?.message}
                      />
                      <FloatingInput
                        label={t(
                          "onboarding.restaurant.complete.setupForm.bank.holderName",
                        )}
                        {...register("bankDetails.accountHolderName")}
                        error={errors.bankDetails?.accountHolderName?.message}
                      />
                      <FloatingInput
                        label={t(
                          "onboarding.restaurant.complete.setupForm.bank.bankName",
                        )}
                        {...register("bankDetails.bankName")}
                        error={errors.bankDetails?.bankName?.message}
                      />
                      <FloatingInput
                        label={t(
                          "onboarding.restaurant.complete.setupForm.bank.branch",
                        )}
                        {...register("bankDetails.bankBranch")}
                        error={errors.bankDetails?.bankBranch?.message}
                      />
                      <FloatingInput
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
          </Accordion>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-gray-100 pb-10">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="font-semibold text-base hover:bg-gray-100 transition-colors"
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
