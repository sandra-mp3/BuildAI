"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: SwitchPrimitive.SwitchProps) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "forge-focus-ring relative h-5 w-9 shrink-0 rounded-full bg-bg-inset border border-border-strong transition-colors data-[state=checked]:bg-violet data-[state=checked]:border-violet",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-fg shadow transition-transform duration-150 data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-violet-fg" />
    </SwitchPrimitive.Root>
  );
}
