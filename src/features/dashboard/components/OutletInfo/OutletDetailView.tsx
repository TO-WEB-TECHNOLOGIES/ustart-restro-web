import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, ArrowLeft, ExternalLink, FileText, Image as ImageIcon, IndianRupee, Loader2, Lock, MapPin,
  Pencil, ShieldCheck, Utensils,
} from "lucide-react";
import { ImagePreviewDialog } from "@/features/onboarding/components/common/ImagePreviewDialog";
import { getErrorMessage } from "@/utils/error";
import { useCuisineNames, useOutletDetail } from "../../hooks/useOutletInfo";
import { BankSection } from "./BankSection";
import { CommissionSection } from "./CommissionSection";
import { InfoField, InfoSection } from "./InfoSection";
import { INFO_PATH } from "./OutletCards";
import { PocSection } from "./PocSection";
import { StatusChip } from "./StatusChip";
import { formatAddress, formatRupees, isAwaitingApproval, mapsLink } from "./outletInfoFormat";

/**
 * 2026-11-12: one outlet on the Outlet Info page - status, location, commission plan, identity
 * documents, brand logo (brand-wide, read-only), images, cuisines, dietary/serving options and
 * limits, then contacts and bank accounts (each with its own add/edit).
 * Edit opens the full-page form; saving it sends the outlet for approval. Hidden while the outlet
 * is setup-locked (onboarding outlet of a pre-live brand), where the PATCH would reject the fields.
 * `showBack`: the card grid's detail route shows a back link; the single-outlet view doesn't.
 * 2026-11-12: the commission card is CommissionSection (with Change), and every image enlarges in
 * place (ImagePreviewDialog) instead of opening a new tab; a PDF licence still opens in a tab.
 */
interface OutletDetailViewProps {
  restroId: string;
  showBack?: boolean;
}

