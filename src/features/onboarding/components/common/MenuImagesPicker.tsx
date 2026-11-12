import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./ImageCropModal";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

/**
 * Horizontal strip of menu-page photos with add/remove (2026-10-19).
 *
 * Created for the outlet dining menu, which AddRestaurantForm and EditRestaurantModal both
 * needed - one shared picker instead of a third and fourth copy of the delivery-menu block those
 * two files already duplicate. Visually matches that existing block (3:4 tiles, dashed "add"
 * tile, hover-to-delete). Values are `File` (new, not yet uploaded) or `string` (existing
 * image URL from the API); callers upload Files on submit, as they do for the delivery menu.
 *
 * 2026-11-12 (user request: every editable image box shows the current image, and new ones are
 * cropped):
 * - New photos go through ImageCropModal at 3:4 (the tile shape - user decision). Picking several
 *   crops them one after another (a queue); cancelling one skips just that photo.
 * - Clicking a tile replaces that photo (pick → crop); the expand icon enlarges it; delete as before.
 * - Read-only (disabled): clicking a tile enlarges it.
 * - The size limit is checked on the cropped file (what's uploaded), not the original.
 * Now also used for AddRestaurantForm's delivery menu, so both menus behave the same.
 */
interface MenuImagesPickerProps {
  images: (File | string)[];
  onChange: (images: (File | string)[]) => void;
  error?: string;
  // Read-only mode for locked registration data: no add tile, no delete buttons.
  disabled?: boolean;
  maxFileSizeMb?: number;
  // Alt text / dialog title for the tiles (defaults to the dining-menu label).
  label?: string;
}

const MENU_ASPECT = 3 / 4;

export const MenuImagesPicker = ({
  images,
  onChange,
  error,
  disabled = false,
  maxFileSizeMb = 2,
  label,
}: MenuImagesPickerProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const tileLabel = label ?? t("onboarding.restaurant.complete.setupForm.diningMenu");
  // Picked files waiting to be cropped (first = the one in the crop dialog), and the tile being
  // replaced (null = the crops are added at the end).
  const [queue, setQueue] = useState<File[]>([]);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Object URLs for File entries; existing string URLs are used as-is. Revoked when the
  // image list changes or the picker unmounts, so previews don't leak memory.
  const previews = useMemo(
    () =>
      images.map((img) =>
        img instanceof File ? URL.createObjectURL(img) : img,
      ),
    [images],
  );
  useEffect(
    () => () =>
      previews.forEach((url, i) => {
        if (images[i] instanceof File) URL.revokeObjectURL(url);
      }),
    [previews, images],
  );

  // Source for the crop dialog: the first queued file.
  const cropSource = useMemo(() => (queue[0] ? URL.createObjectURL(queue[0]) : null), [queue]);
  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource); }, [cropSource]);

  const pick = (index: number | null) => {
    setReplaceIndex(index);
    inputRef.current?.click();
  };

  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"));
    // Replacing a tile takes one photo; adding takes all of them, cropped in turn.
    setQueue(replaceIndex !== null ? files.slice(0, 1) : files);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  };

  // Done with the current photo (cropped or skipped): move on; after the last one, the next pick
  // adds again instead of replacing.
  const nextInQueue = () => {
    if (queue.length <= 1) setReplaceIndex(null);
    setQueue((q) => q.slice(1));
  };

  const handleCropped = (file: File) => {
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      toast.error(
        t("onboarding.restaurant.complete.setupForm.fileTooLarge", {
          name: queue[0]?.name ?? file.name,
          size: maxFileSizeMb,
        }),
      );
    } else if (replaceIndex !== null) {
      onChange(images.map((img, i) => (i === replaceIndex ? file : img)));
    } else {
      onChange([...images, file]);
    }
    nextInQueue();
  };

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        onChange={handlePicked}
        accept="image/*"
        multiple={replaceIndex === null}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex gap-3 h-40 overflow-x-auto pb-1 custom-scrollbar pr-2">
        {previews.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="h-full aspect-[3/4] border border-gray-200 dark:border-zinc-700 rounded-xl relative group overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0"
          >
            {/* Tile click: replace (editable) or enlarge (read-only). */}
            <button
              type="button"
              onClick={() => (disabled ? setPreviewUrl(url) : pick(index))}
              className={cn("w-full h-full", disabled ? "cursor-zoom-in" : "cursor-pointer")}
              aria-label={disabled
                ? t("dashboard.outletInfo.images.enlarge", { name: `${tileLabel} ${index + 1}` })
                : t("dashboard.outletInfo.images.replace", { name: `${tileLabel} ${index + 1}` })}
            >
              <img src={url} alt={`${tileLabel} ${index + 1}`} className="w-full h-full object-cover" />
            </button>
            {!disabled && (
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(url)}
                  className="size-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  aria-label={t("dashboard.outletInfo.images.enlarge", { name: `${tileLabel} ${index + 1}` })}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, i) => i !== index))}
                  className="size-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={() => pick(null)}
            className={cn(
              "border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-2 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800 hover:border-[#FF9F43] transition-all cursor-pointer flex-shrink-0 text-slate-600 dark:text-zinc-300",
              previews.length > 0 ? "aspect-[3/4] h-full" : "w-full h-full",
            )}
          >
            <Plus className={cn("mb-2", previews.length > 0 ? "w-6 h-6" : "w-8 h-8")} />
            <span
              className={cn(
                "font-medium text-center px-2",
                previews.length > 0 ? "text-xs" : "text-base",
              )}
            >
              {t("onboarding.restaurant.complete.setupForm.addPage")}
            </span>
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs pl-1 mt-1 font-medium">{error}</p>}

      <ImagePreviewDialog url={previewUrl} title={tileLabel} onClose={() => setPreviewUrl(null)} />

      {queue[0] && cropSource && (
        <ImageCropModal
          // Keyed per file so the crop position/zoom reset between queued photos.
          key={`${queue[0].name}-${queue[0].lastModified}-${queue.length}`}
          isOpen
          imageSrc={cropSource}
          fileName={queue[0].name}
          fileType={queue[0].type}
          aspect={MENU_ASPECT}
          onCancel={nextInQueue}
          onCropped={handleCropped}
        />
      )}
    </div>
  );
};
