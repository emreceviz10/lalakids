import { createClient } from '@/lib/supabase/server';

export interface ChildStats {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    avatar_url: string | null;
    total_xp: number;
    current_streak: number;
    grade_level: number;
}

export interface DashboardStats {
    totalCourses: number;
    weeklyMinutes: number;
    totalXP: number;
    activeLessons: number;
}

/**
 * Get all children for the logged-in parent
 * PRD 4.9.1: Parent can view and switch between multiple children
 */
export async function getParentChildren(): Promise<ChildStats[]> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    // Query children (PRD: role='student' AND parent_id matches)
    const { data: children, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, display_name, avatar_url, total_xp, current_streak, grade_level')
        .eq('parent_id', user.id)
        .eq('role', 'student')
        .order('created_at', { ascending: true });

    if (error) throw error;
    return children || [];
}

/**
 * Get dashboard stats for a specific child
 * PRD 4.9.1: Show streak, XP, active lessons, and weekly time
 */
export async function getChildDashboardStats(childId: string): Promise<DashboardStats> {
    const supabase = await createClient();

    // Get child's basic info
    const { data: child, error: childError } = await supabase
        .from('users')
        .select('total_xp, current_streak')
        .eq('id', childId)
        .single();

    if (childError) throw childError;

    // Count total courses for this child
    const { count: coursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', childId);

    if (coursesError) throw coursesError;

    // Count active lessons (not completed)
    const { count: activeCount, error: activeError } = await supabase
        .from('student_progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', childId)
        .neq('status', 'completed');

    if (activeError) throw activeError;

    // Calculate weekly minutes (sum of time from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('total_time_spent_seconds')
        .eq('student_id', childId)
        .gte('last_accessed_at', sevenDaysAgo.toISOString());

    if (progressError) throw progressError;

    const totalSeconds = progressData?.reduce((sum, p) => sum + (p.total_time_spent_seconds || 0), 0) || 0;
    const weeklyMinutes = Math.round(totalSeconds / 60);

    return {
        totalCourses: coursesCount || 0,
        weeklyMinutes,
        totalXP: child.total_xp || 0,
        activeLessons: activeCount || 0,
    };
}

/**
 * Get recent courses for a child
 * PRD 4.9.1: Show list of courses with status
 */
export async function getChildRecentCourses(childId: string, limit: number = 5) {
    const supabase = await createClient();

    const { data: courses, error } = await supabase
        .from('courses')
        .select(`
      id,
      title,
      subject,
      status,
      thumbnail_url,
      created_at,
      student_progress (
        status,
        scenes_completed,
        quiz_score,
        last_accessed_at
      )
    `)
        .eq('student_id', childId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return courses || [];
}
