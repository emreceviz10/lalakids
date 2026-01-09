'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChildSelector } from '@/components/dashboard/child-selector';
import { AddChildModal } from '../components/AddChildModal';
import { FirstTimeUserLayout } from '@/components/parent/FirstTimeUserLayout';
import { ActiveUserLayout } from '@/components/parent/ActiveUserLayout';

interface ClientProps {
    childProfiles: any[];
    activeChild: any;
    stats: any;
    recentCourses: any[];
}

export function ParentDashboardClient({
    childProfiles,
    activeChild,
    stats,
    recentCourses
}: ClientProps) {
    const [queryClient] = useState(() => new QueryClient());
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

    // Optimistic state
    const [optimisticChildId, setOptimisticChildId] = useState(activeChild.id);

    useEffect(() => {
        setOptimisticChildId(activeChild.id);
    }, [activeChild.id, searchParams]);

    const handleSelectChild = async (childId: string) => {
        if (childId === optimisticChildId) return;
        setOptimisticChildId(childId);
        router.push(`/parent/dashboard?child=${childId}`, { scroll: false });
    };

    const displayName = activeChild.display_name || activeChild.first_name;
    const isFirstTimeUser = stats.totalCourses === 0;

    return (
        <QueryClientProvider client={queryClient}>
            <div className="space-y-6 animate-fade-in-up">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-4 flex-1">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                Hoş Geldiniz 👋
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {displayName}&apos;in öğrenme yolculuğunu buradan takip edebilirsiniz.
                            </p>
                        </div>

                        <ChildSelector
                            childProfiles={childProfiles}
                            activeChildId={optimisticChildId}
                            onSelectChild={handleSelectChild}
                            onAddChild={() => setIsAddChildModalOpen(true)}
                        />
                    </div>
                </div>

                {/* Conditional Layout */}
                {isFirstTimeUser ? (
                    <FirstTimeUserLayout
                        selectedChild={activeChild}
                        childProfiles={childProfiles}
                        onSelectChild={handleSelectChild}
                    />
                ) : (
                    <ActiveUserLayout
                        selectedChild={activeChild}
                        childProfiles={childProfiles}
                        onSelectChild={handleSelectChild}
                    />
                )}

                <AddChildModal
                    open={isAddChildModalOpen}
                    onOpenChange={setIsAddChildModalOpen}
                />
            </div>
        </QueryClientProvider>
    );
}
