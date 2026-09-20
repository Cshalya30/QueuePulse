import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "live"
    | "danger"
    | "warning";
  size?: "sm" | "md" | "lg" | "icon" | "compact";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-live/50 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      compact: "h-7 px-2.5 text-xs gap-1.5",
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-5 text-base gap-2.5",
      icon: "h-8 w-8 p-0",
    };

    const variantStyles = {
      primary:
        "bg-surface-3 text-text-primary border border-border-strong hover:bg-surface-2 hover:border-white/20 shadow-sm",
      secondary:
        "bg-surface-2 text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-surface-3",
      outline:
        "bg-transparent text-text-secondary border border-border-subtle hover:text-text-primary hover:border-border-strong",
      ghost:
        "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2",
      live:
        "bg-accent-live text-[#111214] font-semibold hover:bg-[#c9f98f] shadow-sm shadow-accent-live/20",
      danger:
        "bg-accent-critical/10 text-accent-critical border border-accent-critical/30 hover:bg-accent-critical/20",
      warning:
        "bg-accent-warning/10 text-accent-warning border border-accent-warning/30 hover:bg-accent-warning/20",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
