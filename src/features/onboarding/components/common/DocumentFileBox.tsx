import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/required-mark";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

/**
 * 2026-11-12: one document upload box (FSSAI licence: image or PDF) that shows what's there now.
 * - Image (new File or existing URL): a thumbnail; click enlarges it.
 * - PDF: an icon and a clean file name (an existing presigned URL's query string stripped), with
 *   "View" opening it in a new tab.
 * - "Change" / the empty box picks a new file. No crop - it's a document, cropping could cut text.
 * Replaces AddRestaurantForm's FSSAI row (which showed the presigned URL's query string as the
 * name) and is reused by Brand Details.
 */
interface DocumentFileBoxProps {
  value: File | string | undefined | null;
  onChange: (file: File) => void;
  label: string;
  emptyText: string;
  required?: boolean;
  accept?: string;
  maxFileSizeMb?: number;
  error?: string;
}

/** Path part of a URL (or the key itself), without the query string. */
const pathOf = (value: string) => value.split("?")[0];
const isPdf = (value: File | string) =>
  value instanceof File ? value.type === "application/pdf" : pathOf(value).toLowerCase().endsWith(".pdf");

export const DocumentFileBox = ({
  value,
  onChange,
  label,
  emptyText,
  required = true,
  accept = "image/*,.pdf",
  maxFileSizeMb = 5,
  error,
}: DocumentFileBoxProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // A File gets an object URL (revoked on change); an existing value is used as its URL.
  const url = useMemo(
    () => (value instanceof File ? URL.createObjectURL(value) : value || null),
    [value],
  );
  useEffect(() => () => { if (value instanceof File && url) URL.revokeObjectURL(url); }, [value, url]);

  const name = value instanceof File ? value.name : value ? decodeURIComponent(pathOf(value).split("/").pop() ?? "") : "";
  const pdf = !!value && isPdf(value);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      toast.error(t("onboarding.restaurant.complete.setupForm.fileTooLarge", { name: file.name, size: maxFileSizeMb }));
      return;
    }
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <Label className="font-semibold text-slate-700 dark:text-zinc-200">
        {label}
        {required && <RequiredMark />}
      </Label>
      <input type="file" ref={inputRef} onChange={handleFile} accept={accept} className="hidden" />
      {value && url ? (
        <div className="flex items-center gap-4 p-3 border border-green-200 dark:border-green-900/50 rounded-xl bg-green-50/50 dark:bg-green-900/10">
          {pdf ? (
            <div className="size-14 shrink-0 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          ) : (
            <button type="button" onClick={() => setPreviewOpen(true)} className="shrink-0 cursor-zoom-in" aria-label={t("dashboard.outletInfo.images.enlarge", { name: label })}>
              <img src={url} alt={label} className="size-14 rounded-lg object-cover border border-green-200 dark:border-green-900/50" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-[#1a2b4b] dark:text-white">{name}</p>
            {value instanceof File && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{(value.size / (1024 * 1024)).toFixed(2)} MB</p>
            )}
            {pdf && typeof value === "string" && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-secondary-orange hover:underline">
                <ExternalLink className="w-3 h-3" />
                {t("dashboard.outletInfo.images.view")}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-bold text-secondary-orange hover:underline shrink-0"
          >
            {t("onboarding.restaurant.complete.setupForm.change")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 hover:border-[#FF9F43] transition-all group text-slate-600 dark:text-zinc-300 ${error ? "border-red-300" : "border-gray-300 dark:border-zinc-700"}`}
        >
          <Upload className="w-5 h-5 group-hover:text-[#FF9F43] transition-colors" />
          <span className="text-base font-medium">{emptyText}</span>
        </button>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {!pdf && <ImagePreviewDialog url={previewOpen ? url : null} title={label} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
};
