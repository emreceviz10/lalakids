import { createClient } from '@/lib/supabase/server';
import { ChildProfileSchema } from '@/lib/validation/childSchema';
import { uploadAvatar } from '@/lib/storage/r2';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Get authenticated parent
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();

        // Extract fields
        const rawData: Record<string, any> = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            date_of_birth: formData.get('date_of_birth'),
            grade_level: formData.get('grade_level'),
        };

        const displayName = formData.get('display_name');
        if (displayName) rawData.display_name = displayName;

        // Validate fields (excluding avatar for now)
        const validated = ChildProfileSchema.omit({ avatar_url: true }).parse(rawData);

        // 2. Upload avatar if provided
        let avatar_url: string | null = null;
        const avatarFile = formData.get('avatar_file');

        if (avatarFile && avatarFile instanceof File) {
            // Validate file type/size server side too if strictly needed, 
            // but R2 utility handles the upload.
            // Basic check:
            if (avatarFile.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: 'Avatar file size must be less than 5MB' }, { status: 400 });
            }
            if (!['image/jpeg', 'image/png'].includes(avatarFile.type)) {
                return NextResponse.json({ error: 'Only JPG and PNG files are allowed' }, { status: 400 });
            }

            avatar_url = await uploadAvatar(avatarFile, user.id);
        }

        // 4. Insert child user
        const childId = crypto.randomUUID();
        const { data: child, error } = await supabase
            .from('users')
            .insert({
                id: childId,
                email: null,
                first_name: validated.first_name,
                last_name: validated.last_name,
                display_name: validated.display_name || null,
                date_of_birth: new Date(validated.date_of_birth).toISOString(), // Ensure ISO string for DB
                grade_level: validated.grade_level,
                avatar_url: avatar_url,
                role: 'student',
                parent_id: user.id,
                preferred_language: 'tr',
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        return NextResponse.json({ child });

    } catch (error: any) {
        console.error('Create child error:', error);
        if (error.errors) {
            // Zod error
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
