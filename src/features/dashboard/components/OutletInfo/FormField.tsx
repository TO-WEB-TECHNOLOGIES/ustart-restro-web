import { forwardRef, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * 2026-11-12: label + shadcn Input + error, for the Outlet Info contact and bank dialogs
 * (forwardRef so react-hook-form's register() can attach).
 */
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({ label, error, id, className, ...props }, ref) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
      {label}
    </Label>
    <Input
      id={id}
      ref={ref}
      aria-invalid={!!error}
      {...props}
      className={cn("h-11 rounded-xl text-sm font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-white", className)}
    />
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
));
FormField.displayName = "FormField";
