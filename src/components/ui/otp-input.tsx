import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface OtpInputProps {
    length?: number
    value: string
    onChange: (value: string) => void
}

export const OtpInput = ({ length = 4, value, onChange }: OtpInputProps) => {
    const inputs = React.useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const val = e.target.value
        if (isNaN(Number(val))) return

        const newValue = value.split("")
        newValue[idx] = val.substring(val.length - 1)
        const finalValue = newValue.join("")
        onChange(finalValue)

        // Auto focus next
        if (val && idx < length - 1) {
            inputs.current[idx + 1]?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === "Backspace" && !value[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus()
        }
    }

    return (
        <div className="flex gap-2 justify-center my-2">
            {Array.from({ length }).map((_, idx) => (
                <Input
                    key={idx}
                    ref={(el) => { inputs.current[idx] = el }}
                    className={cn(
                        "w-15 h-12 text-center text-lg rounded-4xl border-slate-300",
                        // Active state styling if needed
                    )}
                    value={value[idx] || ""}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    maxLength={1}
                />
            ))}
        </div>
    )
}
