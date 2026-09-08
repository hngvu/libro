import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-[#c8d0b7] dark:border-[#3d4b3e] bg-white/80 dark:bg-[#1e2320]/80 px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6f7f64]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f7f64] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 text-[#1e2320] dark:text-[#f5f3e6]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
