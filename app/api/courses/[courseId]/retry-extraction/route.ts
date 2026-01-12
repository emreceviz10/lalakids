import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
// We need to fetch the file from R2. 
// We can use the helper in process-ocr route logic or just reimplement download here.
// Reimplementing S3 download for simplicity here as we don't have a shared download helper exported from route.ts
// But wait, process-ocr has `downloadFileFromR2`. Let's assume we can't easily import it if it's not exported.
// I will implement a basic retrieval here using the stored R2 path.

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { extractTextFromDocument } from '@/lib/extraction/textExtractor';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    const { courseId } = await params;
    try {
        const supabase = await createClient();

        // Get course details
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json(
                { error: 'Kurs bulunamadı' },
                { status: 404 }
            );
        }

        // Check if it's a text document
        const isText = ['txt', 'docx', 'rtf', 'odt', 'md'].includes(
            course.file_format?.toLowerCase() || ''
        );

        if (!isText) {
            return NextResponse.json(
                { error: 'Bu dosya türü için tekrar deneme desteklenmiyor' },
                { status: 400 }
            );
        }

        // Retrieve R2 path from metadata or construct it?
        // In our improved upload route, we stored it in `processing_metadata.r2_file_path`
        // OR we can try to reconstruct it: uploads/{studentId}/{filename} (but filename has timestamp prefix...)
        // Wait, we removed `file_path` column.

        let r2Key = course.processing_metadata?.r2_file_path;

        if (!r2Key) {
            // Fallback: This might be hard if we don't have the key.
            // We might need to list objects or use the original_file_url if it contains the key.
            // publicUrl is usually .../uploads/...
            if (course.original_file_url) {
                const urlParts = course.original_file_url.split('/');
                // find 'uploads' index
                const uploadIndex = urlParts.indexOf('uploads');
                if (uploadIndex !== -1) {
                    r2Key = urlParts.slice(uploadIndex).join('/');
                }
            }
        }

        if (!r2Key) {
            return NextResponse.json(
                { error: 'Dosya yolu bulunamadı.' },
                { status: 404 }
            );
        }

        console.log(`Retrying extraction for ${courseId}, key: ${r2Key}`);

        // Update status to processing
        await supabase
            .from('courses')
            .update({ status: 'processing', error_message: null })
            .eq('id', courseId);

        // Download and Process
        const r2Client = new S3Client({
            region: 'auto',
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
            }
        });

        const { Body } = await r2Client.send(new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: r2Key,
        }));

        if (!Body) {
            throw new Error('File body is empty');
        }

        // Convert stream to buffer
        const byteArray = await Body.transformToByteArray();
        const buffer = Buffer.from(byteArray);

        const extractionResult = await extractTextFromDocument(buffer, course.file_format);

        // Save pages
        // First delete old pages if any (though usually empty on fail)
        await supabase.from('course_pages').delete().eq('course_id', course.id);

        const { error: pageError } = await supabase
            .from('course_pages')
            .insert({
                course_id: course.id,
                page_number: 1,
                content: extractionResult.text,
                created_at: new Date().toISOString(),
            });

        if (pageError) throw pageError;

        // Update status to analyzing
        await supabase
            .from('courses')
            .update({
                status: 'analyzing',
                processing_metadata: {
                    ...course.processing_metadata,
                    method: 'text_extraction_retry',
                    format: course.file_format,
                    word_count: extractionResult.metadata?.wordCount,
                    processed_at: new Date().toISOString(),
                    retry_count: (course.processing_metadata?.retry_count || 0) + 1
                },
            })
            .eq('id', course.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Retry extraction error:', error);

        // Update status to failed again
        const supabase = await createClient(); // re-init just in case
        await supabase
            .from('courses')
            .update({
                status: 'failed',
                error_message: `Tekrar deneme başarısız: ${error.message}`
            })
            .eq('id', courseId);

        return NextResponse.json(
            { error: 'Tekrar deneme başarısız: ' + error.message },
            { status: 500 }
        );
    }
}
