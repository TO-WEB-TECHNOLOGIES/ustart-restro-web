import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMenu } from "../../hooks/useMenu";
import type { MenuItem, Allergen, MenuTag } from "../../../../types/menuTypes";
import {
  Check,
  ImagePlus,
  Sparkles,
  AlertCircle,
  X,
  Flame,
  Calendar,
  Candy,
} from "lucide-react";
import { menuItemSchema } from "../../validations/menuSchemas";
import { z } from "zod";
import ReactSelect from "react-select";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "react-i18next";
import { useMenuStore } from "../../store/useMenuStore";

export const AddItemPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedCategory } = useMenu();
  const addNewItemLocally = useMenuStore((state) => state.addNewItemLocally);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [addToStockImmediately, setAddToStockImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [validatedFormData, setValidatedFormData] = useState<any>(null);
  const [scheduleError, setScheduleError] = useState<string>("");

  // Calculate minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Validate that scheduled date/time is at least 24 hours from now
  const isScheduleValid = () => {
    if (addToStockImmediately) return true;
    if (!scheduledDate || !scheduledTime) return false;

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + 24);

    return scheduledDateTime >= minDateTime;
  };

  // Validate schedule on change and set error message
  const validateSchedule = () => {
    if (!addToStockImmediately && scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const minDateTime = new Date();
      minDateTime.setHours(minDateTime.getHours() + 24);

      if (scheduledDateTime < minDateTime) {
        setScheduleError(
          t("dashboard.menuEditor.addItem.confirmModal.scheduleMinError"),
        );
        return false;
      }
    }
    setScheduleError("");
    return true;
  };

  const itemConsistencyOptions = [
    {
      value: "SOLID",
      label: t("dashboard.menuEditor.addItem.consistencies.solid"),
    },
    {
      value: "LIQUID",
      label: t("dashboard.menuEditor.addItem.consistencies.liquid"),
    },
    {
      value: "SEMI_SOLID",
      label: t("dashboard.menuEditor.addItem.consistencies.semiSolid"),
    },
    {
      value: "FROZEN",
      label: t("dashboard.menuEditor.addItem.consistencies.frozen"),
    },
  ];

  // Default form state
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    categoryId: selectedCategory?.id,
    name: "",
    description: "",
    itemPrice: undefined,
    packagingCharges: undefined,
    taxAmount: 5,
    foodType: "VEG",
    serviceType: "DELIVERY",
    itemType: [],
    isFrosting: undefined,
    serves: undefined,
    portionSize: undefined,
    weight: "",
    maxQuantity: undefined,
    tags: [],
    allergens: [],
    spiceLevel: 1,
    availability: {
      startTime: "09:00",
      endTime: "23:00",
      allDay: true,
    },
    nutritionalInfo: {
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    },
    isAiGeneratedImage: false,
  });

  const updateField = (field: keyof MenuItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateNestedField = (
    parent: "nutritionalInfo" | "availability",
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const toggleArrayItem = (field: "tags" | "allergens", value: string) => {
    setFormData((prev) => {
      const currentArray = (prev[field] as string[]) || [];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter((i) => i !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        updateField("image", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    updateField("image", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleSave = async () => {
    try {
      // 1. Prepare data
      const finalData = {
        ...formData,
        allergens:
          formData.allergens && formData.allergens.length > 0
            ? formData.allergens
            : (["NONE_OF_THESE"] as Allergen[]),
        tags:
          formData.tags && formData.tags.length > 0
            ? formData.tags
            : (["NONE_OF_THESE"] as MenuTag[]),
        categoryId: selectedCategory?.id, // Ensure it's present
      };

      // 2. Validate with Zod first
      menuItemSchema.parse(finalData);

      // 3. Clear existing errors if valid
      setErrors({});

      // 4. Store validated data and show confirmation modal
      setValidatedFormData(finalData);
      setShowConfirmModal(true);
    } catch (error) {
      handleError(error);
    }
  };

  const performSave = () => {
    if (selectedCategory && validatedFormData) {
      // Calculate scheduled date-time if scheduling is selected
      const scheduledDateTime =
        !addToStockImmediately && scheduledDate && scheduledTime
          ? `${scheduledDate}T${scheduledTime}`
          : null;

      // Add item locally to updatedItems (no API call)
      addNewItemLocally(selectedCategory.id, validatedFormData as MenuItem, {
        addToStockImmediately,
        scheduledDate: scheduledDateTime,
      });
      navigate(-1);
    }
  };

  const handleError = (error: any) => {
    if (error instanceof z.ZodError) {
      const newErrors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) {
          newErrors[path.toString()] = t(issue.message);
        }
      });
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorField = error.issues[0]?.path[0];
      if (firstErrorField) {
        const element = document.getElementsByName(
          firstErrorField.toString(),
        )[0];
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <section className="flex-1 bg-white dark:bg-slate-950 overflow-y-auto p-4 md:p-8 relative h-full transition-colors duration-300">
        <div className="max-w-6xl mx-auto pb-20">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-4 md:gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  {t("dashboard.menuEditor.addItem.title")}
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {selectedCategory?.name}{" "}
                  {t("dashboard.menuEditor.addItem.categorySuffix")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleBack}
                className="hidden md:block px-6 py-2.5 rounded-full text-sm font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors scale-95"
              >
                {t("dashboard.menuEditor.addItem.discard")}
              </button>
              <button
                onClick={handleSave}
                className="bg-[var(--color-primary-blue)] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2"
              >
                <span>{t("dashboard.menuEditor.addItem.save")}</span>
                <Check className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 min-h-full">
            {/* Left Column */}
            <div className="lg:col-span-7 flex flex-col space-y-12 md:space-y-16">
              {/* Basic Info */}
              <div className="group flex flex-col">
                <h3 className="font-mono text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary-blue)]"></span>
                  {t("dashboard.menuEditor.addItem.basicInfo")}
                </h3>
                <div className="space-y-6 flex-1">
                  <div
                    className={`bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border ${errors.name ? "border-red-500" : "border-slate-100"} dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all`}
                  >
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-3">
                      {t("dashboard.menuEditor.addItem.itemName")}
                    </label>
                    <div className="px-4 pb-2">
                      <input
                        name="name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="w-full bg-transparent text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 border-0 focus:ring-0 p-0 transition-all outline-none"
                        placeholder={t("dashboard.menuEditor.addItem.itemName")}
                        type="text"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs px-4 pb-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div
                    className={`bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border ${errors.description ? "border-red-500" : "border-slate-100"} dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all`}
                  >
                    <div className="relative px-4 pt-3 pb-2">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) =>
                          updateField(
                            "description",
                            e.target.value.slice(0, 100),
                          )
                        }
                        className="w-full bg-transparent text-sm md:text-base font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-200 dark:placeholder:text-slate-700 border-0 focus:ring-0 p-0 resize-none transition-all outline-none"
                        placeholder={t(
                          "dashboard.menuEditor.addItem.descriptionPlaceholder",
                        )}
                        rows={3}
                      ></textarea>
                      <div className="absolute top-3 right-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {formData.description?.length || 0}/100
                      </div>
                    </div>
                    {errors.description && (
                      <p className="text-red-500 text-xs px-4 pb-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <h3 className="font-mono text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  {t("dashboard.menuEditor.addItem.media")}
                </h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center hover:border-[var(--color-primary-blue)]/50 hover:bg-[var(--color-primary-blue)]/[0.02] transition-all cursor-pointer group h-64 relative overflow-hidden"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-lg z-10"
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </button>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-bold">
                          {t("dashboard.menuEditor.addItem.changeImage")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="size-16 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                        <ImagePlus className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-primary-blue)]" />
                      </div>
                      <p className="text-navy text-slate-900 dark:text-white font-bold text-lg">
                        {t("dashboard.menuEditor.addItem.dropImage")}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {t("dashboard.menuEditor.addItem.clickBrowse")}
                      </p>
                    </>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-5 h-5" />
                    <span>
                      {t("dashboard.menuEditor.addItem.aiGeneratedLabel")}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="checkbox"
                      checked={formData.isAiGeneratedImage}
                      onChange={(e) =>
                        updateField("isAiGeneratedImage", e.target.checked)
                      }
                    />
                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary-blue)]"></div>
                  </label>
                </div>
                {errors.isAiGeneratedImage && (
                  <p className="text-red-500 text-xs px-2 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{" "}
                    {errors.isAiGeneratedImage}
                  </p>
                )}
              </div>

              {/* Details */}
              <div>
                <h3 className="font-mono text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  {t("dashboard.menuEditor.addItem.details")}
                </h3>
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <label className="text-base font-bold text-navy text-slate-900 dark:text-white">
                        {t("dashboard.menuEditor.addItem.availability")}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          checked={formData.availability?.allDay}
                          onChange={(e) =>
                            updateNestedField(
                              "availability",
                              "allDay",
                              e.target.checked,
                            )
                          }
                          className="rounded border-gray-300 text-navy focus:ring-navy"
                          id="avail-check"
                          type="checkbox"
                        />
                        <label
                          className="text-xs font-semibold text-gray-500"
                          htmlFor="avail-check"
                        >
                          {t("dashboard.menuEditor.addItem.sameAsRestaurant")}
                        </label>
                      </div>
                    </div>
                    <div
                      className={`grid grid-cols-2 gap-4 ${formData.availability?.allDay ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          {t("dashboard.menuEditor.addItem.from")}
                        </span>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                          type="time"
                          value={formData.availability?.startTime}
                          onChange={(e) =>
                            updateNestedField(
                              "availability",
                              "startTime",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          {t("dashboard.menuEditor.addItem.to")}
                        </span>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                          type="time"
                          value={formData.availability?.endTime}
                          onChange={(e) =>
                            updateNestedField(
                              "availability",
                              "endTime",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <label className="text-base font-bold text-navy text-slate-900 dark:text-white">
                      {t("dashboard.menuEditor.addItem.allergyInfo")}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        {
                          value: "MILK",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.milk",
                          ),
                        },
                        {
                          value: "EGGS",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.eggs",
                          ),
                        },
                        {
                          value: "FISH",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.fish",
                          ),
                        },
                        {
                          value: "SHELLFISH",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.shellfish",
                          ),
                        },
                        {
                          value: "TREE_NUTS",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.tree_nuts",
                          ),
                        },
                        {
                          value: "PEANUTS",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.peanuts",
                          ),
                        },
                        {
                          value: "WHEAT",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.wheat",
                          ),
                        },
                        {
                          value: "SOY",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.soy",
                          ),
                        },
                        {
                          value: "SESAME",
                          label: t(
                            "dashboard.menuEditor.addItem.allergens.sesame",
                          ),
                        },
                      ].map((opt) => (
                        <label key={opt.value} className="cursor-pointer group">
                          <input
                            className="peer sr-only"
                            type="checkbox"
                            checked={formData.allergens?.includes(
                              opt.value as Allergen,
                            )}
                            onChange={() =>
                              toggleArrayItem("allergens", opt.value)
                            }
                          />
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 text-sm font-medium transition-all peer-checked:bg-[var(--color-primary-blue)] peer-checked:text-white peer-checked:border-[var(--color-primary-blue)] hover:bg-gray-50 dark:hover:bg-slate-700">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-base font-bold text-navy text-slate-900 dark:text-white">
                      {t("dashboard.menuEditor.addItem.tags")}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        {
                          value: "GLUTEN_FREE",
                          label: t(
                            "dashboard.menuEditor.addItem.menuTags.gluten_free",
                          ),
                        },
                        {
                          value: "SUGAR_FREE",
                          label: t(
                            "dashboard.menuEditor.addItem.menuTags.sugar_free",
                          ),
                        },
                        {
                          value: "JAIN",
                          label: t(
                            "dashboard.menuEditor.addItem.menuTags.jain",
                          ),
                        },
                        {
                          value: "VEGAN",
                          label: t(
                            "dashboard.menuEditor.addItem.menuTags.vegan",
                          ),
                        },
                        {
                          value: "CHEFS_SPECIAL",
                          label: t(
                            "dashboard.menuEditor.addItem.menuTags.chefs_special",
                          ),
                        },
                        {
                          value: "HIGH_PROTIEN",
                          label: t(
                            "dashboard.menuEditor.addItem.menuTags.high_protien",
                          ),
                        },
                      ].map((opt) => (
                        <label key={opt.value} className="cursor-pointer group">
                          <input
                            className="peer sr-only"
                            type="checkbox"
                            checked={formData.tags?.includes(
                              opt.value as MenuTag,
                            )}
                            onChange={() => toggleArrayItem("tags", opt.value)}
                          />
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 text-sm font-medium transition-all peer-checked:bg-[var(--color-primary-blue)] peer-checked:text-white peer-checked:border-[var(--color-primary-blue)] hover:bg-gray-50 dark:hover:bg-slate-700">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 space-y-12">
              {/* Pricing */}
              <div>
                <h3 className="font-mono text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {t("dashboard.menuEditor.addItem.pricing")}
                </h3>
                <div className="space-y-4">
                  <div
                    className={`bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border ${errors.itemPrice ? "border-red-500" : "border-slate-100"} dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all`}
                  >
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pt-3">
                      {t("dashboard.menuEditor.addItem.basePrice")}
                    </label>
                    <div className="flex items-center px-4 pb-2">
                      <span className="text-2xl font-bold text-slate-400 dark:text-slate-600 mr-2">
                        ₹
                      </span>
                      <input
                        name="itemPrice"
                        value={formData.itemPrice ?? ""}
                        onChange={(e) =>
                          updateField(
                            "itemPrice",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-full bg-transparent border-0 p-0 text-3xl font-bold text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-700 outline-none"
                        placeholder="0.00"
                        type="number"
                      />
                    </div>
                    {errors.itemPrice && (
                      <p className="text-red-500 text-xs px-4 pb-2">
                        {errors.itemPrice}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        {t("dashboard.menuEditor.addItem.taxes")}
                      </label>
                      <input
                        name="taxAmount"
                        value={formData.taxAmount ?? ""}
                        onChange={(e) =>
                          updateField(
                            "taxAmount",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 outline-none"
                        placeholder="5%"
                        type="number"
                      />
                      {errors.taxAmount && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.taxAmount}
                        </p>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        {t("dashboard.menuEditor.addItem.packaging")}
                      </label>
                      <input
                        name="packagingCharges"
                        value={formData.packagingCharges ?? ""}
                        onChange={(e) =>
                          updateField(
                            "packagingCharges",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-full bg-transparent border-0 p-0 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 outline-none"
                        placeholder="0.00"
                        type="number"
                      />
                      {errors.packagingCharges && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.packagingCharges}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div>
                <h3 className="font-mono text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  {t("dashboard.menuEditor.addItem.classification")}
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-base font-bold text-navy text-slate-900 dark:text-white">
                      {t("dashboard.menuEditor.addItem.serviceType")}
                    </label>
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                      {[
                        {
                          value: "DELIVERY",
                          label: t(
                            "dashboard.menuEditor.addItem.serviceTypes.delivery",
                          ),
                        },
                        {
                          value: "DINE_IN",
                          label: t(
                            "dashboard.menuEditor.addItem.serviceTypes.dineIn",
                          ),
                        },
                        {
                          value: "BOTH",
                          label: t(
                            "dashboard.menuEditor.addItem.serviceTypes.both",
                          ),
                        },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("serviceType", opt.value)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${formData.serviceType === opt.value ? "bg-[var(--color-primary-blue)] text-white shadow-sm" : "text-gray-500 hover:text-navy dark:hover:text-white"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-base font-bold text-navy text-slate-900 dark:text-white">
                      {t("dashboard.menuEditor.addItem.foodType")}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          id: "VEG",
                          label: t(
                            "dashboard.menuEditor.addItem.foodTypes.veg",
                          ),
                          color: "green",
                        },
                        {
                          id: "NON_VEG",
                          label: t(
                            "dashboard.menuEditor.addItem.foodTypes.nonVeg",
                          ),
                          color: "red",
                        },
                        {
                          id: "CONTAINS_EGG",
                          label: t(
                            "dashboard.menuEditor.addItem.foodTypes.egg",
                          ),
                          color: "yellow",
                        },
                      ].map((type) => (
                        <label
                          key={type.id}
                          className="cursor-pointer relative"
                        >
                          <input
                            className="peer sr-only"
                            name="food_type"
                            type="radio"
                            checked={formData.foodType === type.id}
                            onChange={() => updateField("foodType", type.id)}
                          />
                          <div
                            className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-gray-500 ${formData.foodType === type.id ? `border-${type.color}-600 bg-${type.color}-50 text-${type.color}-700` : ""}`}
                          >
                            <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                              <div className="size-full rounded-full bg-current"></div>
                            </div>
                            <span className="text-xs font-bold">
                              {type.label}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div>
                <h3 className="font-mono text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {t("dashboard.menuEditor.addItem.attributes")}
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500">
                        {t("dashboard.menuEditor.addItem.portion")}
                      </label>
                      <input
                        name="portionSize"
                        value={formData.portionSize ?? ""}
                        onChange={(e) =>
                          updateField(
                            "portionSize",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                        placeholder="1"
                        type="number"
                      />
                      {errors.portionSize && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.portionSize}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500">
                        {t("dashboard.menuEditor.addItem.serves")}
                      </label>
                      <input
                        name="serves"
                        value={formData.serves ?? ""}
                        onChange={(e) =>
                          updateField(
                            "serves",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                        placeholder="1"
                        type="number"
                      />
                      {errors.serves && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.serves}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500">
                        {t("dashboard.menuEditor.addItem.weight")}
                      </label>
                      <input
                        name="weight"
                        value={formData.weight ?? ""}
                        onChange={(e) => updateField("weight", e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                        placeholder="200g"
                        type="text"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500">
                        {t("dashboard.menuEditor.addItem.maxQty")}
                      </label>
                      <input
                        name="maxQuantity"
                        value={formData.maxQuantity ?? ""}
                        onChange={(e) =>
                          updateField(
                            "maxQuantity",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                        placeholder="10"
                        type="number"
                      />
                      {errors.maxQuantity && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.maxQuantity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-base font-bold text-navy text-slate-900 dark:text-white">
                    {t("dashboard.menuEditor.addItem.consistency")}
                  </label>
                  <ReactSelect
                    isMulti
                    options={itemConsistencyOptions}
                    value={itemConsistencyOptions.filter((opt) =>
                      formData.itemType?.includes(opt.value as any),
                    )}
                    onChange={(newValue: any) => {
                      updateField(
                        "itemType",
                        newValue.map((v: any) => v.value),
                      );
                    }}
                    placeholder={t(
                      "dashboard.menuEditor.addItem.consistencyPlaceholder",
                    )}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: "0.75rem",
                        borderColor: state.isFocused
                          ? "var(--color-primary-blue)"
                          : errors.itemType
                            ? "#ef4444"
                            : "#e2e8f0",
                        boxShadow: state.isFocused
                          ? "0 0 0 1px var(--color-primary-blue)"
                          : "none",
                        "&:hover": {
                          borderColor: "var(--color-primary-blue)",
                        },
                        padding: "2px",
                        minHeight: "48px",
                        backgroundColor: "transparent",
                      }),
                      multiValue: (base) => ({
                        ...base,
                        borderRadius: "0.6rem",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: "var(--color-primary-blue)",
                        fontWeight: "700",
                        fontSize: "12px",
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
                  {errors.itemType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.itemType}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-base font-bold text-slate-900 dark:text-white">
                    {t("dashboard.menuEditor.addItem.frosting")}
                  </label>
                  <select
                    name="isFrosting"
                    value={formData.isFrosting ?? ""}
                    onChange={(e) =>
                      updateField("isFrosting", e.target.value || undefined)
                    }
                    className={`w-full bg-white dark:bg-slate-900 border ${errors.isFrosting ? "border-red-500" : "border-slate-200"} dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none`}
                  >
                    <option value="" disabled>
                      {t("dashboard.menuEditor.addItem.frostingPlaceholder")}
                    </option>
                    <option value="NO">
                      {t("dashboard.menuEditor.addItem.frostingOptions.no")}
                    </option>
                    <option value="FRESH">
                      {t("dashboard.menuEditor.addItem.frostingOptions.fresh")}
                    </option>
                    <option value="PRE_FROSTED">
                      {t(
                        "dashboard.menuEditor.addItem.frostingOptions.preFrosted",
                      )}
                    </option>
                  </select>
                  {errors.isFrosting && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.isFrosting}
                    </p>
                  )}
                </div>
                <div className="space-y-3 w-full">
                  <label className="text-base font-bold text-slate-900 dark:text-white">
                    {t("dashboard.menuEditor.addItem.spiceLevel")}
                  </label>
                  <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full gap-1">
                    {[
                      {
                        value: -1,
                        label: t(
                          "dashboard.menuEditor.addItem.spiceLevels.sweet",
                        ),
                      },
                      {
                        value: 1,
                        label: t(
                          "dashboard.menuEditor.addItem.spiceLevels.mild",
                        ),
                      },
                      {
                        value: 2,
                        label: t(
                          "dashboard.menuEditor.addItem.spiceLevels.medium",
                        ),
                      },
                      {
                        value: 3,
                        label: t(
                          "dashboard.menuEditor.addItem.spiceLevels.hot",
                        ),
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField("spiceLevel", opt.value)}
                        className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 group/spice w-full ${
                          formData.spiceLevel === opt.value
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600"
                            : "text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-600"
                        }`}
                        title={opt.label}
                      >
                        <div className="flex items-center">
                          {opt.value === -1 ? (
                            <Candy
                              className={`w-4 h-4 ${
                                formData.spiceLevel === -1
                                  ? "fill-pink-500 text-pink-500"
                                  : "text-gray-300 group-hover/spice:text-gray-500"
                              }`}
                              strokeWidth={2.5}
                            />
                          ) : (
                            [...Array(opt.value)].map((_, i) => (
                              <Flame
                                key={i}
                                className={`w-4 h-4 ${
                                  formData.spiceLevel === opt.value
                                    ? "fill-red-600 text-red-600"
                                    : "text-gray-300 group-hover/spice:text-gray-500"
                                }`}
                                strokeWidth={2.5}
                              />
                            ))
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-tighter font-extrabold">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={t("dashboard.menuEditor.addItem.confirmModal.title")}
      >
        <div className="space-y-6">
          {/* Stock Option Switch */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${addToStockImmediately ? "bg-green-100 dark:bg-green-500/20" : "bg-orange-100 dark:bg-orange-500/20"}`}
                >
                  {addToStockImmediately ? (
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {t("dashboard.menuEditor.addItem.confirmModal.addToStock")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {addToStockImmediately
                      ? t(
                          "dashboard.menuEditor.addItem.confirmModal.immediateDesc",
                        )
                      : t(
                          "dashboard.menuEditor.addItem.confirmModal.scheduledDesc",
                        )}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  className="sr-only peer"
                  type="checkbox"
                  checked={addToStockImmediately}
                  onChange={(e) => setAddToStockImmediately(e.target.checked)}
                />
                <div className="w-12 h-7 bg-orange-400 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {/* Date/Time Picker - Only show when scheduling */}
            {!addToStockImmediately && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t(
                    "dashboard.menuEditor.addItem.confirmModal.selectDateTime",
                  )}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {t("dashboard.menuEditor.addItem.confirmModal.date")}
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => {
                        setScheduledDate(e.target.value);
                        setTimeout(validateSchedule, 0);
                      }}
                      min={getMinDate()}
                      className={`w-full bg-white dark:bg-slate-900 border ${scheduleError ? "border-red-400" : "border-slate-200 dark:border-slate-700"} rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] transition-all outline-none`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {t("dashboard.menuEditor.addItem.confirmModal.time")}
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => {
                        setScheduledTime(e.target.value);
                        setTimeout(validateSchedule, 0);
                      }}
                      className={`w-full bg-white dark:bg-slate-900 border ${scheduleError ? "border-red-400" : "border-slate-200 dark:border-slate-700"} rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 focus:border-[var(--color-primary-blue)] transition-all outline-none`}
                    />
                  </div>
                </div>
                {/* Schedule Error Message */}
                {scheduleError && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{scheduleError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conditional Warning for Missing Image/Description */}
          {(!formData.image || !formData.description) && (
            <div className="flex items-start gap-4 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  {t("dashboard.menuEditor.addItem.confirmModal.missingTitle")}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {!formData.image && !formData.description
                    ? t("dashboard.menuEditor.addItem.confirmModal.missingBoth")
                    : !formData.image
                      ? t(
                          "dashboard.menuEditor.addItem.confirmModal.missingImage",
                        )
                      : t(
                          "dashboard.menuEditor.addItem.confirmModal.missingDescription",
                        )}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            >
              {t("dashboard.menuEditor.addItem.confirmModal.goBack")}
            </button>
            <button
              onClick={() => {
                setShowConfirmModal(false);
                performSave();
              }}
              disabled={
                !isScheduleValid() ||
                (!addToStockImmediately && (!scheduledDate || !scheduledTime))
              }
              className="w-full py-3 px-4 rounded-xl bg-[var(--color-primary-blue)] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addToStockImmediately
                ? t("dashboard.menuEditor.addItem.confirmModal.addNow")
                : t("dashboard.menuEditor.addItem.confirmModal.schedule")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
