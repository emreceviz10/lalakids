import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = userData?.role || 'student'; // Default to student if unknown

    if (role === 'parent') {
        redirect('/parent/dashboard');
    } else if (role === 'student') {
        redirect('/student/dashboard'); // Will need to be implemented
    } else {
        // Admin or other roles fallback
        redirect('/parent/dashboard');
    }
}
