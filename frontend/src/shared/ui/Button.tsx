import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" &&
          "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800 active:bg-neutral-700",
        variant === "secondary" &&
          "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100",
        variant === "ghost" &&
          "bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 active:bg-neutral-200",
        variant === "danger" &&
          "bg-red-600 text-white border-red-600 hover:bg-red-700 active:bg-red-800",
        variant === "outline" &&
          "bg-transparent text-white border-white/20 hover:bg-white/10 active:bg-white/20",
        size === "sm" && "text-sm px-3 py-1.5 h-8 gap-1.5",
        size === "md" && "text-sm px-4 py-2 h-10 gap-2",
        size === "lg" && "text-base px-6 py-3 h-12 gap-2.5",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}


