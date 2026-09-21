"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

// Dropdown menu
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  ...props
}: DropdownPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={6}
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-bg-elevated p-1 shadow-xl animate-fade-in",
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: DropdownPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "forge-focus-ring flex cursor-pointer select-none items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm text-fg outline-none transition-colors data-[highlighted]:bg-bg-inset",
        className
      )}
      {...props}
    />
  );
}

// Tabs
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 rounded-md bg-bg-elevated p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "forge-focus-ring rounded-sm px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors data-[state=active]:bg-bg-panel data-[state=active]:text-fg data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;

// Tooltip
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, ...props }: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={6}
        className={cn(
          "z-50 rounded-md border border-border bg-bg-elevated px-2.5 py-1 text-xs text-fg shadow-lg animate-fade-in",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

// Avatar
export function Avatar({ className, ...props }: AvatarPrimitive.AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn("inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-violet/15 border border-violet/25", className)}
      {...props}
    />
  );
}
export const AvatarImage = AvatarPrimitive.Image;
export function AvatarFallback({ className, ...props }: AvatarPrimitive.AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      className={cn("text-xs font-semibold text-violet", className)}
      {...props}
    />
  );
}
