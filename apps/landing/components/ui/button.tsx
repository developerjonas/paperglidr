import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: tactile, works in both themes, no assumptions about a "light" surface
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold tracking-tight transition-all duration-200 ease-out active:scale-[0.97] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.1),0_8px_20px_-8px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.1),0_14px_28px_-10px_rgba(0,0,0,0.5)] hover:brightness-[1.04] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_20px_-8px_rgba(0,0,0,0.7)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_14px_28px_-10px_rgba(0,0,0,0.8)]",
        destructive:
          "bg-gradient-to-b from-destructive to-destructive/85 text-destructive-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_8px_20px_-8px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 hover:brightness-[1.04] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_14px_28px_-10px_rgba(220,38,38,0.5)]",
        destructiveOutline:
          "border border-destructive/40 bg-destructive/[0.04] text-destructive backdrop-blur-sm hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground hover:shadow-[0_10px_24px_-10px_rgba(220,38,38,0.5)]",
        outline:
          "border border-input/70 bg-background/60 backdrop-blur-md shadow-sm hover:-translate-y-0.5 hover:border-accent-foreground/20 hover:bg-accent/70 hover:text-accent-foreground hover:shadow-md dark:bg-white/[0.03] dark:hover:bg-white/[0.07]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 hover:bg-secondary/70 hover:shadow-md",
        ghost:
          "hover:-translate-y-0.5 hover:bg-accent/70 hover:text-accent-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 [&_svg]:size-4",
        sm: "h-8 rounded-xl px-3.5 text-xs [&_svg]:size-3.5",
        lg: "h-12 rounded-2xl px-8 text-base [&_svg]:size-5",
        xl: "h-14 rounded-[1.25rem] px-10 text-base font-bold [&_svg]:size-5",
        icon: "h-10 w-10 [&_svg]:size-4",
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
