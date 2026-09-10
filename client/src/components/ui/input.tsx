import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, autoComplete = "off", ...props }, ref) => {
    return (
      <input
        type={type}
        autoComplete={autoComplete}
        className={cn(
          "flex h-9 w-full rounded-md border border-[#d8d5ce] dark:border-[#3d4b3e] bg-white dark:bg-[#1e2320] px-3 py-1 text-sm shadow-2xs transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#888] outline-none focus:outline-none focus:border-[#181818] focus:ring-1 focus:ring-[#181818] dark:focus:border-[#f5f3e6] dark:focus:ring-[#f5f3e6] disabled:cursor-not-allowed disabled:opacity-50 text-[#181818] dark:text-[#f5f3e6]",
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
