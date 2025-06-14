import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Yelp-inspired base style
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-display uppercase font-bold tracking-tight text-base ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] shadow-[0_3px_10px_0_rgba(211,35,35,0.10)] hover:shadow-[0_6px_16px_0_rgba(211,35,35,0.11)] active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 btn-default",
        destructive: "bg-destructive text-white btn-secondary",
        outline: "border-2 border-primary text-primary bg-white hover:bg-primary/5 btn-outline",
        secondary: "bg-secondary text-white btn-secondary",
        ghost: "hover:bg-gray-100 text-gray-900 shadow-none hover:shadow-none active:scale-100",
        link: "text-primary underline underline-offset-2 hover:text-secondary shadow-none hover:shadow-none active:scale-100",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-13 rounded-lg px-8 text-xl",
        icon: "h-11 w-11",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
