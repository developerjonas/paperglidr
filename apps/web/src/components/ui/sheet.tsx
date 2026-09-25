"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// A dialog that slides in from the side — the mobile navigation drawer.
const Sheet = DialogPrimitive.Root

const SheetTrigger = DialogPrimitive.Trigger

const SheetClose = DialogPrimitive.Close

const SheetTitle = DialogPrimitive.Title

const SheetDescription = DialogPrimitive.Description

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right"
  }
>(({ className, children, side = "right", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 z-50 flex h-full w-[86%] max-w-sm flex-col bg-background shadow-2xl duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out",
        side === "right"
          ? "right-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          : "left-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X className="h-5 w-5" />
        <span className="sr-only">Close menu</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription }
