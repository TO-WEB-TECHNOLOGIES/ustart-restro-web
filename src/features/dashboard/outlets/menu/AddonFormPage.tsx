import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { RequiredMark } from "@/components/ui/required-mark";
import { multimediaService } from "@/api/multimediaService";
import { getErrorMessage } from "@/utils/error";
import {
  type AddonFormValues,
  addonToFormValues,
  emptyAddonFormValues,
} from "../../api/addonLibraryApi";
import { type OptionExtras, type OptionNutrition, extrasTimesMissing } from "../../api/optionExtras";
import { useAddon, useAddonGroups, useAddonMutations } from "../../hooks/useAddonLibrary";
import { TaxRateSelect } from "../../components/MenuEditor/TaxRateSelect";
import {
  ALLERGEN_LABELS,
  CONSISTENCY_LABELS,
  FROSTING_LABELS,
  TAG_LABELS,
} from "../../components/MenuEditor/menuLabels";
import { useAddonLibraryPaths } from "../../components/AddonLibrary/paths";
import {
  CardLabel,
  ChipGroup,
  FIELD_INPUT,
  FIELD_TITLE,
  FieldCard,
  FoodTypeTiles,
  ImageDropzone,
  SMALL_LABEL,
  SectionTitle,
  SpiceLevelPicker,
} from "../../components/AddonLibrary/AddonFormFields";

/**
 * 2026-10-27: full-page add / edit form for one add-on.
 * /…/addons/new?group=<groupId> creates, ?edit=<addonId> edits. Saves straight to the server on
 * Save (no review queue) and returns to the list. Brand-level only: outlet users are sent back to
 * the read-only list.
 * 2026-10-27 (product feedback): laid out and styled like AddItemPage - same header, two columns
 * (Basic info / Media / Details | Pricing / Classification / Attributes), same field styles.
 * Fields: everything an add-on stores (product decision) except discount (no API field) and
 * packaging (product decision: add-ons take none - always sent as 0).
 */
const K = "dashboard.addonLibrary.form.";
const A = "dashboard.menuEditor.addItem.";
const DESCRIPTION_MAX = 200;
const CHECKBOX = "rounded border-gray-300 text-[var(--color-primary-blue)] focus:ring-[var(--color-primary-blue)]";

// Number inputs: "" = not set (left unchanged by the save), not 0.
const toOptionalInt = (raw: string) => (raw === "" ? undefined : Math.max(0, Math.floor(Number(raw))));

