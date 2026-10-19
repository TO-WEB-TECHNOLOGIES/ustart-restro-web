import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { agreementService } from "../../api/agreementService";
import { AgreementDocument, type AgreementTemplate } from "./AgreementDocument";
import type { BankDetailsValues } from "../../schemas";

interface AgreementViewProps {
  documents: Partial<BankDetailsValues>;
  isSubmitting: boolean;
  progressText: string;
  onBack: () => void;
  onSubmit: (agreement: { signeeName: string; agreedToPromotionalEmails: boolean; agreementFile: File }) => void;
}

const AGREEMENT_FILE_NAME = "USTART-Partner-Agreement.pdf";

/**
 * Final onboarding sub-stage: review the filled partner agreement (rendered as an actual PDF)
 * and e-sign it. No backend calls happen from this component directly - it hands the parent
 * (AboutRestaurant.tsx) the typed signature name, marketing-consent choice, and the generated
 * signed PDF File, and the parent runs the existing initiateOnboarding/uploadFile/
 * completeOnboarding flow with those included.
 */
export const AgreementView = ({ documents, isSubmitting, progressText, onBack, onSubmit }: AgreementViewProps) => {
  const { t } = useTranslation();
  const { personalInfo, restaurantInfo } = useOnboardingStore();

  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signeeName, setSigneeName] = useState("");
  // Pre-checked per the agreed marketing-consent copy - still recorded either way, not just
  // assumed, since an opt-out should be respected/tracked.
  const [agreedToPromotionalEmails, setAgreedToPromotionalEmails] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    agreementService
      .getAgreementTemplate()
      .then(setTemplate)
      .catch((err) => {
        console.error("Failed to load agreement template", err);
        toast.error(t("onboarding.restaurant.agreement.loadError"));
      })
      .finally(() => setIsLoadingTemplate(false));
  }, [t]);

  // Memoized so typing in signeeName / toggling the checkboxes below (local state changes that
  // re-render this whole component) don't hand PDFViewer a new element identity every keystroke
  // - PDFViewer regenerates the entire multi-page PDF blob whenever its child element changes,
  // which was making every page re-render on each character typed. None of the unsigned live
  // preview's actual content depends on signeeName/hasAgreed/agreedToPromotionalEmails, so they're
  // deliberately excluded from the dependency list.
  const previewDocument = useMemo(
    () =>
      template ? (
        <AgreementDocument
          template={template}
          restaurantInfo={restaurantInfo}
          personalInfo={personalInfo}
          documents={documents}
        />
      ) : null,
    [template, restaurantInfo, personalInfo, documents],
  );

  const handleDownloadPreview = async () => {
    if (!template) return;
    try {
      const blob = await pdf(
        <AgreementDocument
          template={template}
          restaurantInfo={restaurantInfo}
          personalInfo={personalInfo}
          documents={documents}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = AGREEMENT_FILE_NAME;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate preview PDF", err);
      toast.error(t("onboarding.restaurant.agreement.loadError"));
    }
  };

  const canSubmit = hasAgreed && signeeName.trim().length > 0 && !!template;

  const handleAgreeAndSubmit = async () => {
    if (!canSubmit || !template) return;
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <AgreementDocument
          template={template}
          restaurantInfo={restaurantInfo}
          personalInfo={personalInfo}
          documents={documents}
          signature={{ name: signeeName.trim() }}
        />,
      ).toBlob();
      const file = new File([blob], AGREEMENT_FILE_NAME, { type: "application/pdf" });
      onSubmit({ signeeName: signeeName.trim(), agreedToPromotionalEmails, agreementFile: file });
    } catch (err) {
      console.error("Failed to generate signed agreement PDF", err);
      toast.error(t("onboarding.restaurant.agreement.generateError"));
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-orange" />
        <p className="text-slate-500 font-medium">{t("onboarding.restaurant.agreement.loading")}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500 font-medium">{t("onboarding.restaurant.agreement.loadError")}</p>
        <Button type="button" variant="outline" onClick={onBack}>
          {t("onboarding.restaurant.form.goBack")}
        </Button>
      </div>
    );
  }

  const busy = isGenerating || isSubmitting;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="relative">
        <PDFViewer style={{ width: "100%", height: "500px", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          {/* previewDocument is guaranteed non-null here - the !template early return above
              already handled the null case. */}
          {previewDocument!}
        </PDFViewer>
        {/* PDFViewer already embeds the browser's native PDF-reader chrome (its own download/
            print controls) - this button is a plain fallback for browsers without a native PDF
            plugin, overlaid the same way a reader's own toolbar would sit. */}
        <button
          type="button"
          onClick={handleDownloadPreview}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 border border-slate-200 shadow-sm text-xs font-medium text-slate-700 hover:bg-white"
        >
          <Download className="w-3.5 h-3.5" />
          {t("onboarding.restaurant.agreement.download")}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <input
            type="checkbox"
            id="hasAgreed"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 shrink-0 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
          />
          <label htmlFor="hasAgreed" className="text-xs leading-relaxed text-slate-600 cursor-pointer select-none">
            {t("onboarding.restaurant.agreement.esignLabel")}
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="signeeName" className="font-semibold text-slate-700 text-sm">
            {t("onboarding.restaurant.agreement.nameLabel")}
          </label>
          <input
            id="signeeName"
            type="text"
            value={signeeName}
            onChange={(e) => setSigneeName(e.target.value)}
            placeholder={t("onboarding.restaurant.agreement.namePlaceholder")}
            className="w-full h-12 px-4 bg-background-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-orange/20"
          />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <input
            type="checkbox"
            id="agreedToPromotionalEmails"
            checked={agreedToPromotionalEmails}
            onChange={(e) => setAgreedToPromotionalEmails(e.target.checked)}
            className="mt-1 w-4 h-4 shrink-0 text-secondary-orange focus:ring-secondary-orange rounded border-slate-300 accent-secondary-orange cursor-pointer"
          />
          <label htmlFor="agreedToPromotionalEmails" className="text-xs leading-relaxed text-slate-600 cursor-pointer select-none">
            {t("onboarding.restaurant.agreement.marketingConsentLabel")}
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleAgreeAndSubmit}
          disabled={!canSubmit || busy}
          className="w-full h-12 bg-secondary-orange hover:bg-secondary-orange/90 text-background-white font-bold text-lg rounded-xl shadow-lg shadow-secondary-orange/20 transition-all gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <div className="w-5 h-5 border-2 border-background-white/30 border-t-background-white rounded-full animate-spin" />
              {progressText || t("onboarding.restaurant.agreement.generating")}
            </>
          ) : (
            t("onboarding.restaurant.agreement.submitButton")
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy} className="w-full text-slate-500 hover:text-slate-700">
          ← {t("onboarding.restaurant.form.goBack")}
        </Button>
      </div>
    </div>
  );
};
