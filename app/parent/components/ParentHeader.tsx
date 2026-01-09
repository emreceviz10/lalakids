'use client';

import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

export function ParentHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex h-16 md:h-20 items-center justify-between">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h1 className="text-xl font-bold font-lexend hidden sm:block text-slate-900 dark:text-white">
                            Lala Kids
                        </h1>
                    </div>

                    {/* Right: User menu */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
