import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "forge-focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-violet text-violet-fg shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-110 active:brightness-95",
        secondary:
          "bg-bg-elevated text-fg border border-border-strong hover:bg-bg-inset",
        ghost: "text-fg-muted hover:text-fg hover:bg-bg-elevated",
        outline: "border border-border text-fg hover:bg-bg-elevated",
        destructive: "bg-error/10 text-error border border-error/30 hover:bg-error/15",
        link: "text-violet underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
