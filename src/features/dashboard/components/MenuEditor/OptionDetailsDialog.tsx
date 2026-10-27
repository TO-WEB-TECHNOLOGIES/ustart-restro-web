import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { multimediaService } from "@/api/multimediaService";
import type { OptionDraft } from "../../api/customizationApi";
import { type OptionExtras, extrasTimesMissing } from "../../api/optionExtras";
import { OptionExtrasFields } from "./OptionExtrasFields";
import { ImagePickField } from "./ImagePickField";

/**
 * 2026-10-26: "Additional details" of one customization option - its optional image and
 * description, in one modal (product decision). Edits stay local to the panel's draft until the
 * panel's Save; a picked image is uploaded on Done so the draft holds its S3 key.
 * 2026-10-27: the image control lives in ImagePickField.
 * 2026-10-27: also every other optional field of the option (availability, specs,
 * nutrition - OptionExtrasFields), so all optional details live in this one modal.
 */
interface OptionDetailsDialogProps {
  option: OptionDraft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (patch: Pick<OptionDraft, "description" | "imageUrl" | "imageKey" | "extras">) => void;
}

export const OptionDetailsDialog = ({ option, open, onOpenChange, onDone }: OptionDetailsDialogProps) => {
  const { t } = useTranslation();
  const k = (key: string) => `dashboard.menuEditor.customizations.details.${key}`;

  const [description, setDescription] = useState(option.description);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(option.imageUrl);
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extras, setExtras] = useState<OptionExtras>(option.extras);
  // The time-window note shows only after a Done attempt, not while the partner is still typing.
  const [triedDone, setTriedDone] = useState(false);

  // Start from the option's current values every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setDescription(option.description);
    setPreviewUrl(option.imageUrl);
    setFile(null);
    setRemoved(false);
    setExtras(option.extras);
    setTriedDone(false);
  }, [open, option.description, option.imageUrl, option.extras]);

  const removeImage = () => {
    setFile(null);
    setRemoved(true);
    setPreviewUrl(undefined);
  };

  const handleDone = async () => {
    // A half-filled time window would be rejected (or half-applied) on the panel's Save.
    if (extrasTimesMissing(extras)) {
      setTriedDone(true);
      return;
    }
    setIsUploading(true);
    try {
      let imageKey = option.imageKey;
      if (file) imageKey = await multimediaService.uploadMenuItemImage(file);
      // "" tells the backend to clear the image; only meaningful if the option had one.
      else if (removed) imageKey = option.imageUrl || option.imageKey ? "" : undefined;
      onDone({ description, imageUrl: previewUrl, imageKey, extras });
      onOpenChange(false);
    } catch (err) {
      console.error("Option image upload failed", err);
      toast.error(t("dashboard.menuEditor.addItem.validation.imageUploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isUploading && onOpenChange(next)}>
      {/* Scrolls inside: with every optional field the modal is taller than small screens. */}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t(k("title"), { name: option.name || "…" })}</DialogTitle>
          <DialogDescription className="dark:text-slate-400">{t(k("subtitle"))}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide">{t(k("image"))}</Label>
            <ImagePickField
              previewUrl={previewUrl}
              alt={option.name}
              onPick={(picked, url) => {
                setFile(picked);
                setRemoved(false);
                setPreviewUrl(url);
              }}
              onRemove={removeImage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${option.key}-description`} className="text-xs font-bold uppercase tracking-wide">
              {t(k("description"))}
            </Label>
            <Textarea
              id={`${option.key}-description`}
              value={description}
              maxLength={200}
              placeholder={t(k("descriptionPlaceholder"))}
              onChange={(e) => setDescription(e.target.value)}
              className="dark:bg-slate-950 dark:border-slate-700 dark:text-white"
            />
          </div>

          <OptionExtrasFields
            idPrefix={option.key}
            value={extras}
            onChange={setExtras}
            timesMissing={triedDone && extrasTimesMissing(extras)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={isUploading}
            onClick={() => onOpenChange(false)}
            className="dark:hover:bg-slate-800 dark:text-slate-300"
          >
            {t("dashboard.menuEditor.customizations.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleDone}
            disabled={isUploading}
            className="bg-[var(--color-primary-blue)] text-white hover:opacity-90"
          >
            {isUploading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {t(k("done"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
