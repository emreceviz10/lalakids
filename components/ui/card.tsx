import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "elevated" | "flat" | "glass";
    padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
    children,
    variant = "elevated",
    padding = "md",
    className,
    ...props
}: CardProps) {
    const baseStyles = "rounded-3xl transition-all duration-200";

    const variantStyles = {
        elevated: "bg-white dark:bg-slate-800 shadow-card border border-slate-100 dark:border-slate-700",
        flat: "bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700",
        glass: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700/30 shadow-card",
    };

    const paddingStyles = {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div
            className={cn(
                baseStyles,
                variantStyles[variant],
                paddingStyles[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
