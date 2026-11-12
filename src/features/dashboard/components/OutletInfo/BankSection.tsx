import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Landmark, Loader2, Pencil, Plus } from "lucide-react";
import { getErrorMessage } from "@/utils/error";
import type { BankAccountType, OutletBankAccount } from "../../api/outletInfoApi";
import { useOutletBankAccounts } from "../../hooks/useOutletInfo";
import { BankFormDialog } from "./BankFormDialog";
import { InfoSection } from "./InfoSection";

/**
 * 2026-11-12: the outlet's bank accounts, masked (last 4 digits only). Separate from the outlet
 * edit. Slots: one PRIMARY and one SECONDARY of its own (user decision, the DB's unique keys).
 * - Using the brand's account ("same as brand"): it's listed with a Brand tag, read-only; "Use own
 *   primary account" adds an own PRIMARY, which replaces it.
 * - "Add secondary" shows only while there's no secondary.
 * Only PRIMARY changes send the outlet for approval (the dialog confirms first).
 */
interface BankSectionProps {
  restroId: string;
  /** ACTIVE: a PRIMARY change will send the outlet for approval. */
  isActive: boolean;
}

type DialogState = { type: BankAccountType; account: OutletBankAccount | null };

export const BankSection = ({ restroId, isActive }: BankSectionProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.bank.";
  const banks = useOutletBankAccounts(restroId);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const accounts = banks.data ?? [];
  const ownPrimary = accounts.some((a) => a.source === "OUTLET" && a.accountType === "PRIMARY");
  const ownSecondary = accounts.some((a) => a.source === "OUTLET" && a.accountType === "SECONDARY");

  const addButton = (type: BankAccountType, label: string) => (
    <button
      type="button"
      onClick={() => setDialog({ type, account: null })}
      className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <InfoSection
      icon={Landmark}
      title={t(`${k}title`)}
      action={banks.isSuccess && (
        <div className="flex flex-wrap justify-end gap-2">
          {!ownPrimary && addButton("PRIMARY", t(`${k}addPrimary`))}
          {!ownSecondary && addButton("SECONDARY", t(`${k}addSecondary`))}
        </div>
      )}
    >
      {banks.isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>
      ) : banks.isError ? (
        <p className="text-sm text-red-500">{getErrorMessage(banks.error, t(`${k}loadFailed`))}</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}empty`)}</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((account) => (
            <li key={account.bankDetailId} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${account.accountType === "PRIMARY"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                    {t(`${k}${account.accountType.toLowerCase()}`)}
                  </span>
                  {account.source === "BRAND" && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {t(`${k}brandShared`)}
                    </span>
                  )}
                </div>
                {account.editable && (
                  <button
                    type="button"
                    onClick={() => setDialog({ type: account.accountType, account })}
                    aria-label={t(`${k}edit`, { type: t(`${k}${account.accountType.toLowerCase()}`) })}
                    className="size-8 shrink-0 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-[#1a2b4b] dark:text-white">{t(`${k}masked`, { last4: account.accountNumberLast4 })}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{account.accountHolderName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {account.bankName} · {account.branchName} · {account.ifscCode}
              </p>
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <BankFormDialog
          key={dialog.account?.bankDetailId ?? `new-${dialog.type}`}
          restroId={restroId}
          accountType={dialog.type}
          account={dialog.account}
          willGoForApproval={isActive}
          onClose={() => setDialog(null)}
        />
      )}
    </InfoSection>
  );
};
