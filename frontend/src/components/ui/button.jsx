import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* CampusOS buttons: flat print-shop blocks, hairline borders, a
   single shared press curve (.co-press) so every control in the app
   depresses by exactly the same amount. */

const buttonVariants = cva(
  [
    "co-press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm",
    "text-[13px] font-semibold tracking-[-0.005em] outline-none",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* headline action — amber, per the reference sheet */
        default: "bg-amber text-ink hover:bg-amber-deep",
        /* high-contrast alternative for dense toolbars */
        ink: "bg-ink text-paper hover:bg-ink-2",
        secondary: "bg-bone-2 text-ink hover:bg-line",
        outline: "border border-line bg-paper text-ink hover:border-mut-2/60 hover:bg-bone",
        ghost: "text-mut hover:bg-bone-2 hover:text-ink",
        destructive: "bg-red text-white hover:bg-red/90",
        subtle: "border border-red/30 bg-red-soft text-red hover:bg-red/15",
        link: "text-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 has-[>svg]:px-3.5",
        sm: "h-8 gap-1.5 px-3 text-[12px] has-[>svg]:px-2.5",
        lg: "h-10 px-5 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
