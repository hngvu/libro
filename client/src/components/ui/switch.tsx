import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        ref={ref}
        onClick={(e) => {
          onClick?.(e)
          if (!e.defaultPrevented) {
            onCheckedChange?.(!checked)
          }
        }}
        className={cn(
          "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2979ff] disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "bg-emerald-500 dark:bg-emerald-600"
            : "bg-gray-300 dark:bg-[#333a48]",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-xs ring-0 transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0.5"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
