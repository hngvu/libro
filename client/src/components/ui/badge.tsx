import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#6f7f64] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#3d4b3e] text-[#f5f3e6] shadow hover:bg-[#1e2320]",
        secondary:
          "border-transparent bg-[#c8d0b7]/50 dark:bg-[#3d4b3e]/60 text-[#1e2320] dark:text-[#f5f3e6] hover:bg-[#c8d0b7]",
        destructive:
          "border-transparent bg-rose-700 text-white shadow hover:bg-rose-800",
        success:
          "border-transparent bg-[#6f7f64] text-[#f5f3e6] shadow hover:bg-[#3d4b3e]",
        warning:
          "border-transparent bg-amber-600 text-white shadow hover:bg-amber-700",
        outline: "text-[#1e2320] dark:text-[#f5f3e6] border-[#c8d0b7] dark:border-[#3d4b3e]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
