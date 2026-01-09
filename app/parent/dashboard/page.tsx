import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ParentDashboardClient } from './client';
import { EmptyChildState } from './empty-state';
import { ParentHeader } from '../components/ParentHeader';
import { ParentUploadSection } from './upload-section';

export default async function ParentDashboard({
    searchParams,
}: {
    searchParams: { child?: string }
}) {
    const supabase = await createClient();

    // 1. Check parent auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // 2. Fetch children (using public.users for now)
    const { data: childProfiles, error: childrenError } = await supabase
        .from('users')
        .select('*')
        .eq('parent_id', user.id)
        .eq('role', 'student');

    if (childrenError) {
        console.error('Error fetching children:', childrenError);
    }

    // 3. Handle Empty State
    if (!childProfiles || childProfiles.length === 0) {
        return (
            <>
                <ParentHeader />
                <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8">
                        <EmptyChildState />
                    </div>
                </div>
            </>
        );
    }

    // 4. Determine Active Child
    const selectedChildId = (await searchParams).child;
    let activeChild = childProfiles[0];

    if (selectedChildId) {
        const found = childProfiles.find(c => c.id === selectedChildId);
        if (found) activeChild = found;
    }

    // 5. Fetch Real Stats
    // Active Child ID
    const childId = activeChild.id;

    // Fetch total courses assigned/completed
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('student_id', childId);

    // Fetch user XP
    const { data: childUser, error: userError } = await supabase
        .from('users')
        .select('total_xp')
        .eq('id', childId)
        .single();

    // Fetch progress for weekly time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: progress, error: progressError } = await supabase
        .from('student_progress')
        .select('total_time_spent, created_at')
        .eq('student_id', childId)
        .gte('created_at', sevenDaysAgo.toISOString());

    // Calculate weekly time
    const weeklyTimeSeconds = progress?.reduce((total, p) => {
        return total + (p.total_time_spent || 0);
    }, 0) || 0;

    const weeklyMinutes = Math.floor(weeklyTimeSeconds / 60);
    const formattedTime = `${weeklyMinutes}dk`;

    const stats = {
        totalCourses: courses?.length || 0,
        weeklyMinutes: formattedTime, // Pass formatted string
        totalXP: childUser?.total_xp || 0,
        streak: activeChild.current_streak || 0,
    };

    const recentCourses: any[] = []; // Still mock for now as requested only stats update

    return (
        <>
            <ParentHeader />
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8">
                    <ParentDashboardClient
                        childProfiles={childProfiles}
                        activeChild={activeChild}
                        stats={stats}
                        recentCourses={recentCourses}
                    />

                </div>
            </div>
        </>
    );
}
