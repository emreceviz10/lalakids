'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface ChildSelectorProps {
    children: Child[];
    activeChildId: string;
    onSelectChild: (childId: string) => void;
}

/**
 * Child selector tabs
 * PRD 4.9.1: "Parent can switch between children"
 * PRD 10.7: Tab component with active state
 */
export function ChildSelector({ children, activeChildId, onSelectChild }: ChildSelectorProps) {
    if (children.length === 0) {
        return null;
    }

    // Single child - show as header, no tabs needed
    if (children.length === 1) {
        const child = children[0];
        const displayName = child.display_name || child.first_name;

        return (
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="size-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                    {displayName[0].toUpperCase()}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{displayName}</h3>
                    <p className="text-sm text-slate-500">{child.first_name} {child.last_name}</p>
                </div>
            </div>
        );
    }

    // Multiple children - show tabs
    return (
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
            {children.map((child) => {
                const displayName = child.display_name || child.first_name;
                const isActive = child.id === activeChildId;

                return (
                    <button
                        key={child.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onSelectChild(child.id)}
                        className={cn(
                            "flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all",
                            "border-2 min-w-[180px]",
                            isActive
                                ? "bg-primary text-white border-primary shadow-lg scale-105"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50"
                        )}
                    >
                        <div className={cn(
                            "size-10 rounded-full flex items-center justify-center font-bold text-sm",
                            isActive
                                ? "bg-white/20"
                                : "bg-gradient-to-br from-primary to-secondary text-white"
                        )}>
                            {displayName[0].toUpperCase()}
                        </div>
                        <span className="truncate">{displayName}</span>
                    </button>
                );
            })}
        </div>
    );
}
