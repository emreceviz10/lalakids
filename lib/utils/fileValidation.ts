export const FILE_LIMITS = {
    PDF_MAX_SIZE: 50 * 1024 * 1024, // 50MB
    TEXT_MAX_SIZE: 20 * 1024 * 1024, // 20MB
    IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: {
        // PDF
        'application/pdf': ['.pdf'],

        // Text
        'text/plain': ['.txt'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/rtf': ['.rtf'],
        'application/vnd.oasis.opendocument.text': ['.odt'],
        'text/markdown': ['.md'],

        // Images
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/heic': ['.heic'],
        'image/tiff': ['.tiff', '.tif']
    }
} as const;

export type FileType = keyof typeof FILE_LIMITS.ACCEPTED_TYPES;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateFile(file: File): ValidationResult {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // Determine category
    const category = getFileCategory(extension);

    if (!category) {
        return {
            isValid: false,
            error: `Desteklenmeyen dosya formatı. Kabul edilen formatlar:\n` +
                `📄 PDF: .pdf\n` +
                `📝 Belgeler: .txt, .docx, .rtf, .odt, .md\n` +
                `🖼️ Görseller: .jpg, .png, .webp, .heic, .tiff`
        };
    }

    // Category-specific size limits
    const maxSizes = {
        pdf: FILE_LIMITS.PDF_MAX_SIZE,
        text: FILE_LIMITS.TEXT_MAX_SIZE,
        image: FILE_LIMITS.IMAGE_MAX_SIZE,
    };

    const maxSize = maxSizes[category];

    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        const categoryNames = {
            pdf: 'PDF',
            text: 'Belge',
            image: 'Görsel',
        };
        return {
            isValid: false,
            error: `${categoryNames[category]} çok büyük. Maksimum boyut: ${maxSizeMB}MB`
        };
    }

    return { isValid: true };
}

export function getFileCategory(extension: string): 'pdf' | 'text' | 'image' | null {
    const categories = {
        pdf: ['pdf'],
        text: ['txt', 'docx', 'rtf', 'odt', 'md'],
        image: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'tiff', 'tif'],
    };

    for (const [category, extensions] of Object.entries(categories)) {
        if (extensions.includes(extension)) {
            return category as 'pdf' | 'text' | 'image';
        }
    }

    return null;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

