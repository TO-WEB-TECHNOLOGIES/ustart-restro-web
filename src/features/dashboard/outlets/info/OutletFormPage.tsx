import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * 2026-11-12: full-page shell for the Outlet Info add / edit forms (user request: the onboarding
 * outlet form as a page, not a modal) - back link, title and subtitle above the form.
 */
interface OutletFormPageProps {
  backTo: string;
  backLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const OutletFormPage = ({ backTo, backLabel, title, subtitle, children }: OutletFormPageProps) => (
  // 2026-11-12: clear space under the form's buttons (see Outlet Info's PAGE_CLASS).
  <div className="flex-1 min-h-[calc(100vh-64px)] flex flex-col pb-16 bg-[#f6f8f7] dark:bg-slate-950 transition-colors duration-300">
    <div className="px-6 md:px-10 pt-6 md:pt-8 space-y-2">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-secondary-orange">
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>
      <h1 className="text-2xl sm:text-[28px] font-bold text-[#1a2b4b] dark:text-white">{title}</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
    </div>
    {children}
  </div>
);
