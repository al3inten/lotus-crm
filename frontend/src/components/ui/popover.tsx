import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/utils";

/**
 * shadcn-style Popover built on Radix. Radix handles focus trapping, outside-click
 * dismissal, keyboard nav and collision-aware positioning — the things hand-rolled
 * dropdowns in this codebase were missing.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl outline-none",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-white",
        "origin-[var(--radix-popover-content-transform-origin)] transition duration-150",
        "data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
        "data-[state=open]:scale-100 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";
