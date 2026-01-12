import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get file category and validate size
function getFileCategoryAndValidate(fileType: string, fileSize: number): {
    category: 'pdf' | 'text' | 'image';
    extension: string;
    isValid: boolean;
    error?: string;
} {
    const lowerType = fileType.toLowerCase();

    // PDF
    if (lowerType.includes('pdf')) {
        if (fileSize > 50 * 1024 * 1024) {
            return { category: 'pdf', extension: 'pdf', isValid: false, error: 'PDF dosyası 50MB\'dan büyük olamaz' };
        }
        return { category: 'pdf', extension: 'pdf', isValid: true };
    }

    // Text documents
    const textTypes = [
        { mime: 'text/plain', ext: 'txt' },
        { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
        { mime: 'application/msword', ext: 'doc' },
        { mime: 'text/rtf', ext: 'rtf' },
        { mime: 'application/rtf', ext: 'rtf' },
        { mime: 'application/vnd.oasis.opendocument.text', ext: 'odt' },
        { mime: 'text/markdown', ext: 'md' },
    ];

    for (const type of textTypes) {
        if (lowerType.includes(type.mime) || lowerType.includes(type.ext)) {
            if (fileSize > 20 * 1024 * 1024) {
                return { category: 'text', extension: type.ext, isValid: false, error: 'Metin dosyası 20MB\'dan büyük olamaz' };
            }
            return { category: 'text', extension: type.ext, isValid: true };
        }
    }

    // Image formats
    const imageTypes = [
        { mime: 'image/jpeg', ext: 'jpg' },
        { mime: 'image/jpg', ext: 'jpg' },
        { mime: 'image/png', ext: 'png' },
        { mime: 'image/heic', ext: 'heic' },
        { mime: 'image/heif', ext: 'heic' },
        { mime: 'image/webp', ext: 'webp' },
        { mime: 'image/tiff', ext: 'tiff' },
    ];

    for (const type of imageTypes) {
        if (lowerType.includes(type.mime) || lowerType.includes(type.ext)) {
            if (fileSize > 10 * 1024 * 1024) {
                return { category: 'image', extension: type.ext, isValid: false, error: 'Görsel dosyası 10MB\'dan büyük olamaz' };
            }
            return { category: 'image', extension: type.ext, isValid: true };
        }
    }

    return { category: 'pdf', extension: 'unknown', isValid: false, error: 'Desteklenmeyen dosya formatı' };
}

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
        const body = await request.json();
        const { fileName, fileSize, fileType } = body;

        if (!fileName || !fileSize || !fileType) {
            return NextResponse.json(
                { error: 'Dosya bilgileri eksik' },
                { status: 400 }
            );
        }

        // Validate file size and get category
        const validation = getFileCategoryAndValidate(fileType, fileSize);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Generate unique file key
        const timestamp = Date.now();
        const uuid = crypto.randomUUID();
        const fileKey = `uploads/${user.id}/${timestamp}_${uuid}.${validation.extension}`;

        // Initialize S3 client for R2
        const s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
            },
        });

        // Create presigned URL
        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: fileKey,
            ContentType: fileType,
            ContentLength: fileSize,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600, // 1 hour
        });

        const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`;

        console.log('✅ Generated presigned URL for:', fileName);

        return NextResponse.json({
            presignedUrl,
            fileKey,
            publicUrl,
            category: validation.category,
            extension: validation.extension,
        });

    } catch (error) {
        console.error('Presigned URL generation error:', error);
        return NextResponse.json(
            { error: 'Yükleme URL\'si oluşturulamadı' },
            { status: 500 }
        );
    }
}
