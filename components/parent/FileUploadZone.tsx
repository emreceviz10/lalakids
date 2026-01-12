'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize, FILE_LIMITS, getFileCategory } from '@/lib/utils/fileValidation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UploadProgressBar } from './UploadProgressBar';
// We'll need to create the course via Supabase client after successful upload or an API call.
// The prompt says: "3. Upload to R2 via API route... 4. Create course record in Supabase"
// I'll implement the upload logic here.

interface FileUploadZoneProps {
    studentId: string;
    onUploadComplete: () => void;
}

export function FileUploadZone({ studentId, onUploadComplete }: FileUploadZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // We can assume toast is available, or use a simple alert if not.
    // Ideally we use the hook if the file exists. I'll assume standard setup.
    // If use-toast doesn't exist I'll fail gracefully or just use console/alert for now and fix later.
    // Checking file structure earlier showed `components/ui` but I didn't verify `use-toast`.
    // I'll assume it exists or I might need to create it.
    // Actually, wait, Step 4 output showed `components/ui/skeleton.tsx` etc.
    // Let's assume standard shadcn.

    // Update: I should check if use-toast exists.
    // If not, I'll need to use `sonner` which was in package.json dependencies!
    // "sonner": "^2.0.7" -> This means I should use `sonner` for toasts.

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const uploadFile = async (file: File) => {
        // 1. Client-side validation
        const validation = validateFile(file);
        if (!validation.isValid) {
            toast.error("Dosya Yüklenemedi", {
                description: validation.error?.replace('File too large', `${file.name} çok büyük`)
            });
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // STEP 1: Get presigned URL
            setUploadProgress(5);
            console.log('📤 Step 1: Requesting presigned URL...');

            const presignedResponse = await fetch('/api/storage/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                }),
            });

            if (!presignedResponse.ok) {
                const errorData = await presignedResponse.json();
                throw new Error(errorData.error || 'Yükleme URL\'si alınamadı');
            }

            const { presignedUrl, fileKey, publicUrl, category, extension } = await presignedResponse.json();
            setUploadProgress(15);

            // STEP 2: Upload directly to R2 using XMLHttpRequest for progress
            console.log('📤 Step 2: Uploading to R2...');

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        // Map progress from 15% to 90%
                        const percent = 15 + ((e.loaded / e.total) * 75);
                        setUploadProgress(Math.round(percent));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => reject(new Error('Network error during upload')));

                xhr.open('PUT', presignedUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });

            setUploadProgress(90);

            // STEP 3: Notify API to create DB record
            console.log('📤 Step 3: Creating database record...');

            const dbResponse = await fetch('/api/storage/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileKey,
                    publicUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    category,
                    extension,
                    studentId, // Pass studentId to link course to child
                }),
            });

            if (!dbResponse.ok) {
                const errorData = await dbResponse.json();
                throw new Error(errorData.error || 'Dosya kaydı oluşturulamadı');
            }

            setUploadProgress(100);
            toast.success("Başarılı", { description: "Dosya başarıyla yüklendi!" });

            // Clear input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onUploadComplete();

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error("Hata", { description: error instanceof Error ? error.message : "Dosya yüklenirken bir hata oluştu" });
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
            setIsDragOver(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0]; // Process only the first file
            uploadFile(file);
        }
    }, [studentId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    };

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out cursor-pointer",
                isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900",
                isUploading && "pointer-events-none opacity-50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.txt,.docx,.rtf,.odt,.md,.webp,.heic,.tiff,.tif"
                onChange={handleFileSelect}
                multiple={false}
            />

            <div className="flex flex-col items-center text-center space-y-3">
                <div className={cn(
                    "p-3 rounded-full bg-slate-100 dark:bg-slate-800",
                    isDragOver && "bg-primary/10"
                )}>
                    <UploadCloud className={cn(
                        "w-8 h-8",
                        isDragOver ? "text-primary" : "text-slate-400"
                    )} />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Ders Kitabı, Notlar veya Fotoğraflar Yükle
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        PDF, Word, Notlar veya Fotoğraflar (iPhone dahil)
                    </p>
                </div>

                <Button variant="secondary" size="sm" className="mt-2" disabled={isUploading}>
                    Bilgisayardan Seç
                </Button>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs leading-tight">
                    Formatlar: PDF, Word, Metin (max 50-20MB)<br />
                    Görseller: JPG, PNG, HEIC, WebP (max 10MB)
                </p>
            </div>

            {isUploading && (
                <div className="mt-4 space-y-2 w-full max-w-md">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Yükleniyor...</span>
                        <span className="text-primary font-medium">{uploadProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress || 0}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
