import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * 2026-10-27: pick / replace / remove one 4:3 image, preview only (the customization option
 * modal's image control). The caller uploads the picked file when it saves, so a cancelled form
 * never leaves an orphan upload. The add-on form uses AddItemPage's larger drop area instead
 * (AddonFormFields.ImageDropzone) but shares MAX_IMAGE_BYTES.
 */
interface ImagePickFieldProps {
  previewUrl?: string;
  alt: string;
  onPick: (file: File, previewUrl: string) => void;
  onRemove: () => void;
  className?: string;
}

// 2MB, the same cap onboarding uses for menu photos (the add-item form itself has none yet).
// Exported 2026-10-27 for the add-on form's drop area.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const K = "dashboard.menuEditor.customizations.details.";

export const ImagePickField = ({ previewUrl, alt, onPick, onRemove, className = "w-48" }: ImagePickFieldProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      toast.error(t("onboarding.restaurant.complete.setupForm.fileTooLarge", { name: picked.name, size: 2 }));
      return;
    }
    onPick(picked, URL.createObjectURL(picked));
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
      {previewUrl ? (
        <div className={`relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 ${className}`}>
          <img src={previewUrl} alt={alt} className="h-full w-full object-cover" />
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              {t(`${K}replace`)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRemove}
              aria-label={t(`${K}remove`)}
              title={t(`${K}remove`)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)] transition-colors ${className}`}
        >
          <ImagePlus className="w-6 h-6" />
          <span className="text-xs font-bold">{t(`${K}addImage`)}</span>
        </button>
      )}
    </>
  );
};
