import sharp from 'sharp';
// @ts-ignore
import heicConvert from 'heic-convert';

interface ConversionResult {
    buffer: Buffer;
    format: 'jpg';
    originalFormat: string;
    metadata: {
        width: number;
        height: number;
        size: number;
    };
}

/**
 * Convert modern image formats to JPG for Gemini Vision processing
 * Supports: HEIC (iPhone), TIFF (scanned docs), WEBP (modern web)
 */
export async function convertImageToJpg(
    buffer: Buffer,
    fileExtension: string
): Promise<ConversionResult> {
    const extension = fileExtension.toLowerCase().replace('.', '');

    try {
        let imageBuffer: Buffer = buffer;

        // Step 1: Convert HEIC to PNG first (heic-convert limitation)
        if (extension === 'heic') {
            imageBuffer = await convertHeicToPng(buffer);
        }

        // Step 2: Convert any format to JPG using sharp
        const jpgBuffer = await sharp(imageBuffer)
            .jpeg({
                quality: 90, // High quality for text readability
                progressive: true,
            })
            .toBuffer();

        // Get metadata
        const metadata = await sharp(jpgBuffer).metadata();

        return {
            buffer: jpgBuffer,
            format: 'jpg',
            originalFormat: extension,
            metadata: {
                width: metadata.width || 0,
                height: metadata.height || 0,
                size: jpgBuffer.length,
            },
        };
    } catch (error: any) {
        console.error(`Image conversion failed for ${extension}:`, error);
        throw new Error(`Görsel dönüştürme başarısız: ${error.message}`);
    }
}

/**
 * Convert HEIC (iPhone format) to PNG
 * HEIC -> PNG -> JPG (two-step process due to library limitations)
 */
async function convertHeicToPng(heicBuffer: Buffer): Promise<Buffer> {
    try {
        const pngBuffer = await heicConvert({
            buffer: heicBuffer,
            format: 'PNG',
            quality: 1, // Maximum quality
        });

        return Buffer.from(pngBuffer);
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        throw new Error('iPhone fotoğrafı dönüştürülemedi. Lütfen JPG formatında dışa aktarın.');
    }
}

/**
 * Check if image needs conversion before processing
 */
export function requiresConversion(extension: string): boolean {
    const conversionFormats = ['heic', 'tiff', 'tif', 'webp'];
    return conversionFormats.includes(extension.toLowerCase().replace('.', ''));
}

/**
 * Check if file format is an image
 */
export function isImage(extension: string): boolean {
    const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'tiff', 'tif'];
    return imageFormats.includes(extension.toLowerCase().replace('.', ''));
}
