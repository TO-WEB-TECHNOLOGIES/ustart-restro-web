import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-300 dark:focus-visible:ring-slate-300 dark:focus-visible:ring-offset-slate-950",
            className
        )}
        ref={ref}
        {...props}
    >
        <span
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
                "pointer-events-none block h-7 w-7 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0"
            )}
        />
    </button>
))
Switch.displayName = "Switch"

export { Switch }
