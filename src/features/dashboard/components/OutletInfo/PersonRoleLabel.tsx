import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * 2026-11-12 (user request): who a person is, with an ⓘ tooltip explaining what that means -
 * managers can log in to the partner dashboard (for the outlet, or every outlet of the brand); POCs
 * are called about outages and issues but can't log in.
 */
export type PersonKind = "OUTLET_MANAGER" | "BRAND_MANAGER" | "OUTLET_POC" | "BRAND_POC";

const TONE: Record<PersonKind, string> = {
  OUTLET_MANAGER: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  BRAND_MANAGER: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  OUTLET_POC: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  BRAND_POC: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
};

export const PersonRoleLabel = ({ kind }: { kind: PersonKind }) => {
  const { t } = useTranslation();
  const k = "dashboard.outletInfo.people.kinds.";
  const label = t(`${k}${kind}.label`);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${TONE[kind]}`}>
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label={t(`${k}${kind}.help`)} className="inline-flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-orange">
            <Info className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 normal-case tracking-normal font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 [&_svg]:bg-slate-900 [&_svg]:fill-slate-900 dark:[&_svg]:bg-slate-100 dark:[&_svg]:fill-slate-100">
          {t(`${k}${kind}.help`)}
        </TooltipContent>
      </Tooltip>
    </span>
  );
};
