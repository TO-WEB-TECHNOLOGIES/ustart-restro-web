import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Manager, OutletPoc, PeopleScope } from "../../api/outletInfoApi";
import { ManagerForm } from "./ManagerForm";
import { PocForm } from "./PocFormDialog";

/**
 * 2026-11-12: one dialog to add or edit a person of an outlet or the brand. Adding shows tabs to
 * pick what to create - Manager (dashboard access) or POC (contact only) - user request; editing
 * opens the matching form. Managers are offered only to brand-level logins (canManageManagers).
 */
export type PersonTarget =
  | { mode: "add"; initial: "MANAGER" | "POC" }
  | { mode: "editManager"; manager: Manager }
  | { mode: "editPoc"; poc: OutletPoc };

interface PersonFormDialogProps {
  scope: PeopleScope;
  target: PersonTarget;
  canManageManagers: boolean;
  onClose: () => void;
}

export const PersonFormDialog = ({ scope, target, canManageManagers, onClose }: PersonFormDialogProps) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.people.";
  const [kind, setKind] = useState<"MANAGER" | "POC">(
    target.mode === "add" ? (canManageManagers ? target.initial : "POC") : target.mode === "editManager" ? "MANAGER" : "POC",
  );
  const where = scope.kind === "brand" ? t(`${k}whereBrand`) : t(`${k}whereOutlet`);
  const title = target.mode === "add"
    ? t(`${k}addTitle`, { where })
    : t(target.mode === "editManager" ? `${k}editManager` : `${k}editPoc`);

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-xl rounded-[28px] p-6 sm:p-8 gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="space-y-1">
          <DialogTitle className="text-xl font-bold text-[#1a2b4b] dark:text-white">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">{t(`${k}verifyHint`)}</DialogDescription>
        </div>
        {target.mode === "add" && canManageManagers && (
          <Tabs value={kind} onValueChange={(value) => setKind(value as "MANAGER" | "POC")}>
            <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 h-auto inline-flex gap-1 rounded-full border border-slate-200 dark:border-slate-700">
              {(["MANAGER", "POC"] as const).map((id) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="rounded-full px-5 py-2 font-bold text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                >
                  {t(`${k}tabs.${id}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        {kind === "MANAGER" ? (
          <ManagerForm key="manager" scope={scope} manager={target.mode === "editManager" ? target.manager : null} onDone={onClose} />
        ) : (
          <PocForm key="poc" scope={scope} poc={target.mode === "editPoc" ? target.poc : null} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};
