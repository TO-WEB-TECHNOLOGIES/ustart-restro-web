import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Full-size view of one uploaded image (2026-10-20), opened by clicking a thumbnail in
 * UploadedImageTiles or the dish/brand preview in RestaurantInfo - the in-box previews are
 * deliberately small, too small to check a menu page's text is legible.
 *
 * Built on shadcn Dialog (Radix: focus trap, Esc/outside-click close, portal) per
 * CLAUDE.local.md §1 - not the custom components/ui/modal.tsx, which is slated for replacement.
 * Controlled: `url` non-null = open.
 */
interface ImagePreviewDialogProps {
  url: string | null;
  // Accessible name for the dialog and alt text for the image.
  title: string;
  onClose: () => void;
}

export const ImagePreviewDialog = ({ url, title, onClose }: ImagePreviewDialogProps) => (
  // React bubbles synthetic events from portal content up the COMPONENT tree, so a click on the
  // dialog/overlay would otherwise reach a clickable ancestor (e.g. an upload box that opens the
  // file picker). `contents` keeps this wrapper out of the layout.
  <div className="contents" onClick={(e) => e.stopPropagation()}>
  <Dialog open={!!url} onOpenChange={(open) => !open && onClose()}>
    {/* aria-describedby={undefined}: an image viewer has no description text, and this tells
        Radix that's intentional (otherwise it logs a "Missing Description" console warning). */}
    <DialogContent aria-describedby={undefined} className="max-w-4xl w-[calc(100vw-2rem)] p-3 bg-white dark:bg-zinc-950">
      {/* Radix requires a title for screen readers; the image itself is the visible content. */}
      <DialogTitle className="sr-only">{title}</DialogTitle>
      {url && (
        <img
          src={url}
          alt={title}
          className="w-full max-h-[80vh] object-contain rounded-lg"
        />
      )}
    </DialogContent>
  </Dialog>
  </div>
);
