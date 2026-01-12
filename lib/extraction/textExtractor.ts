import mammoth from 'mammoth';
import officeParser from 'officeparser';

interface ExtractionResult {
    text: string;
    format: string;
    metadata?: {
        pageCount?: number;
        wordCount: number;
        hasImages?: boolean;
    };
}

/**
 * Extract text from various document formats
 * Preserves Turkish characters (ğ, ı, ş, ç, ö, ü)
 */
export async function extractTextFromDocument(
    buffer: Buffer,
    fileExtension: string
): Promise<ExtractionResult> {
    const extension = fileExtension.toLowerCase().replace('.', '');

    try {
        switch (extension) {
            case 'txt':
            case 'md':
                return extractPlainText(buffer, extension);

            case 'docx':
                return extractFromDocx(buffer);

            case 'rtf':
                return extractFromRtf(buffer);

            case 'odt':
                return extractFromOdt(buffer);

            default:
                throw new Error(`Unsupported text format: ${extension}`);
        }
    } catch (error: any) {
        console.error(`Text extraction failed for ${extension}:`, error);
        throw new Error(`Metin çıkarma başarısız: ${error.message}`);
    }
}

/**
 * Extract plain text (TXT, MD)
 */
async function extractPlainText(
    buffer: Buffer,
    format: string
): Promise<ExtractionResult> {
    // Use UTF-8 encoding to preserve Turkish characters
    const text = buffer.toString('utf-8');

    return {
        text: text.trim(),
        format,
        metadata: {
            wordCount: text.split(/\s+/).length,
        },
    };
}

/**
 * Extract text from DOCX files
 */
async function extractFromDocx(buffer: Buffer): Promise<ExtractionResult> {
    const result = await mammoth.extractRawText({ buffer });

    return {
        text: result.value.trim(),
        format: 'docx',
        metadata: {
            wordCount: result.value.split(/\s+/).length,
            hasImages: false,
        },
    };
}

/**
 * Extract text from RTF files
 */
/**
 * Extract text from RTF files
 * Using rtf-parser with correct API
 */
async function extractFromRtf(buffer: Buffer): Promise<ExtractionResult> {
    try {
        // RTF parser expects string, not buffer
        const rtfContent = buffer.toString('utf8');

        // Dynamic import
        // @ts-ignore
        const rtfParser = await import('rtf-parser');

        return new Promise((resolve, reject) => {
            // Use parseString (not parse)
            // @ts-ignore - rtf-parser types might be missing or incorrect
            rtfParser.parseString(rtfContent, (err: any, doc: any) => {
                if (err) {
                    console.error('RTF parse error:', err);
                    reject(new Error(`RTF ayrıştırma hatası: ${err.message}`));
                    return;
                }

                // Extract text from RTF document tree
                let text = '';

                // Function to recursively extract text
                function extractText(node: any): string {
                    if (!node) return '';

                    // If it's a string, return it
                    if (typeof node === 'string') {
                        return node;
                    }

                    // If it has content array, process each item
                    if (Array.isArray(node.content)) {
                        return node.content.map(extractText).join('');
                    }

                    // If it has content property (not array)
                    if (node.content) {
                        return extractText(node.content);
                    }

                    // Handle paragraph/text nodes structure of rtf-parser
                    if (node.value) {
                        return node.value;
                    }

                    return '';
                }

                // Start extraction from root
                text = extractText(doc);

                // Clean up text
                text = text
                    .replace(/\\'/g, "'") // Fix escaped quotes
                    .replace(/\\\\/g, '\\') // Fix escaped backslashes
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();

                if (!text || text.length < 5) { // Lower threshold for testing
                    // Don't reject for empty, just return empty result or maybe small text is valid
                    console.warn('RTF text extracted is very short or empty');
                }

                resolve({
                    text: text,
                    format: 'rtf',
                    metadata: {
                        wordCount: text.split(/\s+/).length,
                    },
                });
            });
        });
    } catch (error: any) {
        console.error('RTF extraction error:', error);
        throw new Error(`RTF işleme hatası: ${error.message}`);
    }
}

/**
 * Extract text from ODT files
 */
async function extractFromOdt(buffer: Buffer): Promise<ExtractionResult> {
    // officeParser works with file paths or buffers
    const text = await (officeParser as any).parseOfficeAsync(buffer);

    return {
        text: text.trim(),
        format: 'odt',
        metadata: {
            wordCount: text.split(/\s+/).length,
        },
    };
}

/**
 * Check if file format is a text document
 */
export function isTextDocument(extension: string): boolean {
    const textFormats = ['txt', 'docx', 'rtf', 'odt', 'md'];
    return textFormats.includes(extension.toLowerCase().replace('.', ''));
}
