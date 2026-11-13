import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/utils/error";
import type { Manager, PeopleScope } from "../../api/outletInfoApi";
import { useSaveManager } from "../../hooks/useOutletInfo";
import { FormField } from "./FormField";
import { useVerifyContact } from "./VerifyContactField";

/**
 * 2026-11-12: add / edit a manager - someone who can log in to the partner dashboard for this outlet
 * (scope outlet) or every outlet of the brand (scope brand). Only brand-level logins reach this form.
 * - Add: name, role, mobile (their login) and email; both OTP-verified with the person first.
 * - Edit: name, role, email (re-verified if changed) and Active; the mobile can't change. You can't
 *   switch off your own access (the backend also keeps one active brand manager).
 * A warning spells out the access being granted.
 */
const createManagerSchema = (t: TFunction) => {
  const k = "dashboard.outletInfo.managers.errors.";
  return z.object({
    name: z.string().trim().min(2, t(`${k}name`)),
    role: z.string().trim().min(2, t(`${k}role`)),
    mobileNumber: z.string().regex(/^\d{10}$/, t(`${k}mobile`)),
    email: z.string().trim().email(t(`${k}email`)),
    isActive: z.boolean(),
  });
};
type ManagerValues = z.infer<ReturnType<typeof createManagerSchema>>;

interface ManagerFormProps {
  scope: PeopleScope;
  manager: Manager | null;
  onDone: () => void;
}

export const ManagerForm = ({ scope, manager, onDone }: ManagerFormProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.managers.";
  const save = useSaveManager(scope);
  const schema = useMemo(() => createManagerSchema(t), [t]);
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const { register, handleSubmit, control, formState: { errors } } = useForm<ManagerValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: manager?.name ?? "",
      role: manager?.role ?? (scope.kind === "brand" ? t(`${k}defaultBrandRole`) : t(`${k}defaultOutletRole`)),
      mobileNumber: manager?.mobileNumber ?? "",
      email: manager?.email ?? "",
      isActive: manager?.isActive ?? true,
    },
  });

  // useWatch (not watch()): re-renders on these two fields only, and works with React's compiler.
  const mobile = useWatch({ control, name: "mobileNumber" }) ?? "";
  const email = (useWatch({ control, name: "email" }) ?? "").trim().toLowerCase();
  const mobileVerified = !!manager || verified.has(`M:${mobile}`);
  const emailVerified = (!!manager && email === (manager.email ?? "").toLowerCase()) || verified.has(`E:${email}`);
  const markVerified = (key: string) => setVerified((set) => new Set(set).add(key));
  const mobileCheck = useVerifyContact({
    channel: "MOBILE", value: mobile, valid: /^\d{10}$/.test(mobile), verified: mobileVerified,
    onVerified: (v) => markVerified(`M:${v}`),
  });
  const emailCheck = useVerifyContact({
    channel: "EMAIL", value: email, valid: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), verified: emailVerified,
    onVerified: (v) => markVerified(`E:${v}`),
  });

  const submit = async (values: ManagerValues) => {
    try {
      await save.mutateAsync({
        userId: manager?.userId,
        request: {
          name: values.name.trim(),
          role: values.role.trim(),
          email: values.email.trim(),
          mobileNumber: manager ? undefined : values.mobileNumber,
          isActive: manager ? values.isActive : undefined,
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
      <p className="flex items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        {t(scope.kind === "brand" ? `${k}accessBrand` : `${k}accessOutlet`)}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="mgr-name" label={t(`${k}name`)} error={errors.name?.message} {...register("name")} />
        <FormField id="mgr-role" label={t(`${k}role`)} error={errors.role?.message} {...register("role")} />
        <div className="space-y-2">
          <FormField id="mgr-mobile" inputMode="numeric" maxLength={10} disabled={!!manager} label={t(`${k}mobile`)} error={errors.mobileNumber?.message} {...register("mobileNumber")} />
          {!manager && mobileCheck.inline}
        </div>
        <div className="space-y-2">
          <FormField id="mgr-email" type="email" label={t(`${k}email`)} error={errors.email?.message} {...register("email")} />
          {emailCheck.inline}
        </div>
      </div>
      {/* 2026-11-13 (user feedback): code entry below the fields at full width - inputs never move. */}
      {(mobileCheck.box || emailCheck.box) && (
        <div className="space-y-3">
          {mobileCheck.box}
          {emailCheck.box}
        </div>
      )}
      {manager && !manager.isYou && (
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 cursor-pointer">
              <span>
                <span className="block text-sm font-bold text-[#1a2b4b] dark:text-white">{t(`${k}active`)}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`${k}activeHint`)}</span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={t(`${k}active`)} />
            </label>
          )}
        />
      )}
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
