import React from "react";
import { cn } from "@/lib/utils";

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "success" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    icon?: string; // Material Symbol name
    iconPosition?: "left" | "right";
    loading?: boolean;
    fullWidth?: boolean;
}

export function Button3D({
    children,
    variant = "primary",
    size = "md",
    icon,
    iconPosition = "right",
    loading = false,
    fullWidth = false,
    className,
    disabled,
    ...props
}: Button3DProps) {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-200 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-3d-default";

    const variantStyles = {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-3d-primary",
        success: "bg-success hover:bg-green-600 text-white shadow-3d-success",
        outline:
            "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-3d-default",
        ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-none active:translate-y-0 active:shadow-none",
    };

    const sizeStyles = {
        sm: "h-10 px-4 text-sm",
        md: "h-14 px-6 text-base",
        lg: "h-16 px-8 text-lg",
    };

    return (
        <button
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && "w-full",
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="animate-spin material-symbols-outlined text-[20px]">
                    progress_activity
                </span>
            ) : null}

            {!loading && icon && iconPosition === "left" && (
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
            )}

            {children}

            {!loading && icon && iconPosition === "right" && (
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
            )}
        </button>
    );
}
