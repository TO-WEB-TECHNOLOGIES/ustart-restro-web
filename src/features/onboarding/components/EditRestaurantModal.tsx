import React, { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  X,
  Upload,
  PencilLine,
  Check,
  Loader2,
  Utensils,
  Store,
  CreditCard,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactSelect from "react-select";
import { useInfiniteQuery } from "@tanstack/react-query";

import { restaurantService } from "@/api/restaurantService";
import { masterDataService } from "../api/masterData";
import { multimediaService } from "@/api/multimediaService";
import { type Restaurant } from "@/types/restaurantTypes";
import {
  addRestaurantSchema,
  type AddRestaurantValues,
} from "../validations/outletSchema";

import { MenuList } from "./common/MenuList";
import { FoodTypeButton } from "./common/FoodTypeSelector";
import { LocationPicker } from "./common/LocationPicker";

interface EditRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRestro: any) => void;
  restaurantData: Restaurant | any;
}

const FloatingInput = ({ label, error, placeholder, ...props }: any) => (
  <div className="space-y-1.5 w-full">
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

export const EditRestaurantModal = ({
  isOpen,
  onClose,
  onSuccess,
  restaurantData,
}: EditRestaurantModalProps) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const menuInputRef = useRef<HTMLInputElement>(null);
  const fssaiInputRef = useRef<HTMLInputElement>(null);

  // Previews for images
  const [primaryPreview, setPrimaryPreview] = useState<string>(
    restaurantData?.primaryImage || "",
  );
  const [menuPreviews, setMenuPreviews] = useState<string[]>(
    restaurantData?.deliveryMenuImages || [],
  );

  const [isEditingBank, setIsEditingBank] = useState(false);

  // Infinite Scroll for Cuisines (mirrored from AddRestaurantForm)
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
    queryKey: ["cuisines-edit", debouncedSearch],
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
    enabled: isOpen,
  });

  const cuisineOptions = useMemo(() => {
    const allCuisines =
      cuisineData?.pages.flatMap((page) => page.content) || [];
    return allCuisines.map((c) => ({
      value: c.cuisineId,
      label: c.cuisineName,
    }));
  }, [cuisineData]);

  // Transform initialData into form values
  const initialValues = useMemo(() => {
    if (!restaurantData) return null;

    const parts = (restaurantData.address || "").split("|");
    const restaurantAddress = {
      line1: parts[0] || "",
      line2: parts[1] || "",
      landmark: parts[2] || "",
      locality: parts[3] || "",
      state: parts[4] || "",
      pincode: parts[5] || "",
    };

    return {
      restaurantName: restaurantData.restroName || "",
      restaurantAddress,
      location: restaurantData.coordinates || "",
      googleMapsLink: restaurantData.googleMapLink || "",
      hasOwnDeliveryPartners: restaurantData.doHaveDeliveryPartners ?? false,
      deliveryBy: (restaurantData.isDeliveryViaUSTART
        ? "USTART"
        : "Restaurant") as "USTART" | "Restaurant",
      servingOptions: (restaurantData.servingOptions === "BOTH"
        ? ["DELIVERY", "DINE_IN"]
        : restaurantData.servingOptions
          ? [restaurantData.servingOptions]
          : ["DELIVERY"]) as ("DELIVERY" | "DINE_IN")[],
      foodTypes: {
        isVegAvailable: restaurantData.isVegAvailable ?? true,
        isNonVegAvailable: restaurantData.isNonVegAvailable ?? false,
        isEggAvailable: restaurantData.isEggAvailable ?? false,
      },
      cuisines: restaurantData.cuisineIds || [],
      isUserManaging: restaurantData.isAssociated ?? true,
      bankAccountType: restaurantData.bankAccountType || "BRAND",
      bankDetails: {
        accountNumber: "",
        accountHolderName: restaurantData.accountHolderName || "",
        bankName: restaurantData.bankName || "",
        bankBranch: restaurantData.branchName || "",
        ifscCode: restaurantData.ifscCode || "",
      },
      panNumber: restaurantData.panNumber || "",
      gstNumber: restaurantData.gstNumber || "",
      fssaiCertificate: restaurantData.fssaiLicenseImage || "",
      primaryImage: restaurantData.primaryImage || "",
      menuImages: (restaurantData.deliveryMenuImages || []) as (
        | string
        | File
      )[],
    };
  }, [restaurantData]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty, dirtyFields },
    setValue,
    reset,
  } = useForm<AddRestaurantValues>({
    resolver: zodResolver(addRestaurantSchema),
    mode: "onChange",
    defaultValues: (initialValues as AddRestaurantValues) || {
      restaurantName: "",
      restaurantAddress: {
        line1: "",
        line2: "",
        locality: "",
        state: "",
        pincode: "",
      },
      location: "",
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
      bankAccountType: "BRAND",
      primaryImage: "",
      fssaiCertificate: "",
      panNumber: "",
    },
  });

  // Sync form values when restaurantData or isOpen changes
  useEffect(() => {
    if (isOpen && initialValues) {
      reset(initialValues);
      setPrimaryPreview(restaurantData.primaryImage || "");
      setMenuPreviews(restaurantData.deliveryMenuImages || []);
      setIsEditingBank(false);
    }
  }, [isOpen, initialValues, reset, restaurantData]);

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Primary image size must be less than 1MB");
        return;
      }
      setPrimaryPreview(URL.createObjectURL(file));
      setValue("primaryImage", file, { shouldDirty: true });
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
      setValue("menuImages", [...currentImages, ...validFiles] as any, {
        shouldDirty: true,
      });
    }
  };

  const removeMenuImage = (index: number) => {
    const previewToRevoke = menuPreviews[index];
    if (previewToRevoke.startsWith("blob:")) {
      URL.revokeObjectURL(previewToRevoke);
    }

    setMenuPreviews((prev) => prev.filter((_, i) => i !== index));
    const currentImages = watch("menuImages") || [];
    setValue(
      "menuImages",
      currentImages.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const handleFssaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setValue("fssaiCertificate", file, { shouldDirty: true });
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowDiscardWarning(true);
    } else {
      onClose();
    }
  };

  const onSubmit = async (data: AddRestaurantValues) => {
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {};

      // Restaurant name
      if (dirtyFields.restaurantName) {
        payload.restroName = data.restaurantName;
      }

      // Address (any sub-field dirty means we send the full address)
      if (dirtyFields.restaurantAddress) {
        payload.address = [
          data.restaurantAddress.line1,
          data.restaurantAddress.line2,
          data.restaurantAddress.landmark || "",
          data.restaurantAddress.locality,
          data.restaurantAddress.state,
          data.restaurantAddress.pincode,
        ].join("|");
      }

      // Coordinates
      if (dirtyFields.location) {
        payload.coordinates = data.location;
      }

      // Google Maps link
      if (dirtyFields.googleMapsLink) {
        payload.googleMapLink = data.googleMapsLink;
      }

      // Delivery settings
      if (dirtyFields.deliveryBy) {
        payload.isDeliveryViaUSTART = data.deliveryBy === "USTART";
      }
      if (dirtyFields.hasOwnDeliveryPartners) {
        payload.doHaveDeliveryPartners = data.hasOwnDeliveryPartners;
      }

      // Food types
      if (dirtyFields.foodTypes) {
        payload.isVegAvailable = data.foodTypes.isVegAvailable;
        payload.isEggAvailable = data.foodTypes.isEggAvailable;
        payload.isNonVegAvailable = data.foodTypes.isNonVegAvailable;
      }

      // Serving options
      if (dirtyFields.servingOptions) {
        payload.servingOptions = data.servingOptions;
      }

      // Cuisines
      if (dirtyFields.cuisines) {
        payload.cuisineIds = data.cuisines;
      }

      // PAN & GST
      if (dirtyFields.panNumber) {
        payload.panNumber = data.panNumber;
      }
      if (dirtyFields.gstNumber) {
        payload.gstNumber = data.gstNumber;
      }

      // Manager
      if (dirtyFields.isUserManaging) {
        payload.isUserManaging = data.isUserManaging;
      }

      // Primary image (only upload if changed)
      if (dirtyFields.primaryImage) {
        let primaryImageKey = data.primaryImage;
        if (data.primaryImage instanceof File) {
          const result = await multimediaService.uploadRestaurantDoc(
            data.primaryImage,
            "restaurant_primary_image",
          );
          primaryImageKey = result.key;
        }
        payload.primaryImage = primaryImageKey as string;
      }

      // FSSAI certificate (only upload if changed)
      if (dirtyFields.fssaiCertificate) {
        let fssaiKey = data.fssaiCertificate;
        if (data.fssaiCertificate instanceof File) {
          const result = await multimediaService.uploadRestaurantDoc(
            data.fssaiCertificate,
            "restaurant_fssai",
          );
          fssaiKey = result.key;
        }
        payload.fssaiLicenseImage = fssaiKey as string;
      }

      // Menu images (only process if changed)
      if (dirtyFields.menuImages) {
        const menuImageKeys: string[] = [];
        const menuImages = data.menuImages || [];
        for (const img of menuImages) {
          if (img instanceof File) {
            const result = await multimediaService.uploadRestaurantDoc(
              img,
              "restaurant_delivery_menu",
            );
            menuImageKeys.push(result.key);
          } else {
            menuImageKeys.push(img as string);
          }
        }
        payload.deliveryMenuImages = menuImageKeys;
      }

      // Bank details (only if user clicked Change and filled new details)
      if (isEditingBank) {
        payload.bankDetails = {
          bankAccountNumber: data.bankDetails?.accountNumber || "",
          ifscCode: data.bankDetails?.ifscCode || "",
          accountHolderName: data.bankDetails?.accountHolderName || "",
          bankName: data.bankDetails?.bankName || "",
          branchName: data.bankDetails?.bankBranch || "",
        };
      }

      // Guard: don't call API if nothing changed
      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        setIsSaving(false);
        return;
      }

      await restaurantService.updateRestaurant(
        restaurantData.restroId,
        payload as any,
      );
      toast.success(t("common.success", "Restaurant updated successfully"));
      onSuccess(payload);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("common.error.generic"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showDiscardWarning}
        onClose={handleCloseAttempt}
        title={t("onboarding.restaurant.complete.card.viewModifyDetails")}
        className="max-w-5xl"
      >
        <div className="flex flex-col h-[85vh]">
          <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
            <form
              id="edit-restaurant-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <Accordion
                type="multiple"
                defaultValue={["details", "government", "management", "bank"]}
                className="space-y-6"
              >
                {/* 1. Restaurant Details */}
                <AccordionItem
                  value="details"
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  <AccordionTrigger className="p-6 bg-slate-50/50 hover:no-underline">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-[#0F2441]" />
                      {t(
                        "onboarding.restaurant.complete.setupForm.restaurantDetails",
                      )}
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <FloatingInput
                        label={t(
                          "onboarding.restaurant.complete.setupForm.restaurantName",
                        )}
                        {...register("restaurantName")}
                        error={errors.restaurantName?.message}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr,350px] gap-8">
                      <div className="space-y-6">
                        <Label className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          {t(
                            "onboarding.restaurant.complete.setupForm.completeAddress",
                          )}
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                  className="react-select-container"
                                  classNamePrefix="react-select"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderRadius: "0.75rem",
                                      minHeight: "45px",
                                    }),
                                  }}
                                />
                              )}
                            />
                          </div>

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
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderRadius: "0.75rem",
                                      minHeight: "45px",
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

                      <div className="space-y-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                          <Label className="text-base font-bold">
                            {t(
                              "onboarding.restaurant.complete.setupForm.ownPartners",
                            )}
                          </Label>
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

                        {watch("hasOwnDeliveryPartners") && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-bold uppercase tracking-widest pl-1">
                              {t(
                                "onboarding.restaurant.complete.setupForm.deliveryBy",
                              )}
                            </Label>
                            <Controller
                              control={control}
                              name="deliveryBy"
                              render={({ field }) => (
                                <Tabs
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  className="w-full"
                                >
                                  <TabsList className="bg-slate-100 p-1 h-11 rounded-xl w-full">
                                    <TabsTrigger
                                      value="USTART"
                                      className="flex-1 rounded-lg font-bold"
                                    >
                                      USTART
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="Restaurant"
                                      className="flex-1 rounded-lg font-bold"
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
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-widest pl-1">
                          {t(
                            "onboarding.restaurant.complete.setupForm.servingOptions",
                          )}
                        </Label>
                        <Controller
                          control={control}
                          name="servingOptions"
                          render={({ field }) => (
                            <div className="flex gap-2">
                              {(["DELIVERY", "DINE_IN"] as const).map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    const curr = field.value || [];
                                    const next = curr.includes(opt)
                                      ? curr.filter((o) => o !== opt)
                                      : [...curr, opt];
                                    field.onChange(next);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${field.value?.includes(opt) ? "bg-[#0F2441] text-white border-[#0F2441]" : "bg-white border-slate-200"}`}
                                >
                                  {opt === "DELIVERY"
                                    ? t(
                                        "onboarding.restaurant.complete.card.deliveryLabel",
                                      )
                                    : t(
                                        "onboarding.restaurant.complete.card.dineInLabel",
                                      )}
                                </button>
                              ))}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                      <div className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-widest pl-1">
                          {t("onboarding.restaurant.about.foodTypeLabel")}
                        </Label>
                        <Controller
                          control={control}
                          name="foodTypes"
                          render={({ field }) => (
                            <div className="flex gap-3">
                              <FoodTypeButton
                                label={t("onboarding.restaurant.about.veg")}
                                colorClass="bg-green-500"
                                isSelected={!!field.value?.isVegAvailable}
                                onClick={() =>
                                  field.onChange({
                                    ...field.value,
                                    isVegAvailable:
                                      !field.value?.isVegAvailable,
                                  })
                                }
                              />
                              <FoodTypeButton
                                label={t("onboarding.restaurant.about.nonVeg")}
                                colorClass="bg-red-500"
                                isSelected={!!field.value?.isNonVegAvailable}
                                onClick={() =>
                                  field.onChange({
                                    ...field.value,
                                    isNonVegAvailable:
                                      !field.value?.isNonVegAvailable,
                                  })
                                }
                              />
                              <FoodTypeButton
                                label={t("onboarding.restaurant.about.egg")}
                                colorClass="bg-yellow-500"
                                isSelected={!!field.value?.isEggAvailable}
                                onClick={() =>
                                  field.onChange({
                                    ...field.value,
                                    isEggAvailable:
                                      !field.value?.isEggAvailable,
                                  })
                                }
                              />
                            </div>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-widest pl-1">
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
                              value={(field.value || []).map(
                                (id) =>
                                  cuisineOptions.find(
                                    (o) => o.value === id,
                                  ) || { value: id, label: `ID: ${id}` },
                              )}
                              components={{ MenuList }}
                              {...({
                                hasNextPage,
                                isFetchingNextPage,
                                fetchNextPage,
                                t,
                              } as any)}
                              inputValue={searchQuery}
                              onInputChange={(val, { action }) =>
                                action === "input-change" && setSearchQuery(val)
                              }
                              onChange={(val: any) =>
                                field.onChange(
                                  val ? val.map((v: any) => v.value) : [],
                                )
                              }
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderRadius: "0.75rem",
                                  minHeight: "45px",
                                }),
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                      <div>
                        <Label className="text-sm font-bold uppercase tracking-widest pl-1 mb-3 block">
                          {t(
                            "onboarding.restaurant.complete.setupForm.primaryImage",
                          )}
                        </Label>
                        <input
                          type="file"
                          ref={primaryInputRef}
                          onChange={handlePrimaryImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div
                          onClick={() => primaryInputRef.current?.click()}
                          className="relative aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9F43] transition-all overflow-hidden group"
                        >
                          {primaryPreview ? (
                            <>
                              <img
                                src={primaryPreview}
                                className="w-full h-full object-cover"
                                alt="Primary"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PencilLine className="w-6 h-6 text-white" />
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-slate-400 mb-2" />
                              <span className="text-xs font-bold text-slate-500">
                                {t(
                                  "onboarding.restaurant.complete.setupForm.uploadPhoto",
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-bold uppercase tracking-widest pl-1 mb-3 block">
                          {t(
                            "onboarding.restaurant.complete.setupForm.deliveryMenu",
                          )}
                        </Label>
                        <input
                          type="file"
                          ref={menuInputRef}
                          onChange={handleMenuImagesChange}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <div className="flex gap-2 overflow-x-auto pb-2 h-[120px] custom-scrollbar">
                          {menuPreviews.map((url, idx) => (
                            <div
                              key={idx}
                              className="h-full aspect-[3/4] rounded-lg border border-slate-100 relative group overflow-hidden bg-slate-50 flex-shrink-0"
                            >
                              <img
                                src={url}
                                className="w-full h-full object-cover"
                                alt="Menu"
                              />
                              <button
                                type="button"
                                onClick={() => removeMenuImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => menuInputRef.current?.click()}
                            className="h-full aspect-[3/4] rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-[#FF9F43] transition-all bg-slate-50/50 flex-shrink-0"
                          >
                            <Plus className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Government Details */}
                <AccordionItem
                  value="government"
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  <AccordionTrigger className="p-6 bg-slate-50/50 hover:no-underline">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#0F2441]" />
                      {t(
                        "onboarding.restaurant.complete.setupForm.governmentDetails",
                      )}
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-widest pl-1">
                        {t(
                          "onboarding.restaurant.complete.setupForm.fssaiLicense",
                        )}
                      </Label>
                      <input
                        type="file"
                        ref={fssaiInputRef}
                        onChange={handleFssaiChange}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      <div
                        className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-between transition-all ${watch("fssaiCertificate") ? "bg-green-50/30 border-green-200" : "bg-slate-50/50 border-slate-200"}`}
                      >
                        <div className="flex items-center gap-3">
                          {watch("fssaiCertificate") ? (
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                              <Check className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold truncate max-w-[200px]">
                              {typeof watch("fssaiCertificate") === "string"
                                ? "Existing License"
                                : (watch("fssaiCertificate") as File)?.name ||
                                  "No file selected"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fssaiInputRef.current?.click()}
                          className="rounded-xl font-bold"
                        >
                          {watch("fssaiCertificate")
                            ? t("common.change")
                            : t("common.upload")}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Bank Details */}
                <AccordionItem
                  value="bank"
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  <AccordionTrigger className="p-6 bg-slate-50/50 hover:no-underline">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#0F2441]" />
                      {t("onboarding.restaurant.complete.setupForm.bank.title")}
                    </h2>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 space-y-6">
                    <div className="animate-in fade-in slide-in-from-top-4">
                      {!isEditingBank && restaurantData?.accountHolderName ? (
                        <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0F2441]/10 rounded-full flex items-center justify-center text-[#0F2441]">
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">
                                {restaurantData.accountHolderName}
                              </p>
                              <p className="text-xs font-bold text-slate-500 tracking-widest">
                                ••••{" "}
                                {restaurantData.bankAccountNumberLast4 ||
                                  "XXXX"}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditingBank(true);
                              setValue(
                                "bankDetails",
                                {
                                  accountNumber: "",
                                  accountHolderName: "",
                                  bankName: "",
                                  bankBranch: "",
                                  ifscCode: "",
                                },
                                { shouldDirty: true },
                              );
                            }}
                            className="rounded-xl font-bold border-slate-200"
                          >
                            {t("common.change")}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                              error={
                                errors.bankDetails?.accountHolderName?.message
                              }
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
                          {restaurantData?.accountHolderName && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsEditingBank(false);
                                  setValue(
                                    "bankDetails",
                                    {
                                      accountNumber: "",
                                      accountHolderName:
                                        restaurantData.accountHolderName || "",
                                      bankName: restaurantData.bankName || "",
                                      bankBranch:
                                        restaurantData.branchName || "",
                                      ifscCode: restaurantData.ifscCode || "",
                                    },
                                    { shouldDirty: false },
                                  );
                                }}
                                className="rounded-xl font-bold border-slate-200"
                              >
                                {t("common.cancel")}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </div>

          <div className="p-6 border-t flex flex-col sm:flex-row justify-end gap-3 bg-white rounded-b-3xl">
            <Button
              variant="ghost"
              onClick={handleCloseAttempt}
              disabled={isSaving}
              className="font-bold rounded-xl h-12 px-8"
            >
              {t("common.cancel")}
            </Button>
            <Button
              form="edit-restaurant-form"
              type="submit"
              disabled={(!isDirty && !isEditingBank) || isSaving}
              className="bg-[#0F2441] hover:bg-black text-white font-bold rounded-xl h-12 px-10 shadow-lg shadow-[#0F2441]/20 transform transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t("common.saveChanges")}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Discard Warning Modal */}
      <Modal
        isOpen={showDiscardWarning}
        onClose={() => setShowDiscardWarning(false)}
        title={t("common.warning")}
        className="max-w-md"
      >
        <div className="p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {t("common.discardChanges")}
            </h3>
            <p className="text-slate-600 font-medium">
              {t("onboarding.restaurant.complete.card.discardWarning")}
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDiscardWarning(false)}
              className="rounded-xl h-12 px-8 border-slate-200 font-bold"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardWarning(false);
                onClose();
              }}
              className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-red-600/20"
            >
              {t("common.discard")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
