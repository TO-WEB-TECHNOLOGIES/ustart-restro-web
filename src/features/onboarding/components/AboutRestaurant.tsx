import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ReactSelect from "react-select";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "../store/useOnboardingStore";
import {
  aboutRestaurantSchema,
  type AboutRestaurantValues,
  bankDetailsSchema,
  type BankDetailsValues,
} from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInfiniteQuery } from "@tanstack/react-query";

// Master Data API
import { masterDataService } from "../api/masterData";
import { onboardingService } from "../api/onboardingService";
import { toast } from "sonner";
import {
  Info,
  BookOpen,
  Image as ImageIcon,
  CloudUpload,
  CheckCircle2,
  User,
  Store,
  MapPin,
} from "lucide-react";
import type {
  OnboardingData,
  RestaurantInfo,
  AboutRestaurant as OnboardingAboutRestaurant,
  OnboardingDocuments,
} from "@/types/onboardingTypes";
import { getErrorMessage } from "@/utils/error";
import { MenuList } from "./common/MenuList";
import { FileDisplay } from "./common/FileDisplay";
import { FoodTypeButton } from "./common/FoodTypeSelector";

export const AboutRestaurant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    aboutRestaurant,
    setAboutRestaurant,
    setCurrentStep,
    documents,
    setDocuments,
    personalInfo,
    restaurantInfo,
    reset,
    isEditing,
    initialData,
  } = useOnboardingStore();
  const [view, setView] = useState<"details" | "documents">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressText, setProgressText] = useState("");

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

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AboutRestaurantValues>({
    resolver: zodResolver(aboutRestaurantSchema),
    defaultValues: aboutRestaurant as any,
    mode: "onSubmit",
  });

  // --- VIEW 2: DOCUMENTS (FSSAI, Bank) ---
  const {
    register: registerDocs,
    handleSubmit: handleSubmitDocs,
    watch: watchDocs,
    setValue: setValueDocs,
    formState: { errors: errorsDocs },
  } = useForm<BankDetailsValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: documents as any,
    mode: "onChange",
  });

  const fssaiInputRef = useRef<HTMLInputElement>(null);
  const fssaiDocument = watchDocs("fssaiDocument");

  const handleFssaiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValueDocs("fssaiDocument", e.target.files[0], {
        shouldValidate: true,
      });
    }
  };

  const onSubmitDetails = (data: AboutRestaurantValues) => {
    setAboutRestaurant(data);
    setView("documents");
    window.scrollTo(0, 0);
  };

  const onSubmitDocuments = async (data: BankDetailsValues) => {
    setIsSubmitting(true);
    setProgressText(t("Submitting details..."));
    try {
      setDocuments(data);

      // Helper to get filename or preserve string (if it's already a filename from prev session)
      const getFileName = (file: any) => {
        if (file instanceof File) return file.name;
        if (typeof file === "string") return file.split("/").pop() || "";
        return "";
      };

      // 1. Prepare Payload for Submission (Full version)
      const fullPayload: OnboardingData = {
        personalInfo: {
          ...personalInfo,
          designation:
            personalInfo.designation?.split(" / ")[0] ||
            personalInfo.designation,
        },
        restaurantInfo: (() => {
          const base = {
            hasCin: restaurantInfo.hasCin,
            panNumber: restaurantInfo.panNumber,
            gstNumber: restaurantInfo.gstNumber?.trim() || null,
            registeredAddress: restaurantInfo.registeredAddress,
          };
          if (restaurantInfo.hasCin) {
            return {
              ...base,
              companyName: restaurantInfo.companyName,
              brandName: restaurantInfo.brandName,
              hasMultipleBranches: restaurantInfo.hasMultipleBranches,
              cinNumber: restaurantInfo.cinNumber,
            };
          } else {
            return {
              ...base,
              restaurantName: restaurantInfo.restaurantName,
              restaurantAddress: restaurantInfo.restaurantAddress,
              location: restaurantInfo.location,
              googleMapsLink: restaurantInfo.googleMapsLink,
            };
          }
        })() as RestaurantInfo,
        aboutRestaurant: {
          ...aboutRestaurant,
          menuImages: aboutRestaurant.menuImages?.map(getFileName) || [],
          dishImage: getFileName(aboutRestaurant.dishImage),
          cuisines: aboutRestaurant.cuisines || [],
        } as unknown as OnboardingAboutRestaurant,
        documents: {
          ...data,
          fssaiDocument: getFileName(data.fssaiDocument),
        } as OnboardingDocuments,
      };

      // 2. Differencing logic for Partial Updates
      const getChangedFields = (current: any, original: any) => {
        if (!original) return current;
        const changes: any = {};

        // Normalize helper for comparison
        const normalize = (v: any) => {
          if (v === "" || v === undefined || v === null) return null;
          if (typeof v === "string") return v.split("/").pop();
          return v;
        };

        Object.keys(current).forEach((key) => {
          const val = current[key];
          const origVal = original[key];

          if (Array.isArray(val)) {
            // For arrays (cuisines, menuImages), compare normalized versions
            const normVal = val.map(normalize);
            const normOrig = Array.isArray(origVal)
              ? origVal.map(normalize)
              : [];
            if (JSON.stringify(normVal) !== JSON.stringify(normOrig)) {
              changes[key] = val;
            }
          } else if (val && typeof val === "object" && !(val instanceof File)) {
            // Deep compare for objects (foodTypes, personalInfo, etc.)
            const nestedChanges = getChangedFields(val, origVal || {});
            if (Object.keys(nestedChanges).length > 0) {
              changes[key] = nestedChanges;
            }
          } else {
            // Single values
            if (normalize(val) !== normalize(origVal)) {
              changes[key] = val;
            }
          }
        });
        return changes;
      };

      const submitPayload = isEditing
        ? getChangedFields(fullPayload, initialData)
        : fullPayload;

      // Log changes for debugging
      if (isEditing) {
        console.log("Full Constructed Payload:", fullPayload);
        console.log("Initial Data for Comparison:", initialData);
        console.log("Calculated Partial Update Payload:", submitPayload);
        if (Object.keys(submitPayload).length === 0) {
          toast.info(t("No changes detected"));
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Submit Data (Get Presigned URLs)
      let presignedUrls;
      if (isEditing) {
        presignedUrls = await onboardingService.updateOnboarding(submitPayload);
      } else {
        presignedUrls =
          await onboardingService.initiateOnboarding(submitPayload);
      }

      // 3. Upload Files (Step 2)
      setProgressText(t("Uploading documents..."));

      const uploadPromises: Promise<void>[] = [];
      let hasFilesToUpload = false;

      // Helper to match file key and upload
      const queueUpload = (
        url: string | undefined,
        file: File | string | undefined,
      ) => {
        if (url && file instanceof File) {
          uploadPromises.push(onboardingService.uploadFile(url, file));
          hasFilesToUpload = true;
        }
      };

      // FSSAI
      queueUpload(presignedUrls.fssaiDocument, data.fssaiDocument);

      // Dish/Brand Image
      queueUpload(presignedUrls.dishImage, aboutRestaurant.dishImage);

      // Menu Images - Backend returns an array of URLs matching the order of menuImages in payload
      if (
        aboutRestaurant.menuImages &&
        Array.isArray(aboutRestaurant.menuImages) &&
        presignedUrls.menuImages
      ) {
        aboutRestaurant.menuImages.forEach((file, index) => {
          queueUpload(presignedUrls.menuImages[index], file);
        });
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      // 4. Finalize
      setProgressText(t("Finalizing..."));
      if (isEditing) {
        // For updates, if files were uploaded, we MUST confirm.
        // If no files were uploaded, the PUT request alone is enough as per guide.
        if (hasFilesToUpload) {
          await onboardingService.confirmUpload();
        }
        toast.success(t("Profile updated successfully"));
      } else {
        // For fresh onboarding, we always call completeOnboarding
        const response = await onboardingService.completeOnboarding();
        // Success - Login with new tokens
        login(response.accessToken, response.refreshToken);
      }

      // 5. Success
      reset();
      setCurrentStep(4);
      navigate("/grow-with-ustart/verification");
    } catch (error: any) {
      console.error("Submission failed", error);
      const message = getErrorMessage(
        error,
        "Failed to submit onboarding data. Please try again.",
      );
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setProgressText("");
    }
  };

  const menuInputRef = useRef<HTMLInputElement>(null);
  const dishInputRef = useRef<HTMLInputElement>(null);

  const menuImages = watch("menuImages");
  const dishImage = watch("dishImage");

  const handleMenuFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const currentFiles = (watch("menuImages") as File[]) || [];
      setValue("menuImages", [...currentFiles, ...newFiles], {
        shouldValidate: true,
      });
    }
  };

  const handleDishFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue("dishImage", e.target.files[0], { shouldValidate: true });
    }
  };

  const removeMenuFile = (index: number) => {
    const currentFiles = (watch("menuImages") as File[]) || [];
    const updated = currentFiles.filter((_, i) => i !== index);
    setValue("menuImages", updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
          {view === "details"
            ? t("onboarding.restaurant.about.title")
            : t("onboarding.restaurant.documents.title")}
        </h2>
        <p className="md:text-2xl text-slate-500 mt-2">
          {view === "details"
            ? t("onboarding.restaurant.about.subtitle")
            : t("onboarding.restaurant.documents.subtitle")}
        </p>
      </div>

      <div className="py-8 flex-grow overflow-y-auto px-1">
        {view === "details" ? (
          <form
            id="about-restaurant-form"
            onSubmit={handleSubmit(onSubmitDetails)}
            className="space-y-8"
          >
            {/* Food Type */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">
                {t("onboarding.restaurant.about.foodTypeLabel")}
              </Label>
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
              {errors.foodTypes?.root && (
                <p className="text-red-500 text-xs">
                  {errors.foodTypes.root.message}
                </p>
              )}
            </div>

            {/* Cuisine Type - ReactSelect with Infinite Scroll & Search */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">
                {t("onboarding.restaurant.about.cuisineLabel")}
              </Label>

              <Controller
                control={control}
                name="cuisines"
                render={({ field }) => {
                  const selectedValues = useMemo(() => {
                    const ids = field.value || [];
                    return ids.map((id: number) => {
                      const opt = cuisineOptions.find((o) => o.value === id);
                      return (
                        opt || { value: id, label: `Selected (ID: ${id})` }
                      );
                    });
                  }, [cuisineOptions, field.value]);

                  return (
                    <ReactSelect
                      isMulti
                      isLoading={isLoadingCuisines}
                      options={cuisineOptions}
                      value={selectedValues}
                      components={{ MenuList }}
                      // Pass states to MenuList via selectProps
                      {...({
                        hasNextPage,
                        isFetchingNextPage,
                        fetchNextPage,
                        t,
                      } as any)}
                      inputValue={searchQuery}
                      onInputChange={(newValue, { action }) => {
                        if (action === "input-change") setSearchQuery(newValue);
                      }}
                      onChange={(newValue: any) => {
                        field.onChange(
                          newValue ? newValue.map((v: any) => v.value) : [],
                        );
                        setSearchQuery(""); // Clear search after selection
                      }}
                      closeMenuOnSelect={false}
                      placeholder={t(
                        "onboarding.restaurant.about.cuisinePlaceholder",
                      )}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      filterOption={() => true}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: "0.75rem",
                          borderColor: state.isFocused ? "#f97316" : "#e2e8f0",
                          boxShadow: state.isFocused
                            ? "0 0 0 1px #f97316"
                            : "none",
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
              {errors.cuisines && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.cuisines.message}
                </p>
              )}
            </div>

            {/* Upload Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Menu */}
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">
                  {t("onboarding.restaurant.about.menuLabel")}
                </Label>
                <div
                  onClick={() => menuInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px] ${errors.menuImages ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                >
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={menuInputRef}
                    accept="image/*"
                    onChange={handleMenuFiles}
                  />
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-secondary-orange">
                    {t("onboarding.restaurant.about.menuUploadText")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t("onboarding.restaurant.about.menuUploadSubtext")}
                  </p>
                </div>
                {menuImages &&
                  Array.isArray(menuImages) &&
                  menuImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {menuImages.map((file: any, idx: number) => (
                        <FileDisplay
                          key={idx}
                          file={file}
                          onRemove={() => removeMenuFile(idx)}
                        />
                      ))}
                    </div>
                  )}
                {errors.menuImages && (
                  <p className="text-red-500 text-xs">
                    {errors.menuImages.message as string}
                  </p>
                )}
              </div>

              {/* Dish Image */}
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">
                  {restaurantInfo?.hasCin
                    ? t("onboarding.restaurant.about.brandLogoLabel")
                    : t("onboarding.restaurant.about.dishLabel")}
                </Label>
                <div
                  onClick={() => dishInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[160px] ${errors.dishImage ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={dishInputRef}
                    accept="image/*"
                    onChange={handleDishFile}
                  />
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  {dishImage ? (
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-green-600 mb-1">
                        {t("onboarding.restaurant.about.imageSelected")}
                      </p>
                      <FileDisplay file={dishImage} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setValue("dishImage", undefined as any);
                        }}
                        className="text-xs text-red-500 mt-2 hover:underline font-medium"
                      >
                        {t("onboarding.restaurant.about.changeImage")}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-secondary-orange">
                        {restaurantInfo?.hasCin
                          ? t("onboarding.restaurant.about.brandLogoUploadText")
                          : t("onboarding.restaurant.about.dishUploadText")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {restaurantInfo?.hasCin
                          ? t(
                              "onboarding.restaurant.about.brandLogoUploadSubtext",
                            )
                          : t("onboarding.restaurant.about.dishUploadSubtext")}
                      </p>
                    </>
                  )}
                </div>
                {errors.dishImage && (
                  <p className="text-red-500 text-xs">
                    {errors.dishImage.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-700 mb-1">
                  {t("onboarding.restaurant.about.imageSpecTitle")}
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  {restaurantInfo?.hasCin
                    ? t("onboarding.restaurant.about.brandLogoSpecText")
                    : t("onboarding.restaurant.about.imageSpecText")}
                </p>
              </div>
            </div>
          </form>
        ) : (
          <form
            id="documents-form"
            onSubmit={handleSubmitDocs(onSubmitDocuments)}
            className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300"
          >
            {/* FSSAI Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-slate-800">
                  {t("onboarding.restaurant.documents.fssaiLabel")}
                </Label>
                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-medium">
                  {t("onboarding.restaurant.documents.mandatory")}
                </span>
              </div>

              <div
                onClick={() => fssaiInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer min-h-[180px] ${errorsDocs.fssaiDocument ? "border-red-300 bg-red-50" : "border-slate-200"}`}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fssaiInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFssaiFile}
                />
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-secondary-orange shadow-sm">
                  <CloudUpload className="w-6 h-6" />
                </div>
                {fssaiDocument ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />{" "}
                      {t("onboarding.restaurant.documents.received")}
                    </p>
                    <FileDisplay file={fssaiDocument} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setValueDocs("fssaiDocument", undefined as any);
                      }}
                      className="text-xs text-red-500 mt-2 hover:underline font-medium"
                    >
                      {t("onboarding.restaurant.documents.changeFile")}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-secondary-orange">
                      {t("onboarding.restaurant.documents.fssaiUploadText")}
                    </p>
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-3 py-1 rounded-full mt-3 font-medium">
                      {t("onboarding.restaurant.documents.fssaiUploadSubtext")}
                    </span>
                  </>
                )}
              </div>
              {errorsDocs.fssaiDocument && (
                <p className="text-red-500 text-xs">
                  {errorsDocs.fssaiDocument.message}
                </p>
              )}
            </div>

            {/* Account Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-secondary-orange pl-3">
                <h3 className="font-bold text-lg text-slate-800">
                  {t("onboarding.restaurant.documents.accountDetailsTitle")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="accountNumber"
                    className="font-semibold text-slate-700"
                  >
                    {t("onboarding.restaurant.documents.accountNumberLabel")}
                  </Label>
                  <Input
                    id="accountNumber"
                    {...registerDocs("accountNumber")}
                    className="h-12 bg-background-white border-slate-200"
                    placeholder={t(
                      "onboarding.restaurant.documents.accountNumberPlaceholder",
                    )}
                  />
                  {errorsDocs.accountNumber && (
                    <p className="text-red-500 text-xs">
                      {errorsDocs.accountNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ifscCode"
                    className="font-semibold text-slate-700"
                  >
                    {t("onboarding.restaurant.documents.ifscLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="ifscCode"
                      {...registerDocs("ifscCode")}
                      className="h-12 bg-background-white border-slate-200 uppercase"
                      placeholder={t(
                        "onboarding.restaurant.documents.ifscPlaceholder",
                      )}
                    />
                  </div>
                  {errorsDocs.ifscCode && (
                    <p className="text-red-500 text-xs">
                      {errorsDocs.ifscCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="accountHolderName"
                    className="font-semibold text-slate-700"
                  >
                    {t("onboarding.restaurant.documents.holderNameLabel")}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <Input
                      id="accountHolderName"
                      {...registerDocs("accountHolderName")}
                      className="h-12 pl-10 bg-background-white border-slate-100"
                      placeholder={t(
                        "onboarding.restaurant.documents.holderNamePlaceholder",
                      )}
                    />
                  </div>
                  {errorsDocs.accountHolderName && (
                    <p className="text-red-500 text-xs">
                      {errorsDocs.accountHolderName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="bankName"
                    className="font-semibold text-slate-700"
                  >
                    {t("onboarding.restaurant.documents.bankNameLabel")}
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <Input
                      id="bankName"
                      {...registerDocs("bankName")}
                      className="h-12 pl-10 bg-background-white border-slate-100"
                      placeholder={t(
                        "onboarding.restaurant.documents.bankNamePlaceholder",
                      )}
                    />
                  </div>
                  {errorsDocs.bankName && (
                    <p className="text-red-500 text-xs">
                      {errorsDocs.bankName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="branchName"
                    className="font-semibold text-slate-700"
                  >
                    {t("onboarding.restaurant.documents.branchNameLabel")}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <Input
                      id="branchName"
                      {...registerDocs("branchName")}
                      className="h-12 pl-10 bg-background-white border-slate-100"
                      placeholder={t(
                        "onboarding.restaurant.documents.branchNamePlaceholder",
                      )}
                    />
                  </div>
                  {errorsDocs.branchName && (
                    <p className="text-red-500 text-xs">
                      {errorsDocs.branchName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {view === "details" ? (
        <div className="space-y-3">
          <Button
            type="submit"
            form="about-restaurant-form"
            className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all"
          >
            {t("Continue")} →
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setCurrentStep(2);
              navigate("/grow-with-ustart/restaurant-info");
            }}
            className="w-full text-slate-500 hover:text-slate-700"
          >
            ← {t("onboarding.restaurant.form.goBack")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            type="submit"
            form="documents-form"
            disabled={isSubmitting}
            className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-background-white/30 border-t-background-white rounded-full animate-spin" />
                {progressText || t("Processing...")}
              </>
            ) : (
              <>
                {isEditing
                  ? t("onboarding.restaurant.documents.updateButton")
                  : t("onboarding.restaurant.documents.verifyButton")}
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setView("details")}
            className="w-full text-slate-500 hover:text-slate-700"
          >
            ← {t("onboarding.restaurant.documents.backToDetails")}
          </Button>
        </div>
      )}
    </div>
  );
};
