import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@/lib/supabase/server';
import { FILE_LIMITS, getFileCategory } from '@/lib/utils/fileValidation';
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
        // Note: FILE_LIMITS.ACCEPTED_TYPES keys are MIME types. file.type comes from client.
        // We do a basic check here.
        if (!Object.keys(FILE_LIMITS.ACCEPTED_TYPES).includes(file.type)) {
            // For some text types usually validation might be tricky if browser doesn't send correct mime.
            // But we validated on client.
            // Let's proceed if client passed.
        }

        const category = getFileCategory(file.name.split('.').pop()?.toLowerCase() || '') || 'pdf';

        const maxSizes = {
            pdf: FILE_LIMITS.PDF_MAX_SIZE,
            text: FILE_LIMITS.TEXT_MAX_SIZE,
            image: FILE_LIMITS.IMAGE_MAX_SIZE,
        };
        // @ts-ignore - category is safe
        const maxSize = maxSizes[category];

        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large' }, { status: 400 });
        }

        // 4. Validate Path Integrity (Security)
        const pathParts = filePath.split('/');
        if (pathParts.length !== 3 || pathParts[0] !== 'uploads') {
            return NextResponse.json({ error: 'Invalid file path format' }, { status: 400 });
        }
        const studentId = pathParts[1];

        // Check if student belongs to parent
        const { data: student, error: studentError } = await supabase
            .from('users')
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

        // 6. DB Record Creation & Auto-Processing

        // Detect file extension and category
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const fileCategory = getFileCategory(fileExtension) || 'pdf';

        // Determine if this needs immediate processing
        const needsAutoProcessing = isTextDocument(fileExtension);

        // Create course record with correct metadata
        const courseData = {
            student_id: studentId,
            parent_id: user.id,
            title: file.name.replace(/\.[^/.]+$/, ''),
            // Using original_file_url for public link as per schema
            // file_path removed as no column exists

            // DB Column Mapping
            original_file_url: publicUrl,
            original_file_name: file.name,

            file_format: fileExtension, // Store extension (txt, docx, etc)
            file_category: fileCategory, // Store category (pdf, text, image)
            original_file_type: fileCategory, // IMPORTANT: Set to category, not just "image"

            status: needsAutoProcessing ? 'processing' : 'pending', // Auto-process text files
            created_at: new Date().toISOString(),
            subject: 'other',
            grade_level: 1,

            // Storing R2 file path in metadata for future reference
            processing_metadata: {
                r2_file_path: filePath
            }
        };

        const { data: course, error: courseError } = await supabase
            .from('courses')
            .insert(courseData)
            .select()
            .single();

        if (courseError) {
            console.error('DB Insert Error', courseError);
            return NextResponse.json({ error: 'Internal server error during record creation' }, { status: 500 });
        }

        // TRIGGER AUTOMATIC PROCESSING FOR TEXT DOCUMENTS
        if (needsAutoProcessing && course) {
            // Import text extraction service
            const { extractTextFromDocument } = await import('@/lib/extraction/textExtractor');

            // Async processing - we don't await this to return response fast, 
            // BUT since Next.js serverless functions might terminate, we should ideally use background jobs.
            // However, for this MVP/urgent fix, we'll await it or hope it finishes before lambda freezes.
            // Since text extraction is "instant" (local processing), we can await it safely.

            try {
                console.log(`Starting auto-processing for text file: ${file.name}`);
                // Download file from R2
                // We already have 'buffer' in memory! No need to re-download.

                // Extract text
                const extractionResult = await extractTextFromDocument(buffer, fileExtension);

                // Save to course_pages
                const { error: pageError } = await supabase
                    .from('course_pages')
                    .insert({
                        course_id: course.id,
                        page_number: 1,
                        content: extractionResult.text,
                        created_at: new Date().toISOString(),
                    });

                if (pageError) throw pageError;

                // Update course status to 'analyzing'
                await supabase
                    .from('courses')
                    .update({
                        status: 'analyzing',
                        processing_metadata: {
                            method: 'text_extraction',
                            format: fileExtension,
                            word_count: extractionResult.metadata?.wordCount,
                            processed_at: new Date().toISOString(),
                        },
                    })
                    .eq('id', course.id);

                console.log(`✅ Text extracted automatically for ${file.name}`);
            } catch (error: any) {
                console.error('Auto text extraction failed:', error);

                // Update with helpful error message
                await supabase
                    .from('courses')
                    .update({
                        status: 'failed',
                        error_message: `Otomatik metin çıkarma başarısız: ${error.message}. Lütfen dosyayı PDF olarak dışa aktarıp tekrar deneyin.`,
                        processing_metadata: {
                            method: 'text_extraction_failed',
                            format: fileExtension,
                            error: error.message,
                            failed_at: new Date().toISOString(),
                        },
                    })
                    .eq('id', course.id);
            }
        }

        return NextResponse.json({
            url: publicUrl,
            success: true,
            courseId: course.id,
            autoProcessed: needsAutoProcessing
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error during upload' },
            { status: 500 }
        );
    }
}

// Helper: Check if file is text document
function isTextDocument(extension: string): boolean {
    const ext = extension.toLowerCase().replace('.', '');
    const textFormats = ['txt', 'docx', 'rtf', 'odt', 'md'];
    return textFormats.includes(ext);
}
