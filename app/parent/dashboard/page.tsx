import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
    getParentChildren,
    getChildDashboardStats,
    getChildRecentCourses
} from '@/lib/queries/parent-dashboard';
import { ChildSelector } from '@/components/dashboard/child-selector';
import { ParentDashboardClient } from './client';

/**
 * Parent Dashboard - Server Component
 * PRD 4.9.1: Dashboard Overview with child selector and real stats
 */
export default async function ParentDashboardPage({
    searchParams,
}: {
    searchParams: { child?: string };
}) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        redirect('/login');
    }

    // Get all children
    const children = await getParentChildren();

    // If no children, show onboarding
    if (children.length === 0) {
        return <NoChildrenView />;
    }

    // Determine active child (from URL param or default to first)
    const activeChildId = searchParams.child || children[0].id;
    const activeChild = children.find(c => c.id === activeChildId) || children[0];

    // Fetch stats for active child
    const stats = await getChildDashboardStats(activeChild.id);
    const recentCourses = await getChildRecentCourses(activeChild.id);

    return (
        <ParentDashboardClient
            children={children}
            activeChild={activeChild}
            stats={stats}
            recentCourses={recentCourses}
        />
    );
}

/**
 * No children view - prompts parent to add first child
 * PRD 4.1.2: First-time parent experience
 */
function NoChildrenView() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-5xl">👶</span>
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    Hoş Geldiniz! 🎉
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    Çocuğunuzun öğrenme yolculuğuna başlamak için önce bir profil oluşturalım.
                </p>
            </div>
            <button
                className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
            >
                <span className="material-symbols-outlined">add</span>
                İlk Çocuk Profilini Oluştur
            </button>
        </div>
    );
}
