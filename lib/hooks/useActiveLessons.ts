import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useActiveLessons(studentId: string) {
    return useQuery({
        queryKey: ['active-lessons', studentId],
        queryFn: async () => {
            const supabase = createClient();

            // Get lessons with progress > 0
            const { data, error } = await supabase
                .from('student_progress')
                .select(`
          id,
          status,
          scenes_completed,
          current_scene_index,
          last_accessed_at,
          courses (
            id,
            title,
            subject,
            grade_level,
            status
          )
        `)
                .eq('student_id', studentId)
                .neq('status', 'completed')
                .order('last_accessed_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            // Map to add progress_percentage since it's not in DB
            return data.map((item: any) => ({
                ...item,
                progress_percentage: item.scenes_completed ? Math.min(item.scenes_completed * 10, 90) : 0 // Fallback logic
            }));
        },
        enabled: !!studentId,
    });
}
