import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Plus, X } from "lucide-react";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

/**
 * Thumbnails of already-picked images, rendered INSIDE an upload drop box, plus a "+" tile to
 * add more (2026-10-20). Created for RestaurantInfo's delivery/dining menu boxes, which only
 * listed file names as chips below the box, so the partner couldn't see what they'd uploaded.
 *
 * Fits the box's existing bounds: fixed-height tiles in one horizontally scrolling row, so the
 * box keeps its size however many pages are added. Not MenuImagesPicker: that one brings its
 * own add-button/empty state and a 2MB size check the onboarding boxes don't have.
 *
 * Values are `File` (picked this session) or `string`. Strings render as images only when they
 * are loadable URLs; anything else (e.g. a bare storage key) falls back to a file-name tile.
 */
interface UploadedImageTilesProps {
  images: (File | string)[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  // Used as the img alt prefix ("<altLabel> 1", "<altLabel> 2", ...).
  altLabel: string;
}

const isLoadableUrl = (value: string) => /^(https?:|blob:|data:|\/)/.test(value);

export const UploadedImageTiles = ({ images, onAdd, onRemove, altLabel }: UploadedImageTilesProps) => {
  const { t } = useTranslation();
  // Index of the tile opened full-size in ImagePreviewDialog (2026-10-20); null = closed.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Object URLs for File entries, revoked when the list changes or on unmount so previews
  // don't leak memory (same pattern as MenuImagesPicker).
  const previews = useMemo(
    () => images.map((img) => (img instanceof File ? URL.createObjectURL(img) : img)),
    [images],
  );
  useEffect(
    () => () =>
      previews.forEach((url, i) => {
        if (images[i] instanceof File) URL.revokeObjectURL(url);
      }),
    [previews, images],
  );

  return (
    <>
    <div className="flex gap-3 h-32 w-full overflow-x-auto pb-1">
      {previews.map((url, index) => {
        const img = images[index];
        const name = img instanceof File ? img.name : img.split("/").pop() || img;
        return (
          <div
            key={`${url}-${index}`}
            className="relative h-full aspect-[3/4] flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800"
          >
            {isLoadableUrl(url) ? (
              // Click expands it full-size; stopPropagation so the surrounding upload box's
              // own click handler never fires.
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex(index);
                }}
                className="w-full h-full cursor-zoom-in"
                aria-label={`${altLabel} ${index + 1}`}
              >
                <img src={url} alt={`${altLabel} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-slate-500 dark:text-zinc-400">
                <FileText className="w-6 h-6" />
                <span className="text-[10px] text-center break-all line-clamp-3">{name}</span>
              </div>
            )}
            {/* Always visible (not hover-only) so it works on touch screens too. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              aria-label={t("common.delete")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="h-full aspect-[3/4] flex-shrink-0 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-600 flex flex-col items-center justify-center gap-1 text-secondary-orange hover:border-secondary-orange hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-colors"
        aria-label={t("onboarding.restaurant.complete.setupForm.addPage")}
      >
        <Plus className="w-6 h-6" />
        <span className="text-xs font-medium">{t("onboarding.restaurant.complete.setupForm.addPage")}</span>
      </button>
    </div>
    <ImagePreviewDialog
      url={openIndex !== null ? previews[openIndex] ?? null : null}
      title={openIndex !== null ? `${altLabel} ${openIndex + 1}` : altLabel}
      onClose={() => setOpenIndex(null)}
    />
    </>
  );
};
