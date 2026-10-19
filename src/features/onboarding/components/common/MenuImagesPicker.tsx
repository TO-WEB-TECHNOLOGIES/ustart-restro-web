import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Horizontal strip of menu-page photos with add/remove (2026-10-19).
 *
 * Created for the outlet dining menu, which AddRestaurantForm and EditRestaurantModal both
 * needed - one shared picker instead of a third and fourth copy of the delivery-menu block those
 * two files already duplicate. Visually matches that existing block (3:4 tiles, dashed "add"
 * tile, hover-to-delete). Values are `File` (new, not yet uploaded) or `string` (existing
 * image URL from the API); callers upload Files on submit, as they do for the delivery menu.
 */
interface MenuImagesPickerProps {
  images: (File | string)[];
  onChange: (images: (File | string)[]) => void;
  error?: string;
  // Read-only mode for locked registration data: no add tile, no delete buttons.
  disabled?: boolean;
  maxFileSizeMb?: number;
}

export const MenuImagesPicker = ({
  images,
  onChange,
  error,
  disabled = false,
  maxFileSizeMb = 2,
}: MenuImagesPickerProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((file) => {
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        toast.error(
          t("onboarding.restaurant.complete.setupForm.fileTooLarge", {
            name: file.name,
            size: maxFileSizeMb,
          }),
        );
        return false;
      }
      return true;
    });
    if (valid.length > 0) onChange([...images, ...valid]);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  };

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        onChange={handleAdd}
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
      />
      <div className="flex gap-3 h-40 overflow-x-auto pb-1 custom-scrollbar pr-2">
        {previews.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="h-full aspect-[3/4] border border-gray-200 dark:border-zinc-700 rounded-xl relative group overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0"
          >
            <img
              src={url}
              alt={`${t("onboarding.restaurant.complete.setupForm.diningMenu")} ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, i) => i !== index))}
                  className="text-white hover:text-red-400"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
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
    </div>
  );
};
