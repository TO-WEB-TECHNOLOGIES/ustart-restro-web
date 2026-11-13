import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Mail, Pencil, Phone, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getErrorMessage } from "@/utils/error";
import type { Manager, PeopleScope } from "../../api/outletInfoApi";
import { usePeople, useSaveManager } from "../../hooks/useOutletInfo";
import { AllOutletsConfirmDialog } from "../MenuEditor/AllOutletsConfirmDialog";
import { InfoSection } from "./InfoSection";
import { PersonFormDialog, type PersonTarget } from "./PersonFormDialog";
import { PersonRoleLabel } from "./PersonRoleLabel";

/**
 * 2026-11-12 (user request): the people of one outlet - its own managers and POCs only - or, with
 * scope brand (All Locations), the brand's managers and POCs. Replaces PocSection.
 * - Managers: dashboard access (Outlet / Brand Manager label with an ⓘ tooltip). Added / edited by
 *   brand-level logins only; deactivated ones are dimmed.
 * - POCs: contact only (Outlet / Brand POC label). Outlet POCs: any login of the outlet; brand POCs:
 *   brand-level logins (the API's `editable`).
 * Add opens PersonFormDialog with Manager / POC tabs; new or changed contacts are OTP-verified there.
 * 2026-11-13 (user request): a switch on each manager turns dashboard access on / off (off is
 * confirmed). One manager always stays active for the brand and for each outlet, and you can't switch
 * yourself off - those switches are disabled with a tooltip saying why (the backend enforces both).
 */
export const PeopleSection = ({ scope }: { scope: PeopleScope }) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.people.";
  const { user } = useAuth();
  const people = usePeople(scope);
  const [target, setTarget] = useState<PersonTarget | null>(null);
  const canManageManagers = !user?.restroId;
  const canAddPoc = scope.kind === "outlet" || canManageManagers;
  const managers = people.data?.managers ?? [];
  const activeManagers = managers.filter((m) => m.isActive).length;
  const saveManager = useSaveManager(scope);
  const [switchingOff, setSwitchingOff] = useState<Manager | null>(null);

  const setAccess = async (manager: Manager, isActive: boolean) => {
    try {
      // Edit with everything else unchanged (email left out keeps the current one).
      await saveManager.mutateAsync({ userId: manager.userId, request: { name: manager.name, role: manager.role, isActive } });
      toast.success(t(isActive ? `${k}accessOn` : `${k}accessOff`, { name: manager.name }));
      setSwitchingOff(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t("dashboard.outletInfo.managers.failed")));
    }
  };

  // Why a manager's switch can't be used (null when it can).
  const lockReason = (m: Manager) =>
    m.isYou ? t(`${k}lockYou`) : m.isActive && activeManagers <= 1 ? t(`${k}lockLast`) : null;
  const pocs = people.data?.pocs ?? [];

  const editButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="size-8 shrink-0 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700"
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );

  const contactLines = (mobile: string, email: string | null) => (
    <>
      <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <Phone className="w-3.5 h-3.5 shrink-0" />
        {mobile}
      </p>
      {email && (
        <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 min-w-0">
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{email}</span>
        </p>
      )}
    </>
  );

  return (
    <InfoSection
      icon={Users}
      title={t(scope.kind === "brand" ? `${k}brandTitle` : `${k}title`)}
      action={canAddPoc && (
        <button
          type="button"
          onClick={() => setTarget({ mode: "add", initial: canManageManagers ? "MANAGER" : "POC" })}
          className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1a2b4b] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {t(`${k}add`)}
        </button>
      )}
    >
      {people.isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 text-secondary-orange animate-spin" /></div>
      ) : people.isError ? (
        <p className="text-sm text-red-500">{getErrorMessage(people.error, t(`${k}loadFailed`))}</p>
      ) : managers.length === 0 && pocs.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}empty`)}</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {managers.map((m) => (
            <li key={`m-${m.userId}`} className={`rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 ${m.isActive ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PersonRoleLabel kind={m.scope === "BRAND" ? "BRAND_MANAGER" : "OUTLET_MANAGER"} />
                    {m.isYou && <span className="text-[10px] font-bold text-slate-400">{t(`${k}you`)}</span>}
                    {!m.isActive && <span className="text-[10px] font-bold text-rose-500">{t(`${k}deactivated`)}</span>}
                  </div>
                  <p className="text-sm font-bold text-[#1a2b4b] dark:text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.role}</p>
                </div>
                {canManageManagers && (
                  <div className="flex items-center gap-1 shrink-0">
                    {lockReason(m) ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} aria-label={lockReason(m)!} className="inline-flex cursor-not-allowed rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-orange">
                            <Switch checked={m.isActive} disabled aria-label={t(`${k}accessLabel`, { name: m.name })} className="scale-75" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-56 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 [&_svg]:bg-slate-900 [&_svg]:fill-slate-900 dark:[&_svg]:bg-slate-100 dark:[&_svg]:fill-slate-100">
                          {lockReason(m)}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Switch
                        checked={m.isActive}
                        disabled={saveManager.isPending}
                        onCheckedChange={(on) => (on ? void setAccess(m, true) : setSwitchingOff(m))}
                        aria-label={t(`${k}accessLabel`, { name: m.name })}
                        className="scale-75"
                      />
                    )}
                    {editButton(t(`${k}editNamed`, { name: m.name }), () => setTarget({ mode: "editManager", manager: m }))}
                  </div>
                )}
              </div>
              {contactLines(m.mobileNumber, m.email)}
            </li>
          ))}
          {pocs.map((p) => (
            <li key={`p-${p.pocId}`} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <PersonRoleLabel kind={p.scope === "BRAND" ? "BRAND_POC" : "OUTLET_POC"} />
                  <p className="text-sm font-bold text-[#1a2b4b] dark:text-white truncate">{p.pocName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.designation}</p>
                </div>
                {p.editable && editButton(t(`${k}editNamed`, { name: p.pocName }), () => setTarget({ mode: "editPoc", poc: p }))}
              </div>
              {contactLines(p.pocMobileNumber, p.pocEmailAddress)}
            </li>
          ))}
        </ul>
      )}

      {target && (
        <PersonFormDialog
          key={target.mode === "add" ? "add" : target.mode === "editManager" ? target.manager.userId : target.poc.pocId}
          scope={scope}
          target={target}
          canManageManagers={canManageManagers}
          onClose={() => setTarget(null)}
        />
      )}

      <AllOutletsConfirmDialog
        open={switchingOff !== null}
        isLoading={saveManager.isPending}
        title={t(`${k}offTitle`, { name: switchingOff?.name ?? "" })}
        description={t(`${k}offText`)}
        confirmLabel={t(`${k}offConfirm`)}
        cancelLabel={t("dashboard.outletInfo.managers.cancel")}
        onConfirm={() => switchingOff && setAccess(switchingOff, false)}
        onClose={() => setSwitchingOff(null)}
      />
    </InfoSection>
  );
};
