import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useChildStats(studentId: string) {
    return useQuery({
        queryKey: ['child-stats', studentId],
        queryFn: async () => {
            const supabase = createClient();

            // Get total materials
            const { count: totalMaterials } = await supabase
                .from('courses')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', studentId);

            // Get weekly study time (from student_progress)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const { data: weeklyProgress } = await supabase
                .from('student_progress')
                .select('total_time_spent_seconds')
                .eq('student_id', studentId)
                .gte('last_accessed_at', oneWeekAgo.toISOString());

            const weeklySeconds = weeklyProgress?.reduce(
                (sum, p) => sum + (p.total_time_spent_seconds || 0),
                0
            ) || 0;
            const weeklyHours = (weeklySeconds / 3600).toFixed(1);

            // Get total XP
            const { data: student } = await supabase
                .from('users')
                .select('total_xp')
                .eq('id', studentId)
                .single();

            return {
                totalMaterials: totalMaterials || 0,
                weeklyHours: parseFloat(weeklyHours),
                totalXP: student?.total_xp || 0
            };
        },
        enabled: !!studentId,
    });
}
