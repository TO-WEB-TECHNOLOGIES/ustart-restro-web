import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { OutletPoc, PeopleScope } from "../../api/outletInfoApi";
import { useSavePersonPoc } from "../../hooks/useOutletInfo";
import { FormField } from "./FormField";
import { VerifyContactField } from "./VerifyContactField";

/**
 * 2026-11-12: add / edit a point of contact - an outlet's or (scope brand) the brand's. Saving a
 * contact never changes any status. Rules mirror the backend's PocDTO: name, designation and a
 * 10-digit mobile required; WhatsApp 10 digits and email valid when filled. Empty optional fields
 * are left out of the request (the backend rejects "" for WhatsApp).
 * 2026-11-12 (user request): the mobile, and the email when given, must be OTP-verified with the
 * person before saving (VerifyContactField) - only when new or changed, so an existing contact
 * saved unchanged needs no code. Rendered inside PersonFormDialog (which owns the Dialog and the
 * Manager / POC tabs); `onDone` closes it.
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

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface PocFormProps {
  scope: PeopleScope;
  /** null = add; a POC = edit it. */
  poc: OutletPoc | null;
  onDone: () => void;
}

export const PocForm = ({ scope, poc, onDone }: PocFormProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.pocs.";
  const save = useSavePersonPoc(scope);
  const schema = useMemo(() => createPocSchema(t), [t]);
  // Values verified in this dialog ("M:9876543210", "E:a@b.com").
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const { register, handleSubmit, control, formState: { errors } } = useForm<PocValues>({
    resolver: zodResolver(schema),
    // Mounted per open (keyed by contact), so defaults are read once.
    defaultValues: {
      pocName: poc?.pocName ?? "",
      designation: poc?.designation ?? "",
      pocMobileNumber: poc?.pocMobileNumber ?? "",
      pocWhatsappNumber: poc?.pocWhatsappNumber ?? "",
      pocEmailAddress: poc?.pocEmailAddress ?? "",
      description: poc?.description ?? "",
    },
  });

  // useWatch (not watch()): re-renders on these two fields only, and works with React's compiler.
  const mobile = useWatch({ control, name: "pocMobileNumber" }) ?? "";
  const email = (useWatch({ control, name: "pocEmailAddress" }) ?? "").trim().toLowerCase();
  const mobileVerified = (!!poc && mobile === poc.pocMobileNumber) || verified.has(`M:${mobile}`);
  const emailVerified = email === "" || (!!poc && email === (poc.pocEmailAddress ?? "").toLowerCase()) || verified.has(`E:${email}`);
  const markVerified = (key: string) => setVerified((set) => new Set(set).add(key));

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
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>
      {/* 2026-11-13 (user report: the code box overflowed half-width columns): verification rows sit
          under the inputs at full width, stacked (one block each) when both are open. */}
      <div className="space-y-3">
        <VerifyContactField channel="MOBILE" value={mobile} valid={/^\d{10}$/.test(mobile)} verified={mobileVerified} onVerified={(v) => markVerified(`M:${v}`)} />
        {email !== "" && (
          <VerifyContactField channel="EMAIL" value={email} valid={EMAIL_RE.test(email)} verified={emailVerified} onVerified={(v) => markVerified(`E:${v}`)} />
        )}
      </div>
      {(!mobileVerified || !emailVerified) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("dashboard.outletInfo.verify.required")}</p>
      )}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          disabled={save.isPending}
          onClick={onDone}
          className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {t(`${k}cancel`)}
        </button>
        <button
          type="submit"
          disabled={save.isPending || !mobileVerified || !emailVerified}
          className="flex-1 h-12 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {t(`${k}save`)}
        </button>
      </div>
    </form>
  );
};
