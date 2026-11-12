import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/utils/error";
import type { OutletPoc } from "../../api/outletInfoApi";
import { useSavePoc } from "../../hooks/useOutletInfo";
import { FormField } from "./FormField";

/**
 * 2026-11-12: add / edit one of the outlet's points of contact (shadcn Dialog). Saving a contact
 * never changes the outlet's status. Rules mirror the backend's PocDTO: name, designation and a
 * 10-digit mobile required; WhatsApp 10 digits and email valid when filled. Empty optional fields
 * are left out of the request (the backend rejects "" for WhatsApp).
 */
const createPocSchema = (t: TFunction) => {
  const k = "dashboard.outletInfo.pocs.errors.";
  return z.object({
    pocName: z.string().trim().min(2, t(`${k}name`)),
    designation: z.string().trim().min(2, t(`${k}designation`)),
    pocMobileNumber: z.string().regex(/^\d{10}$/, t(`${k}mobile`)),
    pocWhatsappNumber: z.string().regex(/^(\d{10})?$/, t(`${k}whatsapp`)),
    pocEmailAddress: z.union([z.literal(""), z.string().trim().email(t(`${k}email`))]),
    description: z.string().max(300, t(`${k}description`)),
  });
};
type PocValues = z.infer<ReturnType<typeof createPocSchema>>;

interface PocFormDialogProps {
  restroId: string;
  /** null = add; a POC = edit it. */
  poc: OutletPoc | null;
  open: boolean;
  onClose: () => void;
}

export const PocFormDialog = ({ restroId, poc, open, onClose }: PocFormDialogProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.pocs.";
  const save = useSavePoc(restroId);
  const schema = useMemo(() => createPocSchema(t), [t]);
  const { register, handleSubmit, formState: { errors } } = useForm<PocValues>({
    resolver: zodResolver(schema),
    // The parent mounts this dialog per open (keyed by contact), so defaults are read once.
    defaultValues: {
      pocName: poc?.pocName ?? "",
      designation: poc?.designation ?? "",
      pocMobileNumber: poc?.pocMobileNumber ?? "",
      pocWhatsappNumber: poc?.pocWhatsappNumber ?? "",
      pocEmailAddress: poc?.pocEmailAddress ?? "",
      description: poc?.description ?? "",
    },
  });

  const submit = async (values: PocValues) => {
    try {
      await save.mutateAsync({
        pocId: poc?.pocId,
        request: {
          pocName: values.pocName.trim(),
          designation: values.designation.trim(),
          pocMobileNumber: values.pocMobileNumber,
          pocWhatsappNumber: values.pocWhatsappNumber || undefined,
          pocEmailAddress: values.pocEmailAddress.trim() || undefined,
          description: values.description.trim() || undefined,
        },
      });
      toast.success(t(`${k}saved`));
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !save.isPending) onClose(); }}>
      <DialogContent showCloseButton={!save.isPending} className="sm:max-w-lg rounded-[28px] p-6 sm:p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="space-y-1">
          <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">{t(poc ? `${k}edit` : `${k}add`)}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}hint`)}</DialogDescription>
        </div>
        <form id="poc-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="poc-name" label={t(`${k}name`)} error={errors.pocName?.message} {...register("pocName")} />
          <FormField id="poc-designation" label={t(`${k}designation`)} error={errors.designation?.message} {...register("designation")} />
          <FormField id="poc-mobile" inputMode="numeric" maxLength={10} label={t(`${k}mobile`)} error={errors.pocMobileNumber?.message} {...register("pocMobileNumber")} />
          <FormField id="poc-whatsapp" inputMode="numeric" maxLength={10} label={t(`${k}whatsapp`)} error={errors.pocWhatsappNumber?.message} {...register("pocWhatsappNumber")} />
          <div className="sm:col-span-2">
            <FormField id="poc-email" type="email" label={t(`${k}email`)} error={errors.pocEmailAddress?.message} {...register("pocEmailAddress")} />
          </div>
          <div className="sm:col-span-2">
            <FormField id="poc-description" maxLength={300} label={t(`${k}description`)} error={errors.description?.message} {...register("description")} />
          </div>
        </form>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={save.isPending}
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {t(`${k}cancel`)}
          </button>
          <button
            type="submit"
            form="poc-form"
            disabled={save.isPending}
            className="flex-1 h-12 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t(`${k}save`)}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
