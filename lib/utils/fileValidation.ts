export const FILE_LIMITS = {
    PDF_MAX_SIZE: 50 * 1024 * 1024, // 50MB
    IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: {
        'application/pdf': ['.pdf'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png']
    }
} as const;

export type FileType = keyof typeof FILE_LIMITS.ACCEPTED_TYPES;

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validateFile(file: File): ValidationResult {
    if (!Object.keys(FILE_LIMITS.ACCEPTED_TYPES).includes(file.type)) {
        return {
            isValid: false,
            error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.'
        };
    }

    const maxSize = file.type === 'application/pdf'
        ? FILE_LIMITS.PDF_MAX_SIZE
        : FILE_LIMITS.IMAGE_MAX_SIZE;

    if (file.size > maxSize) {
        const sizeInMB = maxSize / (1024 * 1024);
        return {
            isValid: false,
            error: `File too large. Maximum size is ${sizeInMB}MB.`
        };
    }

    return { isValid: true };
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
