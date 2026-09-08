import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f7f64] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#3d4b3e] text-[#f5f3e6] shadow hover:bg-[#1e2320] active:bg-[#1e2320]",
        destructive:
          "bg-rose-700 text-white shadow-sm hover:bg-rose-800 active:bg-rose-900",
        outline:
          "border border-[#c8d0b7] dark:border-[#3d4b3e] bg-transparent shadow-sm hover:bg-[#c8d0b7]/30 dark:hover:bg-[#3d4b3e]/40 text-[#1e2320] dark:text-[#f5f3e6]",
        secondary:
          "bg-[#c8d0b7]/40 dark:bg-[#3d4b3e]/60 text-[#1e2320] dark:text-[#f5f3e6] shadow-sm hover:bg-[#c8d0b7]/70 dark:hover:bg-[#3d4b3e]",
        ghost:
          "hover:bg-[#c8d0b7]/30 dark:hover:bg-[#3d4b3e]/40 text-[#1e2320] dark:text-[#f5f3e6]",
        link: "text-[#3d4b3e] dark:text-[#c8d0b7] underline-offset-4 hover:underline",
        success: "bg-[#6f7f64] text-[#f5f3e6] shadow hover:bg-[#3d4b3e] active:bg-[#1e2320]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
