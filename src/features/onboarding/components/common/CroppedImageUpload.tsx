import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/ui/required-mark";
import { FileDisplay } from "./FileDisplay";
import { ImagePreviewDialog } from "./ImagePreviewDialog";
import { ImageCropModal } from "./ImageCropModal";

/**
 * One single-image upload box: pick -> crop (fixed aspect) -> preview inside the box -> click to
 * expand (2026-10-20).
 *
 * Extracted from RestaurantInfo when the brand-identity rule changed from "logo OR outlet image"
 * to "outlet image always, PLUS a logo for multi-branch brands" - the same box is now rendered
 * twice (16:9 outlet image, square logo), so its pick/crop/preview state lives here once instead
 * of being duplicated per field in RestaurantInfo.
 */
interface CroppedImageUploadProps {
  value: File | string | undefined;
  onChange: (file: File) => void;
  // Crop aspect, also used for the in-box preview shape (1 = square logo, 16/9 = outlet image).
  aspect: number;
  label: string;
  uploadText: string;
  uploadSubtext: string;
  error?: string;
}

const isLoadableUrl = (value: string) => /^(https?:|blob:|data:|\/)/.test(value);

export const CroppedImageUpload = ({
  value,
  onChange,
  aspect,
  label,
  uploadText,
  uploadSubtext,
  error,
}: CroppedImageUploadProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // The raw pick waits here for ImageCropModal; only the cropped result reaches onChange.
  const [cropState, setCropState] = useState<{ file: File; imageSrc: string } | null>(null);

  // Object URL for a picked File (revoked on change/unmount); a string is used only if it's a
  // loadable URL, otherwise the box falls back to the file-name chip.
  const previewUrl = useMemo(() => {
    if (value instanceof File) return URL.createObjectURL(value);
    if (typeof value === "string" && isLoadableUrl(value)) return value;
    return null;
  }, [value]);
  useEffect(
    () => () => {
      if (value instanceof File && previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [value, previewUrl],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropState({ file, imageSrc: URL.createObjectURL(file) });
    // Reset so selecting the exact same file again still fires onChange.
    e.target.value = "";
  };

  const closeCrop = () => {
    if (cropState) URL.revokeObjectURL(cropState.imageSrc);
    setCropState(null);
  };

  return (
    <div className="space-y-2">
      <Label className="font-semibold text-slate-700 dark:text-zinc-200">
        {label}
        <RequiredMark />
      </Label>
      {/* "Change" opens the picker directly via the box's own click. */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl min-h-[160px] flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${previewUrl ? "p-3" : "p-8"} ${error ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-zinc-700"}`}
      >
        <input type="file" className="hidden" ref={inputRef} accept="image/*" onChange={handleFile} />
        {value ? (
          <div className="flex flex-col items-center gap-2 w-full">
            {previewUrl ? (
              // Click expands it; stopPropagation keeps the box's own click (open the picker)
              // for the empty area and "Change".
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewOpen(true);
                }}
                className="cursor-zoom-in"
                aria-label={label}
              >
                <img
                  src={previewUrl}
                  alt={label}
                  style={{ aspectRatio: aspect }}
                  className="max-h-48 w-auto max-w-full object-cover rounded-xl border border-slate-200 dark:border-zinc-700"
                />
              </button>
            ) : (
              <FileDisplay file={value} />
            )}
            <span className="text-xs text-secondary-orange font-medium hover:underline">
              {t("onboarding.restaurant.about.changeImage")}
            </span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-3 text-secondary-orange">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-secondary-orange">{uploadText}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{uploadSubtext}</p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <ImagePreviewDialog
        url={isPreviewOpen ? previewUrl : null}
        title={label}
        onClose={() => setIsPreviewOpen(false)}
      />

      {cropState && (
        <ImageCropModal
          isOpen
          imageSrc={cropState.imageSrc}
          fileName={cropState.file.name}
          fileType={cropState.file.type}
          aspect={aspect}
          onCancel={closeCrop}
          onCropped={(croppedFile) => {
            onChange(croppedFile);
            closeCrop();
          }}
        />
      )}
    </div>
  );
};
