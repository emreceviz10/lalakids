import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@/lib/supabase/server';
import { FILE_LIMITS } from '@/lib/utils/fileValidation';
// We'll trust the Content-Type header from the client for the initial check,
// but for extra security in production we might use 'file-type' to inspect the buffer.
// Since we are creating a focused MVC, we will stick to standard checks and basic validation first.

export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get file and path
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const filePath = request.headers.get('X-File-Path');

        if (!file || !filePath) {
            return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
        }

        // 3. Server-side validation
        if (!Object.keys(FILE_LIMITS.ACCEPTED_TYPES).includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const maxSize = file.type === 'application/pdf'
            ? FILE_LIMITS.PDF_MAX_SIZE
            : FILE_LIMITS.IMAGE_MAX_SIZE;

        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large' }, { status: 400 });
        }

        // 4. Validate Path Integrity (Security)
        // Ensure the user is uploading to their own student's folder or a folder they are allowed to.
        // The path format is `uploads/{studentId}/{timestamp}_{uuid}.{ext}`
        // We should ideally verify that the studentId belongs to the parent.
        const pathParts = filePath.split('/');
        if (pathParts.length !== 3 || pathParts[0] !== 'uploads') {
            return NextResponse.json({ error: 'Invalid file path format' }, { status: 400 });
        }
        const studentId = pathParts[1];

        // Check if student belongs to parent
        const { data: student, error: studentError } = await supabase
            .from('users') // Assuming children are in 'users' table or a 'students' table. PRD implies `users` table based on RLS policy.
            .select('id')
            .eq('id', studentId)
            .eq('parent_id', user.id)
            .single();

        if (studentError || !student) {
            return NextResponse.json({ error: 'Invalid student ID or unauthorized' }, { status: 403 });
        }

        // 5. Upload to R2
        const r2Client = new S3Client({
            region: 'auto',
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
            }
        });

        const buffer = Buffer.from(await file.arrayBuffer());

        await r2Client.send(new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: filePath,
            Body: buffer,
            ContentType: file.type
        }));

        const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${filePath}`;

        return NextResponse.json({ url: publicUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error during upload' },
            { status: 500 }
        );
    }
}
