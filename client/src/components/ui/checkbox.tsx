import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { IconCheck, IconMinus } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-[4px] border border-gray-300 dark:border-[#3e4756] [.dark_&]:border-[#3e4756] bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2979ff] disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 dark:hover:border-[#5a667b] [.dark_&]:hover:border-[#5a667b] data-[state=checked]:bg-[#066fd1] data-[state=checked]:border-[#066fd1] data-[state=checked]:text-white data-[state=indeterminate]:bg-[#066fd1] data-[state=indeterminate]:border-[#066fd1] data-[state=indeterminate]:text-white transition-colors cursor-pointer flex items-center justify-center shadow-xs",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      {props.checked === "indeterminate" ? (
        <IconMinus className="h-3 w-3 stroke-[3.5]" />
      ) : (
        <IconCheck className="h-3 w-3 stroke-[3.5]" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