export const AddonFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const editId = editParam ? Number(editParam) : null;
  const groupParam = Number(searchParams.get("group")) || 0;

  const { data: groups = [] } = useAddonGroups();
  const { data: loaded, isLoading: isLoadingAddon, isError: loadFailed } = useAddon(editId);
  const { save } = useAddonMutations();
  // Dashboard or onboarding (upload-menu) copy of the library - see paths.ts.
  const { library, pageHeight } = useAddonLibraryPaths();

  const [values, setValues] = useState<AddonFormValues>(emptyAddonFormValues(groupParam));
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  // Fill the form from the saved add-on once; a background refetch must not wipe edits.
  const filledFor = useRef<number | null>(null);

  useEffect(() => {
    if (!loaded || filledFor.current === loaded.variantId) return;
    filledFor.current = loaded.variantId;
    setValues(addonToFormValues(loaded));
    setPreviewUrl(loaded.imageUrl);
  }, [loaded]);

  // A new add-on without a valid ?group= takes the first group once groups load.
  useEffect(() => {
    if (editId === null && !values.addOnCategoryId && groups[0]) {
      setValues((v) => ({ ...v, addOnCategoryId: groups[0].addOnId }));
    }
  }, [editId, groups, values.addOnCategoryId]);

  if (user?.restroId) return <Navigate to={library} replace />;

  const set = (patch: Partial<AddonFormValues>) => setValues((v) => ({ ...v, ...patch }));
  const setExtras = (patch: Partial<OptionExtras>) => setValues((v) => ({ ...v, extras: { ...v.extras, ...patch } }));
  const setNutrition = (field: keyof OptionNutrition, value: string) =>
    setValues((v) => ({ ...v, extras: { ...v.extras, nutrition: { ...v.extras.nutrition, [field]: value } } }));
  const toggle = (field: "itemType" | "tags" | "allergens", code: string) =>
    setValues((v) => {
      const list = v.extras[field];
      const next = list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
      return { ...v, extras: { ...v.extras, [field]: next } };
    });
  const backToList = (groupId = values.addOnCategoryId) =>
    navigate(groupId ? `${library}?group=${groupId}` : library);

  const validate = (): string[] => {
    const issues: string[] = [];
    if (!values.addOnCategoryId) issues.push(t(`${K}groupRequired`));
    if (!values.name.trim()) issues.push(t(`${K}nameRequired`));
    // 2026-10-27 (product decision): a base price is required - 0 isn't allowed.
    if (!(values.price > 0)) issues.push(t(`${K}priceInvalid`));
    if (extrasTimesMissing(values.extras)) issues.push(t("dashboard.menuEditor.customizations.details.timesRequired"));
    return issues;
  };

  const showErrors = (issues: string[]) => {
    setErrors(issues);
    // The summary sits under Save; bring it into view so a failed Save never looks like nothing.
    requestAnimationFrame(() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handleSave = async () => {
    const issues = validate();
    if (issues.length > 0) return showErrors(issues);
    setErrors([]);
    setIsUploading(true);
    try {
      // Only a new upload or a removal is sent: the backend deletes the stored file whenever an
      // image value arrives, and we only ever hold its public URL.
      let imageKey: string | undefined;
      if (file) imageKey = await multimediaService.uploadMenuItemImage(file);
      else if (removed && loaded?.imageUrl) imageKey = "";
      await save.mutateAsync({ addonId: editId, values, imageKey });
      toast.success(t(editId !== null ? `${K}updated` : `${K}created`, { name: values.name.trim() }));
      backToList();
    } catch (err) {
      const message = getErrorMessage(err, t(`${K}saveFailed`));
      showErrors([message]);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const isBusy = isUploading || save.isPending;
  const blocked = editId !== null && (isLoadingAddon || loadFailed);
  const { extras } = values;
  const triedSave = errors.length > 0;
  const groupName = groups.find((g) => g.addOnId === values.addOnCategoryId)?.categoryName;

  return (
    // Fills the screen below the header and scrolls inside (see paths.ts).
    <section className={`w-full ${pageHeight} bg-white dark:bg-slate-950 overflow-y-auto p-4 md:p-8 relative transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto pb-20">
        {/* Header - AddItemPage's */}
        <header className="flex items-center justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {t(editId !== null ? `${K}editTitle` : `${K}addTitle`)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
              {groupName ? t(`${K}inGroup`, { name: groupName }) : t(`${K}subtitle`)}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => backToList()}
              disabled={isBusy}
              className="hidden md:block px-6 py-2.5 rounded-full text-sm font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors scale-95"
            >
              {t(`${K}discard`)}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy || blocked}
              className="bg-[var(--color-primary-blue)] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t("dashboard.addonLibrary.save")}</span>
              {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {blocked && (
          <div
            role={loadFailed ? "alert" : "status"}
            className={`mb-8 p-4 rounded-2xl border text-sm font-medium ${
              loadFailed
                ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
            }`}
          >
            {loadFailed ? t(`${K}loadFailed`) : t(`${K}loading`)}
          </div>
        )}

        {/* Error summary right under Save, as on AddItemPage */}
        {triedSave && (
          <div
            ref={summaryRef}
            role="alert"
            className="mb-8 p-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">{t(`${K}fixBeforeSave`)}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-red-700 dark:text-red-400 space-y-0.5">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!blocked && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 min-h-full">
            {/* Left column */}
            <div className="lg:col-span-7 flex flex-col space-y-12 md:space-y-16">
              {/* Basic info */}
              <div className="flex flex-col">
                <SectionTitle dot="bg-[var(--color-primary-blue)]">{t(`${A}basicInfo`)}</SectionTitle>
                <div className="space-y-6">
                  <FieldCard hasError={triedSave && !values.name.trim()}>
                    <CardLabel htmlFor="addon-name">
                      {t(`${K}name`)}
                      <RequiredMark />
                    </CardLabel>
                    <div className="px-4 pb-2">
                      <input
                        id="addon-name"
                        value={values.name}
                        onChange={(e) => set({ name: e.target.value })}
                        className="w-full bg-transparent text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 border-0 focus:ring-0 p-0 outline-none"
                        placeholder={t(`${K}namePlaceholder`)}
                        type="text"
                      />
                    </div>
                  </FieldCard>

                  <FieldCard>
                    <div className="relative px-4 pt-3 pb-2">
                      <textarea
                        aria-label={t("dashboard.menuEditor.customizations.details.description")}
                        value={values.description}
                        onChange={(e) => set({ description: e.target.value.slice(0, DESCRIPTION_MAX) })}
                        className="w-full bg-transparent text-sm md:text-base font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-200 dark:placeholder:text-slate-700 border-0 focus:ring-0 p-0 pr-16 resize-none outline-none"
                        placeholder={t(`${K}descriptionPlaceholder`)}
                        rows={3}
                      />
                      <div className="absolute top-3 right-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {values.description.length}/{DESCRIPTION_MAX}
                      </div>
                    </div>
                  </FieldCard>

                  {/* Group: locked when editing - the backend sets an add-on's group only on create
                      (its update ignores addOnCategoryId), so a change would silently not save. */}
                  <div className="space-y-3">
                    <label htmlFor="addon-group" className={`block ${FIELD_TITLE}`}>
                      {t(`${K}group`)}
                      <RequiredMark />
                    </label>
                    <select
                      id="addon-group"
                      className={`${FIELD_INPUT} disabled:opacity-60`}
                      disabled={editId !== null}
                      value={values.addOnCategoryId || ""}
                      onChange={(e) => set({ addOnCategoryId: Number(e.target.value) })}
                    >
                      <option value="" disabled>
                        {t(`${K}groupPlaceholder`)}
                      </option>
                      {groups.map((g) => (
                        <option key={g.addOnId} value={g.addOnId}>
                          {g.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <SectionTitle dot="bg-orange-500">{t(`${A}media`)}</SectionTitle>
                <ImageDropzone
                  previewUrl={previewUrl}
                  onPick={(picked, url) => {
                    setFile(picked);
                    setRemoved(false);
                    setPreviewUrl(url);
                  }}
                  onRemove={() => {
                    setFile(null);
                    setRemoved(true);
                    setPreviewUrl(undefined);
                  }}
                />
              </div>

              {/* Details: availability, allergens, tags */}
              <div>
                <SectionTitle dot="bg-teal-500">{t(`${A}details`)}</SectionTitle>
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={FIELD_TITLE}>{t(`${A}availability`)}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extras.allDay}
                          onChange={(e) => setExtras({ allDay: e.target.checked })}
                          className={CHECKBOX}
                        />
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t(`${A}sameAsRestaurant`)}</span>
                      </label>
                    </div>
                    <div className={`grid grid-cols-2 gap-4 ${extras.allDay ? "opacity-50 pointer-events-none" : ""}`}>
                      {(["startTime", "endTime"] as const).map((field) => (
                        <div key={field} className="space-y-2">
                          <span className="text-xs font-bold text-gray-400 uppercase">
                            {t(field === "startTime" ? `${A}from` : `${A}to`)}
                          </span>
                          <input
                            type="time"
                            aria-label={t(field === "startTime" ? `${A}from` : `${A}to`)}
                            value={extras[field]}
                            disabled={extras.allDay}
                            onChange={(e) => setExtras({ [field]: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                          />
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={extras.isAvailable}
                        onChange={(e) => setExtras({ isAvailable: e.target.checked })}
                        className={CHECKBOX}
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t("dashboard.menuEditor.inStock")}</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t(`${K}availabilityHint`)}</p>
                  </div>

                  <div className="space-y-3">
                    <span className={`block ${FIELD_TITLE}`}>{t(`${A}allergyInfo`)}</span>
                    <ChipGroup options={ALLERGEN_LABELS} selected={extras.allergens} onToggle={(c) => toggle("allergens", c)} />
                  </div>

                  <div className="space-y-3">
                    <span className={`block ${FIELD_TITLE}`}>{t(`${A}tags`)}</span>
                    <ChipGroup options={TAG_LABELS} selected={extras.tags} onToggle={(c) => toggle("tags", c)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 space-y-12">
              {/* Pricing - no packaging on add-ons */}
              <div>
                <SectionTitle dot="bg-green-500">{t(`${A}pricing`)}</SectionTitle>
                <div className="space-y-4">
                  <FieldCard hasError={triedSave && !(values.price > 0)}>
                    <CardLabel htmlFor="addon-price">
                      {t(`${A}basePrice`)}
                      <RequiredMark />
                    </CardLabel>
                    <div className="flex items-center px-4 pb-2">
                      <span className="text-2xl font-bold text-slate-400 dark:text-slate-600 mr-2">₹</span>
                      <input
                        id="addon-price"
                        type="number"
                        min={0}
                        // 0 = not filled in yet: shown empty with the placeholder, rejected on Save.
                        value={values.price || ""}
                        onChange={(e) => set({ price: e.target.value === "" ? 0 : Number(e.target.value) })}
                        className="w-full bg-transparent border-0 p-0 text-3xl font-bold text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-200 dark:placeholder:text-slate-700 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </FieldCard>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all">
                    <label htmlFor="addon-tax" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      {t(`${A}taxes`)}
                      <RequiredMark />
                    </label>
                    <TaxRateSelect
                      name="addon-tax"
                      value={values.taxPercentage}
                      onChange={(rate) => set({ taxPercentage: rate })}
                      className="w-full bg-transparent dark:bg-slate-900 border-0 p-0 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 outline-none cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{t(`${K}pricingHint`)}</p>
                </div>
              </div>

              {/* Classification: food type + offered */}
              <div>
                <SectionTitle dot="bg-orange-400">{t(`${A}classification`)}</SectionTitle>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <span className={`block ${FIELD_TITLE}`}>
                      {t(`${A}foodType`)}
                      <RequiredMark />
                    </span>
                    <FoodTypeTiles value={values.foodType} onChange={(foodType) => set({ foodType })} />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={values.isActive}
                      onChange={(e) => set({ isActive: e.target.checked })}
                      className={`mt-0.5 ${CHECKBOX}`}
                    />
                    <span>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{t(`${K}active`)}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`${K}activeHint`)}</span>
                      {loaded?.isAdminDeactivated && (
                        <span className="block mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          {t("dashboard.addonLibrary.adminDeactivated")}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-6">
                <SectionTitle dot="bg-purple-500">{t(`${A}attributes`)}</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="addon-portion" className={SMALL_LABEL}>
                      {t(`${A}portion`)}
                    </label>
                    <input
                      id="addon-portion"
                      value={extras.portionSize}
                      onChange={(e) => setExtras({ portionSize: e.target.value })}
                      className={FIELD_INPUT}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="addon-serves" className={SMALL_LABEL}>
                      {t(`${A}serves`)}
                    </label>
                    <input
                      id="addon-serves"
                      type="number"
                      min={1}
                      value={extras.serves ?? ""}
                      onChange={(e) => setExtras({ serves: toOptionalInt(e.target.value) })}
                      className={FIELD_INPUT}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="addon-weight" className={SMALL_LABEL}>
                      {t(`${A}weight`)}
                    </label>
                    <input
                      id="addon-weight"
                      value={extras.weight}
                      onChange={(e) => setExtras({ weight: e.target.value })}
                      className={FIELD_INPUT}
                      placeholder="50g"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="addon-maxqty" className={SMALL_LABEL}>
                      {t(`${A}maxQty`)}
                    </label>
                    <input
                      id="addon-maxqty"
                      type="number"
                      min={1}
                      value={extras.maxQuantity ?? ""}
                      onChange={(e) => setExtras({ maxQuantity: toOptionalInt(e.target.value) })}
                      className={FIELD_INPUT}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className={`block ${FIELD_TITLE}`}>{t(`${A}consistency`)}</span>
                  <ChipGroup options={CONSISTENCY_LABELS} selected={extras.itemType} onToggle={(c) => toggle("itemType", c)} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="addon-frosting" className={`block ${FIELD_TITLE}`}>
                    {t(`${A}frosting`)}
                  </label>
                  <select
                    id="addon-frosting"
                    value={extras.isFrosting ?? ""}
                    onChange={(e) => setExtras({ isFrosting: e.target.value || undefined })}
                    className={FIELD_INPUT}
                  >
                    <option value="">{t(`${A}frostingPlaceholder`)}</option>
                    {Object.entries(FROSTING_LABELS).map(([code, labelKey]) => (
                      <option key={code} value={code}>
                        {t(labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 w-full">
                  <span className={`block ${FIELD_TITLE}`}>{t(`${A}spiceLevel`)}</span>
                  <SpiceLevelPicker value={extras.spiceLevel} onChange={(spiceLevel) => setExtras({ spiceLevel })} />
                </div>

                <div className="space-y-3">
                  <span className={`block ${FIELD_TITLE}`}>{t(`${A}nutrition.title`)}</span>
                  <div className="grid grid-cols-2 gap-4">
                    {(["calories", "protein", "carbs", "fats"] as const).map((field) => (
                      <div key={field} className="space-y-2">
                        <label htmlFor={`addon-${field}`} className={SMALL_LABEL}>
                          {t(`${A}nutrition.${field}`)}
                        </label>
                        <input
                          id={`addon-${field}`}
                          value={extras.nutrition[field]}
                          onChange={(e) => setNutrition(field, e.target.value)}
                          className={FIELD_INPUT}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
