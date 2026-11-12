import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Mail, Pencil, Phone, Plus, Users } from "lucide-react";
import { getErrorMessage } from "@/utils/error";
import type { OutletPoc } from "../../api/outletInfoApi";
import { useOutletPocs } from "../../hooks/useOutletInfo";
import { InfoSection } from "./InfoSection";
import { PocFormDialog } from "./PocFormDialog";

/**
 * 2026-11-12: the outlet's points of contact, plus the brand's (tagged, read-only). Add / Edit open
 * PocFormDialog; this is separate from the outlet edit and never changes the outlet's status.
 */
export const PocSection = ({ restroId }: { restroId: string }) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.pocs.";
  const pocs = useOutletPocs(restroId);
  // undefined = closed; null = adding; a POC = editing it.
  const [dialog, setDialog] = useState<OutletPoc | null | undefined>(undefined);

  return (
    <InfoSection
      icon={Users}
      title={t(`${k}title`)}
      action={
        <button
          type="button"
          onClick={() => setDialog(null)}
          className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {t(`${k}add`)}
        </button>
      }
    >
      {pocs.isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>
      ) : pocs.isError ? (
        <p className="text-sm text-red-500">{getErrorMessage(pocs.error, t(`${k}loadFailed`))}</p>
      ) : (pocs.data ?? []).length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}empty`)}</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pocs.data!.map((poc) => (
            <li key={poc.pocId} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a2b4b] dark:text-white truncate">{poc.pocName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{poc.designation}</p>
                </div>
                {poc.editable ? (
                  <button
                    type="button"
                    onClick={() => setDialog(poc)}
                    aria-label={t(`${k}editNamed`, { name: poc.pocName })}
                    className="size-8 shrink-0 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    {t(`${k}brandTag`)}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {poc.pocMobileNumber}
                {poc.pocWhatsappNumber && poc.pocWhatsappNumber !== poc.pocMobileNumber && ` · ${t(`${k}whatsappShort`)} ${poc.pocWhatsappNumber}`}
              </p>
              {poc.pocEmailAddress && (
                <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{poc.pocEmailAddress}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialog !== undefined && (
        <PocFormDialog
          key={dialog?.pocId ?? "new"}
          restroId={restroId}
          poc={dialog}
          open
          onClose={() => setDialog(undefined)}
        />
      )}
    </InfoSection>
  );
};
