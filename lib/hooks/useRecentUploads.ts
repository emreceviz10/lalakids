import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useRecentUploads(studentId: string) {
    return useQuery({
        queryKey: ['recent-uploads', studentId],
        queryFn: async () => {
            const supabase = createClient();

            // Get all uploaded files for this student
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data;
        },
        enabled: !!studentId,
    });
}