export const OutletDetailView = ({ restroId, showBack = false }: OutletDetailViewProps) => {
  const { t, i18n } = useTranslation();
  const k = "dashboard.outletInfo.";
  const detail = useOutletDetail(restroId);
  const cuisines = useCuisineNames();
  // The image being enlarged (one dialog for the page).
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const notSet = t(`${k}notSet`);

  if (detail.isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 text-secondary-orange animate-spin" /></div>;
  }
  if (detail.isError || !detail.data) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium text-red-500">{getErrorMessage(detail.error, t(`${k}loadFailed`))}</p>
        <button
          type="button"
          onClick={() => detail.refetch()}
          className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t(`${k}retry`)}
        </button>
      </div>
    );
  }

  const outlet = detail.data;
  const mapUrl = mapsLink(outlet.coordinates);
  const rupees = (value?: number) => formatRupees(value, i18n.language);
  const dietary = [
    outlet.isVegAvailable && t(`${k}fields.veg`),
    outlet.isNonVegAvailable && t(`${k}fields.nonVeg`),
    outlet.isEggAvailable && t(`${k}fields.egg`),
  ].filter(Boolean).join(", ");
  const serving = outlet.servingOptions === "BOTH"
    ? `${t(`${k}fields.delivery`)}, ${t(`${k}fields.dineIn`)}`
    : outlet.servingOptions === "DINE_IN" ? t(`${k}fields.dineIn`) : t(`${k}fields.delivery`);
  const cuisineNames = (outlet.cuisineIds ?? [])
    .map((id) => cuisines.data?.get(id))
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {showBack && (
        <Link to={INFO_PATH} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-secondary-orange">
          <ArrowLeft className="w-4 h-4" />
          {t(`${k}back`)}
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {outlet.primaryImage && (
            <button type="button" onClick={() => setPreview({ url: outlet.primaryImage!, title: outlet.restroName })} className="shrink-0 cursor-zoom-in" aria-label={t(`${k}images.enlarge`, { name: outlet.restroName })}>
              <img src={outlet.primaryImage} alt="" className="size-16 rounded-2xl object-cover" />
            </button>
          )}
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#1a2b4b] dark:text-white truncate">{outlet.restroName}</h1>
            <StatusChip status={outlet.status} />
          </div>
        </div>
        {outlet.isSetupLocked ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500" title={t(`${k}lockedHint`)}>
            <Lock className="w-3.5 h-3.5" />
            {t(`${k}locked`)}
          </span>
        ) : (
          <Link
            to={`${INFO_PATH}/${outlet.restroId}/edit`}
            className="h-11 px-5 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold shadow-lg shadow-secondary-orange/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Pencil className="w-4 h-4" />
            {t(`${k}edit`)}
          </Link>
        )}
      </div>

      {isAwaitingApproval(outlet.status) && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {t(`${k}pendingNotice`)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoSection icon={MapPin} title={t(`${k}sections.location`)}>
          <InfoField label={t(`${k}fields.address`)} value={formatAddress(outlet.address)} fallback={notSet} />
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary-orange hover:underline">
              <ExternalLink className="w-4 h-4" />
              {t(`${k}viewOnMap`)}
            </a>
          )}
        </InfoSection>

        <CommissionSection />

        <InfoSection icon={ShieldCheck} title={t(`${k}sections.identity`)}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label={t(`${k}fields.pan`)} value={outlet.panNumber} fallback={notSet} />
            <InfoField label={t(`${k}fields.gst`)} value={outlet.gstNumber} fallback={notSet} />
            <InfoField label={t(`${k}fields.fssaiNumber`)} value={outlet.fssaiNumber} fallback={notSet} />
            <InfoField
              label={t(`${k}fields.fssaiExpiry`)}
              value={outlet.fssaiExpiryDate
                ? new Date(`${outlet.fssaiExpiryDate}T00:00:00`).toLocaleDateString(i18n.language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" })
                : null}
              fallback={notSet}
            />
          </div>
          {outlet.fssaiLicenseImage && (isPdfUrl(outlet.fssaiLicenseImage) ? (
            <a href={outlet.fssaiLicenseImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary-orange hover:underline">
              <FileText className="w-4 h-4" />
              {t(`${k}fields.viewFssai`)}
            </a>
          ) : (
            <button type="button" onClick={() => setPreview({ url: outlet.fssaiLicenseImage!, title: t(`${k}fields.fssaiNumber`) })} className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary-orange hover:underline">
              <FileText className="w-4 h-4" />
              {t(`${k}fields.viewFssai`)}
            </button>
          ))}
        </InfoSection>

        <InfoSection icon={IndianRupee} title={t(`${k}limits.title`)}>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label={t(`${k}limits.minOrderValue`)} value={rupees(outlet.minOrderValue)} fallback={notSet} />
            <InfoField label={t(`${k}limits.maxOrderValue`)} value={rupees(outlet.maxOrderValue)} fallback={notSet} />
            <InfoField label={t(`${k}limits.minCodValue`)} value={rupees(outlet.minCodValue)} fallback={notSet} />
            <InfoField label={t(`${k}limits.maxCodValue`)} value={rupees(outlet.maxCodValue)} fallback={notSet} />
          </div>
        </InfoSection>

        <InfoSection icon={Utensils} title={t(`${k}sections.food`)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InfoField label={t(`${k}fields.cuisines`)} value={cuisineNames} fallback={cuisines.isLoading ? "…" : notSet} />
            </div>
            <InfoField label={t(`${k}fields.dietary`)} value={dietary} fallback={notSet} />
            <InfoField label={t(`${k}fields.serving`)} value={serving} fallback={notSet} />
            <InfoField
              label={t(`${k}fields.deliveryBy`)}
              value={outlet.isDeliveryViaUSTART ? t(`${k}fields.deliveryUstart`) : t(`${k}fields.deliveryOwn`)}
              fallback={notSet}
            />
            <InfoField label={t(`${k}fields.pos`)} value={outlet.usesPos ? outlet.posProvider : t(`${k}fields.noPos`)} fallback={notSet} />
          </div>
        </InfoSection>

        <InfoSection icon={ImageIcon} title={t(`${k}sections.images`)}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 space-y-1.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t(`${k}fields.brandLogo`)}</p>
              {outlet.brandLogo ? (
                <button type="button" onClick={() => setPreview({ url: outlet.brandLogo!, title: t(`${k}fields.brandLogo`) })} className="cursor-zoom-in" aria-label={t(`${k}images.enlarge`, { name: t(`${k}fields.brandLogo`) })}>
                  <img src={outlet.brandLogo} alt="" className="size-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800" />
                </button>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">{notSet}</p>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[8rem]">{t(`${k}fields.brandWide`)}</p>
            </div>
            <ImageStrip label={t(`${k}fields.menuImages`)} images={outlet.deliveryMenuImages} fallback={notSet} onOpen={setPreview} />
          </div>
          {(outlet.diningMenuImages?.length ?? 0) > 0 && (
            <ImageStrip label={t(`${k}fields.diningMenuImages`)} images={outlet.diningMenuImages} fallback={notSet} onOpen={setPreview} />
          )}
        </InfoSection>
      </div>

      <PocSection restroId={outlet.restroId} />
      <BankSection restroId={outlet.restroId} isActive={outlet.status === "ACTIVE"} />

      <ImagePreviewDialog url={preview?.url ?? null} title={preview?.title ?? ""} onClose={() => setPreview(null)} />
    </div>
  );
};

/** An existing document URL (presigned) points at a PDF: judged by the path, not the query string. */
const isPdfUrl = (url: string) => url.split("?")[0].toLowerCase().endsWith(".pdf");

/** A row of image thumbnails; clicking one enlarges it (2026-11-12, was a new tab). */
const ImageStrip = ({ label, images, fallback, onOpen }: {
  label: string;
  images?: string[];
  fallback: string;
  onOpen: (image: { url: string; title: string }) => void;
}) => (
  <div className="min-w-0 flex-1 space-y-1.5">
    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
    {(images?.length ?? 0) === 0 ? (
      <p className="text-sm text-slate-400 dark:text-slate-500">{fallback}</p>
    ) : (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images!.map((src, i) => (
          <button key={i} type="button" onClick={() => onOpen({ url: src, title: `${label} ${i + 1}` })} className="shrink-0 cursor-zoom-in" aria-label={`${label} ${i + 1}`}>
            <img src={src} alt="" loading="lazy" className="size-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800" />
          </button>
        ))}
      </div>
    )}
  </div>
);
