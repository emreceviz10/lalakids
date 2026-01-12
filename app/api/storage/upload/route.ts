import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Lütfen giriş yapın' },
                { status: 401 }
            );
        }

        // Get file metadata from request
        // File is ALREADY uploaded to R2 at this point
        const body = await request.json();
        const {
            fileKey,
            publicUrl,
            fileName,
            fileSize,
            fileType,
            category,
            extension,
        } = body;

        if (!fileKey || !publicUrl || !fileName) {
            return NextResponse.json(
                { error: 'Dosya bilgileri eksik' },
                { status: 400 }
            );
        }

        // Determine if needs auto-processing
        const textFormats = ['txt', 'docx', 'doc', 'rtf', 'odt', 'md'];
        const needsAutoProcessing = textFormats.includes(extension.toLowerCase());

        // Create database record
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .insert({
                parent_id: user.id,
                original_file_name: fileName,
                original_file_url: publicUrl,
                file_format: extension,
                file_category: category,
                original_file_type: category, // Keep for backward compatibility if needed
                status: needsAutoProcessing ? 'processing' : 'pending',
                processing_metadata: {
                    r2_file_path: fileKey,
                    uploaded_at: new Date().toISOString(),
                    file_size: fileSize,
                    file_type: fileType
                },
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (courseError) {
            console.error('Database insert error:', courseError);
            return NextResponse.json(
                { error: 'Veritabanı kaydı oluşturulamadı' },
                { status: 500 }
            );
        }

        console.log(`✅ Created course record: ${course.id}`);

        // TRIGGER AUTOMATIC PROCESSING FOR TEXT DOCUMENTS
        if (needsAutoProcessing && course) {
            // Import text extraction service
            const { extractTextFromDocument } = await import('@/lib/extraction/textExtractor');

            try {
                // Download file from R2
                const fileBuffer = await downloadFileFromR2(fileKey);

                // Extract text
                const extractionResult = await extractTextFromDocument(fileBuffer, extension);

                // Save to course_pages
                await supabase
                    .from('course_pages')
                    .insert({
                        course_id: course.id,
                        page_number: 1,
                        content: extractionResult.text,
                        created_at: new Date().toISOString(),
                    });

                // Update course status to 'analyzing'
                await supabase
                    .from('courses')
                    .update({
                        status: 'analyzing',
                        processing_metadata: {
                            ...course.processing_metadata,
                            method: 'text_extraction',
                            format: extension,
                            word_count: extractionResult.metadata?.wordCount,
                            processed_at: new Date().toISOString(),
                        },
                        error_message: null,
                    })
                    .eq('id', course.id);

                console.log(`✅ Text extracted automatically for ${fileName}`);

            } catch (error: any) {
                console.error('Auto text extraction failed:', error);

                // Update with helpful error message
                await supabase
                    .from('courses')
                    .update({
                        status: 'failed',
                        error_message: `Otomatik metin çıkarma başarısız: ${error.message}. Lütfen dosyayı PDF olarak dışa aktarıp tekrar deneyin.`,
                        processing_metadata: {
                            ...course.processing_metadata,
                            method: 'text_extraction_failed',
                            format: extension,
                            error: error.message,
                            failed_at: new Date().toISOString(),
                        },
                    })
                    .eq('id', course.id);
            }
        }

        return NextResponse.json({
            success: true,
            course,
        });

    } catch (error) {
        console.error('Upload completion error:', error);
        return NextResponse.json(
            { error: 'Dosya kaydı tamamlanamadı' },
            { status: 500 }
        );
    }
}

// Helper function to download file from R2
async function downloadFileFromR2(fileKey: string): Promise<Buffer> {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Client = new S3Client({
        region: 'auto',
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
        },
    });

    const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: fileKey,
    });

    const response = await s3Client.send(command);
    const chunks: Uint8Array[] = [];

    for await (const chunk of response.Body as any) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}
