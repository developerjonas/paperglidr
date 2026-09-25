import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: flat pill, blue primary, hairline outline
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        destructiveOutline:
          "border border-destructive/40 bg-background text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs [&_svg]:size-3.5",
        lg: "h-12 px-7 text-base [&_svg]:size-5",
        xl: "h-14 px-9 text-base font-semibold [&_svg]:size-5",
        icon: "h-10 w-10",
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
