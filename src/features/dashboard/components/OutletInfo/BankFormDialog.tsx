import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/utils/error";
import type { BankAccountType, OutletBankAccount } from "../../api/outletInfoApi";
import { useSaveBankAccount } from "../../hooks/useOutletInfo";
import { AllOutletsConfirmDialog } from "../MenuEditor/AllOutletsConfirmDialog";
import { FormField } from "./FormField";

/**
 * 2026-11-12: add / edit one of the outlet's own bank accounts (shadcn Dialog).
 * - The account number is never returned, so it's always typed in full (also on edit).
 * - A PRIMARY save (add or edit) first asks for confirmation: it sends an ACTIVE outlet for
 *   approval, which takes it offline until an admin approves (user decision). SECONDARY saves
 *   go straight through and never change the status.
 * Rules mirror the backend: 8-18 digit account number, IFSC ^[A-Z]{4}0[A-Z0-9]{6}$ (uppercased here).
 */
const createBankSchema = (t: TFunction) => {
  const k = "dashboard.outletInfo.bank.errors.";
  return z
    .object({
      bankAccountNumber: z.string().regex(/^\d{8,18}$/, t(`${k}accountNumber`)),
      confirmAccountNumber: z.string(),
      accountHolderName: z.string().trim().min(2, t(`${k}holder`)),
      ifscCode: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, t(`${k}ifsc`)),
      bankName: z.string().trim().min(2, t(`${k}bankName`)),
      branchName: z.string().trim().min(2, t(`${k}branch`)),
    })
    // Typed twice because a wrong digit would send payouts to someone else's account.
    .refine((v) => v.bankAccountNumber === v.confirmAccountNumber, {
      message: t(`${k}confirmMismatch`),
      path: ["confirmAccountNumber"],
    });
};
type BankValues = z.infer<ReturnType<typeof createBankSchema>>;

interface BankFormDialogProps {
  restroId: string;
  accountType: BankAccountType;
  /** null = add an account of accountType; an account = edit it. */
  account: OutletBankAccount | null;
  /** The outlet is ACTIVE, so a PRIMARY save will send it for approval (shown in the confirmation). */
  willGoForApproval: boolean;
  onClose: () => void;
}

export const BankFormDialog = ({ restroId, accountType, account, willGoForApproval, onClose }: BankFormDialogProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.bank.";
  const save = useSaveBankAccount(restroId);
  const schema = useMemo(() => createBankSchema(t), [t]);
  const [pending, setPending] = useState<BankValues | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<BankValues>({
    resolver: zodResolver(schema),
    // Mounted per open by BankSection, so these are read once. Number fields start empty.
    defaultValues: {
      bankAccountNumber: "",
      confirmAccountNumber: "",
      accountHolderName: account?.accountHolderName ?? "",
      ifscCode: account?.ifscCode ?? "",
      bankName: account?.bankName ?? "",
      branchName: account?.branchName ?? "",
    },
  });

  const send = async (values: BankValues) => {
    try {
      const result = await save.mutateAsync({
        bankDetailId: account?.bankDetailId,
        request: {
          accountType,
          bankAccountNumber: values.bankAccountNumber,
          accountHolderName: values.accountHolderName,
          ifscCode: values.ifscCode,
          bankName: values.bankName,
          branchName: values.branchName,
        },
      });
      toast.success(t(result.sentForApproval ? `${k}sentForApproval` : `${k}saved`));
      onClose();
    } catch (error) {
      setPending(null);
      toast.error(getErrorMessage(error, t(`${k}failed`)));
    }
  };

  // PRIMARY on a live outlet: confirm first; otherwise save directly.
  const submit = (values: BankValues) => {
    if (accountType === "PRIMARY" && willGoForApproval) setPending(values);
    else void send(values);
  };

  const title = account
    ? t(`${k}edit`, { type: t(`${k}${accountType.toLowerCase()}`) })
    : t(`${k}addTyped`, { type: t(`${k}${accountType.toLowerCase()}`) });

  return (
    <>
      <Dialog open={pending === null} onOpenChange={(next) => { if (!next && !save.isPending) onClose(); }}>
        <DialogContent showCloseButton={!save.isPending} className="sm:max-w-lg rounded-[28px] p-6 sm:p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">{title}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {account ? t(`${k}reenterHint`, { last4: account.accountNumberLast4 }) : t(`${k}hint`)}
            </DialogDescription>
          </div>
          <form id="bank-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4" autoComplete="off">
            <FormField id="bank-number" inputMode="numeric" maxLength={18} label={t(`${k}accountNumber`)} error={errors.bankAccountNumber?.message} {...register("bankAccountNumber")} />
            <FormField id="bank-number-confirm" inputMode="numeric" maxLength={18} label={t(`${k}confirmAccountNumber`)} error={errors.confirmAccountNumber?.message} {...register("confirmAccountNumber")} />
            <div className="sm:col-span-2">
              <FormField id="bank-holder" label={t(`${k}holder`)} error={errors.accountHolderName?.message} {...register("accountHolderName")} />
            </div>
            <FormField id="bank-ifsc" maxLength={11} className="uppercase" label={t(`${k}ifsc`)} error={errors.ifscCode?.message} {...register("ifscCode")} />
            <FormField id="bank-name" label={t(`${k}bankName`)} error={errors.bankName?.message} {...register("bankName")} />
            <div className="sm:col-span-2">
              <FormField id="bank-branch" label={t(`${k}branch`)} error={errors.branchName?.message} {...register("branchName")} />
            </div>
          </form>
          {accountType === "PRIMARY" && willGoForApproval && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-4 py-3">
              {t(`${k}primaryNote`)}
            </p>
          )}
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
              form="bank-form"
              disabled={save.isPending}
              className="flex-1 h-12 rounded-xl bg-secondary-orange hover:bg-orange-500 text-white text-sm font-bold disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t(`${k}save`)}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AllOutletsConfirmDialog
        open={pending !== null}
        isLoading={save.isPending}
        title={t(`${k}confirmPrimaryTitle`)}
        description={t(`${k}confirmPrimaryText`)}
        confirmLabel={t(`${k}confirmPrimary`)}
        cancelLabel={t(`${k}cancel`)}
        onConfirm={() => pending && send(pending)}
        onClose={() => setPending(null)}
      />
    </>
  );
};
