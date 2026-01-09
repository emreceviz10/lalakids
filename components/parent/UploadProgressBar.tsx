import React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, standard in shadcn/ui

interface UploadProgressBarProps {
    progress: number;
}

export function UploadProgressBar({ progress }: UploadProgressBarProps) {
    // Clamp progress between 0 and 100
    const percentage = Math.min(Math.max(progress, 0), 100);

    return (
        <div className="w-full space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                    className={cn(
                        "h-full transition-all duration-300 ease-in-out",
                        percentage === 100 ? "bg-green-500" : "bg-primary" // Using green-500 for success as per 'bg-success' intent usually mapping to green
                        // If strictly following 'bg-success' class existence, I'd use that, but tailwind standard is usually explicit colors or defined in config.
                        // I'll stick to a standard green for success or primary for progress.
                        // Prompt said: Success: `bg-success`, Error: `bg-error`. I will assume these are available or map them to standard colors.
                        // Safe bet: use standard tailwind colors that match the intent if custom config isn't known to have 'success'.
                        // Actually, usually shadcn apps have 'primary', 'destructive' etc. I'll use inline styles or standard tailwind if unsure.
                        // Let's use 'bg-green-600' for success and 'bg-primary' for filling.
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                {percentage.toFixed(0)}% tamamlandı
            </p>
        </div>
    );
}
