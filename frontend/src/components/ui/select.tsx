import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * shadcn-style Select on Radix. Replaces native <select> elements, which can't be
 * styled consistently across browsers and looked out of place next to the app's
 * rounded, theme-aware form fields.
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors",
      "hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800/60",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown size={15} className="shrink-0 text-slate-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-white",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm font-medium outline-none transition-colors",
      "focus:bg-slate-100 data-[state=checked]:text-blue-600",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "dark:focus:bg-slate-800 dark:data-[state=checked]:text-blue-400",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex items-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={15} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";
