import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { multimediaService, type RequirementType } from "@/api/multimediaService";
import { getErrorMessage } from "@/utils/error";
import { CroppedImageUpload } from "@/features/onboarding/components/common/CroppedImageUpload";
import { DocumentFileBox } from "@/features/onboarding/components/common/DocumentFileBox";
import type { BrandDetail, BrandUpdate } from "../../api/outletInfoApi";
import { useSaveBrand } from "../../hooks/useOutletInfo";
import { AllOutletsConfirmDialog } from "../MenuEditor/AllOutletsConfirmDialog";
import { FormField } from "./FormField";
import { brandFormDefaults, changedText, createBrandSchema, type BrandFormValues } from "./brandForm";

/**
 * 2026-11-12: Brand Details edit (inline in the section, brand-level logins only).
 * - Image boxes show the current logo / cover photo; a click picks a new one and crops it (logo 1:1,
 *   cover 16:9); the FSSAI box takes an image or PDF (no crop).
 * - Only changed fields are sent; new images are uploaded first (brand_logo, brand_primary_image,
 *   restaurant_fssai) and sent as keys. Nothing changed → nothing sent.
 * - A live brand's save sends it for approval and takes every outlet offline until approved (user
 *   decision), so it's confirmed first; the saved brand replaces the cache at once.
 */
interface BrandEditFormProps {
  brand: BrandDetail;
  onDone: () => void;
}

const IMAGE_UPLOADS: { field: "brandLogo" | "primaryImage" | "fssaiLicenseImage"; type: RequirementType }[] = [
  { field: "brandLogo", type: "brand_logo" },
  { field: "primaryImage", type: "brand_primary_image" },
  { field: "fssaiLicenseImage", type: "restaurant_fssai" },
];

export const BrandEditForm = ({ brand, onDone }: BrandEditFormProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.brand.";
  const save = useSaveBrand();
  const schema = useMemo(() => createBrandSchema(t), [t]);
  const [pending, setPending] = useState<BrandFormValues | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { register, control, handleSubmit, formState: { errors } } = useForm<BrandFormValues>({
    resolver: zodResolver(schema),
    defaultValues: brandFormDefaults(brand),
  });
  const busy = isUploading || save.isPending;

  const hasChanges = (values: BrandFormValues) =>
    Object.keys(changedText(values, brand)).length > 0
    || IMAGE_UPLOADS.some(({ field }) => values[field] instanceof File);

  const send = async (values: BrandFormValues) => {
    try {
      const update: BrandUpdate = changedText(values, brand);
      setIsUploading(true);
      for (const { field, type } of IMAGE_UPLOADS) {
        const value = values[field];
        if (value instanceof File) update[field] = (await multimediaService.uploadRestaurantDoc(value, type)).key;
      }
      setIsUploading(false);
      const saved = await save.mutateAsync(update);
      toast.success(t(saved.status === "UPDATE_APPROVAL_PENDING" ? `${k}sentForApproval` : `${k}saved`));
      setPending(null);
      onDone();
    } catch (error) {
      setIsUploading(false);
      setPending(null);
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  // Nothing changed: close without a request. A live brand: confirm (it goes offline). Otherwise save.
  const submit = (values: BrandFormValues) => {
    if (!hasChanges(values)) {
      toast.info(t(`${k}noChanges`));
      onDone();
    } else if (brand.status === "ACTIVE") {
      setPending(values);
    } else {
      void send(values);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          control={control}
          name="brandLogo"
          render={({ field }) => (
            <CroppedImageUpload
              value={field.value}
              onChange={(file) => field.onChange(file)}
              aspect={1}
              required={false}
              maxFileSizeMb={1}
              label={t(`${k}logo`)}
              uploadText={t(`${k}uploadLogo`)}
              uploadSubtext={t(`${k}logoSpecs`)}
            />
          )}
        />
        <Controller
          control={control}
          name="primaryImage"
          render={({ field }) => (
            <CroppedImageUpload
              value={field.value}
              onChange={(file) => field.onChange(file)}
              aspect={16 / 9}
              required={false}
              maxFileSizeMb={1}
              label={t(`${k}cover`)}
              uploadText={t(`${k}uploadCover`)}
              uploadSubtext={t(`${k}coverSpecs`)}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="brand-name" label={t(`${k}fields.brandName`)} error={errors.brandName?.message} {...register("brandName")} />
        <FormField id="brand-company" label={t(`${k}fields.companyName`)} error={errors.companyName?.message} {...register("companyName")} />
        <FormField id="brand-pan" maxLength={10} className="uppercase" label={t(`${k}fields.pan`)} error={errors.panNumber?.message} {...register("panNumber")} />
        <FormField id="brand-gst" maxLength={15} className="uppercase" label={t(`${k}fields.gst`)} error={errors.gstNumber?.message} {...register("gstNumber")} />
        <FormField id="brand-cin" maxLength={21} className="uppercase" label={t(`${k}fields.cin`)} error={errors.cinNumber?.message} {...register("cinNumber")} />
        <FormField id="brand-fssai" inputMode="numeric" maxLength={14} label={t(`${k}fields.fssaiNumber`)} error={errors.fssaiNumber?.message} {...register("fssaiNumber")} />
        <FormField id="brand-fssai-expiry" type="date" label={t(`${k}fields.fssaiExpiry`)} error={errors.fssaiExpiryDate?.message} {...register("fssaiExpiryDate")} />
        <div className="sm:col-span-2">
          <FormField id="brand-description" maxLength={500} label={t(`${k}fields.description`)} error={errors.description?.message} {...register("description")} />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{t(`${k}fields.address`)}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="brand-addr-1" label={t(`${k}address.line1`)} error={errors.address?.line1?.message} {...register("address.line1")} />
          <FormField id="brand-addr-2" label={t(`${k}address.line2`)} {...register("address.line2")} />
          <FormField id="brand-addr-landmark" label={t(`${k}address.landmark`)} {...register("address.landmark")} />
          <FormField id="brand-addr-city" label={t(`${k}address.city`)} error={errors.address?.locality?.message} {...register("address.locality")} />
          <FormField id="brand-addr-state" label={t(`${k}address.state`)} error={errors.address?.state?.message} {...register("address.state")} />
          <FormField id="brand-addr-pin" inputMode="numeric" maxLength={6} label={t(`${k}address.pincode`)} error={errors.address?.pincode?.message} {...register("address.pincode")} />
        </div>
      </fieldset>

      <Controller
        control={control}
        name="fssaiLicenseImage"
        render={({ field }) => (
          <DocumentFileBox
            value={field.value}
            onChange={(file) => field.onChange(file)}
            required={false}
            label={t(`${k}fields.fssaiDocument`)}
            emptyText={t(`${k}uploadFssai`)}
          />
        )}
      />

      {brand.status === "ACTIVE" && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3">
          {t(`${k}approvalNote`, { count: brand.outletCount ?? 0 })}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onDone}
          className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {t(`${k}cancel`)}
        </button>
        <button
          type="submit"
          disabled={busy}
          className="h-11 px-6 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {t(`${k}save`)}
        </button>
      </div>

      <AllOutletsConfirmDialog
        open={pending !== null}
        isLoading={busy}
        title={t(`${k}confirmTitle`)}
        description={t(`${k}confirmText`, { count: brand.outletCount ?? 0 })}
        confirmLabel={t(`${k}confirm`)}
        cancelLabel={t(`${k}keepEditing`)}
        onConfirm={() => pending && send(pending)}
        onClose={() => setPending(null)}
      />
    </form>
  );
};
