import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Building2, FileText, Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/error";
import { ImagePreviewDialog } from "@/features/onboarding/components/common/ImagePreviewDialog";
import { useBrandDetail } from "../../hooks/useOutletInfo";
import { BrandEditForm } from "./BrandEditForm";
import { BankSection } from "./BankSection";
import { CommissionSection } from "./CommissionSection";
import { PeopleSection } from "./PeopleSection";
import { InfoField, InfoSection } from "./InfoSection";
import { StatusChip } from "./StatusChip";
import { formatAddress } from "./outletInfoFormat";

/**
 * 2026-11-12: Brand Details above the outlet cards ("All Locations"). View: logo and cover photo
 * (click to enlarge), names, registration numbers, address, description, FSSAI, status and outlet
 * count, plus the commission plan (one plan for every outlet, with Change). Brand-level logins get
 * Edit, which swaps the view for BrandEditForm in the same card. While an edit waits for approval a
 * notice says all outlets are offline.
 */
export const BrandDetailsSection = () => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletInfo.brand.";
  const { user } = useAuth();
  const brand = useBrandDetail();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const notSet = t("dashboard.outletInfo.notSet");
  const isBrandUser = !user?.restroId;

  if (brand.isLoading) {
    return <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>;
  }
  if (brand.isError || !brand.data) {
    return <p className="text-sm text-red-500">{getErrorMessage(brand.error, t(`${k}loadFailed`))}</p>;
  }
  const b = brand.data;
  const pdfFssai = !!b.fssaiLicenseImage && b.fssaiLicenseImage.split("?")[0].toLowerCase().endsWith(".pdf");
  const expiry = b.fssaiExpiryDate
    ? new Date(`${b.fssaiExpiryDate}T00:00:00`).toLocaleDateString(i18n.language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      <InfoSection
        icon={Building2}
        title={t(`${k}title`)}
        action={!editing && isBrandUser && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t(`${k}edit`)}
          </button>
        )}
      >
        {b.status === "UPDATE_APPROVAL_PENDING" && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {t(`${k}pendingNotice`)}
          </div>
        )}

        {editing ? (
          <BrandEditForm brand={b} onDone={() => setEditing(false)} />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-4">
              {b.primaryImage && (
                <button type="button" onClick={() => setPreview({ url: b.primaryImage!, title: t(`${k}cover`) })} className="sm:w-64 shrink-0 cursor-zoom-in" aria-label={t("dashboard.outletInfo.images.enlarge", { name: t(`${k}cover`) })}>
                  <img src={b.primaryImage} alt="" className="w-full aspect-video rounded-2xl object-cover border border-slate-100 dark:border-slate-800" />
                </button>
              )}
              <div className="flex items-center gap-4 min-w-0">
                {b.brandLogo && (
                  <button type="button" onClick={() => setPreview({ url: b.brandLogo!, title: t(`${k}logo`) })} className="shrink-0 cursor-zoom-in" aria-label={t("dashboard.outletInfo.images.enlarge", { name: t(`${k}logo`) })}>
                    <img src={b.brandLogo} alt="" className="size-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800" />
                  </button>
                )}
                <div className="min-w-0 space-y-1.5">
                  <p className="text-xl font-bold text-[#1a2b4b] dark:text-white truncate">{b.brandName || notSet}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={b.status} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t(`${k}outlets`, { count: b.outletCount ?? 0 })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoField label={t(`${k}fields.companyName`)} value={b.companyName} fallback={notSet} />
              <InfoField label={t(`${k}fields.pan`)} value={b.panNumber} fallback={notSet} />
              <InfoField label={t(`${k}fields.gst`)} value={b.gstNumber} fallback={notSet} />
              <InfoField label={t(`${k}fields.cin`)} value={b.cinNumber} fallback={notSet} />
              <InfoField label={t(`${k}fields.fssaiNumber`)} value={b.fssaiNumber} fallback={notSet} />
              <InfoField label={t(`${k}fields.fssaiExpiry`)} value={expiry} fallback={notSet} />
              <div className="col-span-2">
                <InfoField label={t(`${k}fields.address`)} value={formatAddress(b.address)} fallback={notSet} />
              </div>
              <div className="col-span-2 lg:col-span-4">
                <InfoField label={t(`${k}fields.description`)} value={b.description} fallback={notSet} />
              </div>
            </div>
            {b.fssaiLicenseImage && (pdfFssai ? (
              <a href={b.fssaiLicenseImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary-orange hover:underline">
                <FileText className="w-4 h-4" />
                {t("dashboard.outletInfo.fields.viewFssai")}
              </a>
            ) : (
              <button type="button" onClick={() => setPreview({ url: b.fssaiLicenseImage!, title: t(`${k}fields.fssaiDocument`) })} className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary-orange hover:underline">
                <FileText className="w-4 h-4" />
                {t("dashboard.outletInfo.fields.viewFssai")}
              </button>
            ))}
          </div>
        )}
      </InfoSection>

      <CommissionSection />
      {/* 2026-11-12 (user request): the brand's managers, POCs and bank accounts - editable by
          brand-level logins (a PRIMARY account change sends the brand for approval). */}
      <PeopleSection scope={{ kind: "brand" }} />
      <BankSection scope={{ kind: "brand" }} isActive={b.status === "ACTIVE"} canEdit={isBrandUser} />

      <ImagePreviewDialog url={preview?.url ?? null} title={preview?.title ?? ""} onClose={() => setPreview(null)} />
    </div>
  );
};
