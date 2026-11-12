import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * 2026-11-12: one titled card on the outlet detail page, plus a label/value row. Same card look as
 * the Outlet Schedule panels (white/slate-900, rounded-[24px]).
 */
interface InfoSectionProps {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const InfoSection = ({ icon: Icon, title, action, children }: InfoSectionProps) => (
  <section className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-[#1a2b4b] dark:text-white">
        <Icon className="w-5 h-5 text-secondary-orange" />
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

/** Label above value; `value` empty → the "Not set" placeholder passed by the caller. */
export const InfoField = ({ label, value, fallback }: { label: string; value?: ReactNode; fallback: string }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
    <div className="mt-1 text-sm font-semibold text-[#1a2b4b] dark:text-slate-100 break-words">
      {value === undefined || value === null || value === "" ? (
        <span className="font-medium text-slate-400 dark:text-slate-500">{fallback}</span>
      ) : value}
    </div>
  </div>
);
