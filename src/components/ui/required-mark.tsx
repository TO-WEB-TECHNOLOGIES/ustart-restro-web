import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Red asterisk appended to the label of a mandatory field.
 * 2026-10-20: added so every onboarding/menu form marks required fields the same way,
 * instead of each screen hand-typing a "*" with its own styling. No shadcn equivalent
 * exists (shadcn's Label has no required variant). aria-hidden because the asterisk is
 * visual only - screen readers get requiredness from validation messages, and announcing
 * "star" after every label is noise.
 */
const RequiredMark = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    ({ className, ...props }, ref) => (
        <span
            ref={ref}
            aria-hidden="true"
            className={cn("ml-0.5 text-red-500 dark:text-red-400", className)}
            {...props}
        >
            *
        </span>
    )
)
RequiredMark.displayName = "RequiredMark"

export { RequiredMark }
