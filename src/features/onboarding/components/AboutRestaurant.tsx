import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { bankDetailsSchema, type BankDetailsValues } from "../schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/required-mark";

import { onboardingService } from "../api/onboardingService";
import { toast } from "sonner";
import { CloudUpload, CheckCircle2, User, Store, MapPin } from "lucide-react";
import type {
  OnboardingData,
  RestaurantInfo,
  AboutRestaurant as OnboardingAboutRestaurant,
  OnboardingDocuments,
} from "@/types/onboardingTypes";
import { getErrorMessage } from "@/utils/error";
import { FileDisplay } from "./common/FileDisplay";
import { AgreementView } from "./common/AgreementView";

export const AboutRestaurant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    aboutRestaurant,
    setCurrentStep,
    documents,
    setDocuments,
    personalInfo,
    restaurantInfo,
    reset,
    isEditing,
    initialData,
  } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressText, setProgressText] = useState("");

  // "documents" = existing FSSAI+bank form (now also FSSAI Number/Expiry). "agreement" = the
  // partner-agreement PDF review + e-sign step, gated behind the "verified" checkbox below -
  // no backend calls happen until the agreement is actually signed and submitted.
  const [view, setView] = useState<"documents" | "agreement">("documents");
  const [hasVerifiedDetails, setHasVerifiedDetails] = useState(false);

  // --- Documents (FSSAI, Bank) ---
  const {
    register: registerDocs,
    handleSubmit: handleSubmitDocs,
    watch: watchDocs,
    setValue: setValueDocs,
    formState: { errors: errorsDocs },
  } = useForm<BankDetailsValues>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: documents,
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

  // Validates + saves the bank/FSSAI form, then moves to the agreement view instead of
  // submitting to the backend directly - submission now only happens after the agreement is
  // e-signed (see onSubmitDocuments below, now invoked from the agreement view).
  const onDocumentsValidated = (data: BankDetailsValues) => {
    setDocuments(data);
    setView("agreement");
  };

  const onSubmitDocuments = async (
    data: BankDetailsValues,
    agreement: { signeeName: string; agreedToPromotionalEmails: boolean; agreementFile: File },
  ) => {
    setIsSubmitting(true);
    setProgressText(t("Submitting details..."));
    try {
      setDocuments(data);

      // Helper to get filename or preserve string (if it's already a filename from prev session)
      const getFileName = (file: File | string | undefined) => {
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
        restaurantInfo: {
          panNumber: restaurantInfo.panNumber,
          gstNumber: restaurantInfo.gstNumber?.trim() || null,
          registeredAddress: restaurantInfo.registeredAddress,
          restaurantName: restaurantInfo.restaurantName,
          hasMultipleBranches: restaurantInfo.hasMultipleBranches,
          companyName: restaurantInfo.companyName || undefined,
          usesPos: restaurantInfo.usesPos,
          posProvider: restaurantInfo.usesPos ? restaurantInfo.posProvider : undefined,
          // No Restaurant is created at onboarding time for a multi-branch brand - nothing to
          // send here then (see RestaurantOnboardingServiceImpl.completeOnboarding).
          restaurantAddress: restaurantInfo.hasMultipleBranches ? undefined : restaurantInfo.restaurantAddress,
          location: restaurantInfo.hasMultipleBranches ? undefined : restaurantInfo.location,
        } as RestaurantInfo,
        aboutRestaurant: {
          ...aboutRestaurant,
          menuImages: aboutRestaurant.menuImages?.map(getFileName) || [],
          // Was previously spread through untransformed - File objects don't serialize
          // meaningfully over JSON, and nothing queued them for upload below either.
          diningMenuImages: aboutRestaurant.diningMenuImages?.map(getFileName) || [],
          // 2026-10-20: outlet image always; logo only for multi-branch. undefined (not "") when
          // absent, or the backend would mint a presigned URL for an empty name.
          dishImage: aboutRestaurant.dishImage ? getFileName(aboutRestaurant.dishImage) : undefined,
          brandLogo: restaurantInfo.hasMultipleBranches && aboutRestaurant.brandLogo
            ? getFileName(aboutRestaurant.brandLogo) : undefined,
          cuisines: aboutRestaurant.cuisines || [],
        } as unknown as OnboardingAboutRestaurant,
        documents: {
          ...data,
          fssaiDocument: getFileName(data.fssaiDocument),
          agreementDocument: getFileName(agreement.agreementFile),
          signeeName: agreement.signeeName,
          agreedToPromotionalEmails: agreement.agreedToPromotionalEmails,
        } as OnboardingDocuments,
      };

      // 2. Differencing logic for Partial Updates
      const getChangedFields = (
        current: Record<string, unknown>,
        original: Record<string, unknown>,
      ): Record<string, unknown> => {
        if (!original) return current;
        const changes: Record<string, unknown> = {};

        // Normalize helper for comparison
        const normalize = (v: unknown) => {
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
            const nestedChanges = getChangedFields(
              val as Record<string, unknown>,
              (origVal as Record<string, unknown>) || {},
            );
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
        ? getChangedFields(
            fullPayload as unknown as Record<string, unknown>,
            initialData as unknown as Record<string, unknown>,
          )
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

      // Signed partner agreement PDF
      queueUpload(presignedUrls.agreementDocument, agreement.agreementFile);

      // Outlet image (single-branch) / brand logo (multi-branch) - only one has a URL.
      queueUpload(presignedUrls.dishImage, aboutRestaurant.dishImage);
      queueUpload(presignedUrls.brandLogo, aboutRestaurant.brandLogo);

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

      // Dining Menu Images - same shape as Menu Images above
      if (
        aboutRestaurant.diningMenuImages &&
        Array.isArray(aboutRestaurant.diningMenuImages) &&
        presignedUrls.diningMenuImages
      ) {
        aboutRestaurant.diningMenuImages.forEach((file, index) => {
          queueUpload(presignedUrls.diningMenuImages[index], file);
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
        // Success - refresh the session with the updated access token (brandId,
        // status, etc. now populated). No refreshToken anymore - the original
        // login's refresh-token family stays untouched and keeps working.
        login(response.accessToken);
      }

      // 5. Success
      reset();
      setCurrentStep(4);
      navigate("/grow-with-ustart/verification");
    } catch (error) {
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
          {view === "documents"
            ? t("onboarding.restaurant.documents.title")
            : t("onboarding.restaurant.agreement.title")}
        </h2>
        <p className="md:text-2xl text-slate-500 mt-2">
          {view === "documents"
            ? t("onboarding.restaurant.documents.subtitle")
            : t("onboarding.restaurant.agreement.subtitle")}
        </p>
      </div>

      <div className="py-8 flex-grow overflow-y-auto px-1">
        {view === "documents" ? (
        <form
            id="documents-form"
            onSubmit={handleSubmitDocs(onDocumentsValidated)}
            className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300"
          >
            {/* FSSAI Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-slate-800">
                  {t("onboarding.restaurant.documents.fssaiLabel")}<RequiredMark />
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
                        setValueDocs("fssaiDocument", undefined as unknown as File);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fssaiNumber" className="font-semibold text-slate-700">
                    {t("onboarding.restaurant.documents.fssaiNumberLabel")}<RequiredMark />
                  </Label>
                  <Input
                    id="fssaiNumber"
                    {...registerDocs("fssaiNumber")}
                    className="h-12 bg-background-white border-slate-200"
                    placeholder={t("onboarding.restaurant.documents.fssaiNumberPlaceholder")}
                  />
                  {errorsDocs.fssaiNumber && (
                    <p className="text-red-500 text-xs">{errorsDocs.fssaiNumber.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fssaiExpiryDate" className="font-semibold text-slate-700">
                    {t("onboarding.restaurant.documents.fssaiExpiryDateLabel")}<RequiredMark />
                  </Label>
                  <Input
                    id="fssaiExpiryDate"
                    type="date"
                    {...registerDocs("fssaiExpiryDate")}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    className="h-12 bg-background-white border-slate-200"
                  />
                  {errorsDocs.fssaiExpiryDate && (
                    <p className="text-red-500 text-xs">{errorsDocs.fssaiExpiryDate.message}</p>
                  )}
                </div>
              </div>
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
                    {t("onboarding.restaurant.documents.accountNumberLabel")}<RequiredMark />
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
                    {t("onboarding.restaurant.documents.ifscLabel")}<RequiredMark />
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
                    {t("onboarding.restaurant.documents.holderNameLabel")}<RequiredMark />
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
                    {t("onboarding.restaurant.documents.bankNameLabel")}<RequiredMark />
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
                    {t("onboarding.restaurant.documents.branchNameLabel")}<RequiredMark />
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
        ) : (
          <AgreementView
            documents={watchDocs()}
            isSubmitting={isSubmitting}
            progressText={progressText}
            onBack={() => setView("documents")}
            onSubmit={(agreement) => onSubmitDocuments(watchDocs(), agreement)}
          />
        )}
      </div>

      {view === "documents" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="hasVerifiedDetails"
              checked={hasVerifiedDetails}
              onChange={(e) => setHasVerifiedDetails(e.target.checked)}
              className="mt-1 w-4 h-4 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
            />
            <label htmlFor="hasVerifiedDetails" className="text-sm text-slate-600 cursor-pointer select-none">
              {t("onboarding.restaurant.documents.verifiedDetailsLabel")}
            </label>
          </div>
          <Button
            type="submit"
            form="documents-form"
            disabled={!hasVerifiedDetails}
            className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("onboarding.restaurant.documents.verifyButton")}
            <CheckCircle2 className="w-5 h-5" />
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
      )}
    </div>
  );
};
