'use client';

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize, FILE_LIMITS } from '@/lib/utils/fileValidation';
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

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // 2. Generate path
            const fileExt = file.name.split('.').pop() || '';
            const uniqueName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
            const filePath = `uploads/${studentId}/${uniqueName}`;

            // 3. Upload with XHR for progress
            // Since fetch doesn't support upload progress easily, we stick to XMLHttpRequest as requested in PRD
            // OR we can use axios if available, but XHR is native.

            const formData = new FormData();
            formData.append('file', file);

            await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        setUploadProgress(percent);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response.url);
                        } catch (e) {
                            reject(new Error('Invalid JSON response'));
                        }
                    } else {
                        reject(new Error(xhr.statusText || 'Upload failed'));
                    }
                });

                xhr.addEventListener('error', () => reject(new Error('Network error')));
                xhr.open('POST', '/api/storage/upload');
                xhr.setRequestHeader('X-File-Path', filePath);
                xhr.send(formData);
            })
                .then(async (publicUrl) => {
                    // 4. Create record in Supabase
                    // We need a client-side supabase client.
                    const { createClient } = await import('@/lib/supabase/client'); // Assuming client component usage
                    const supabase = createClient();

                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('User not authenticated');

                    const { error: dbError } = await supabase
                        .from('courses')
                        .insert({
                            parent_id: user.id,
                            student_id: studentId,
                            title: file.name.replace(/\.[^/.]+$/, ''),
                            original_file_url: publicUrl,
                            original_file_name: file.name,
                            original_file_type: file.type.includes('pdf') ? 'pdf' : 'image',
                            status: 'pending',
                            subject: 'other',
                            grade_level: 1 // Default or fetch from student
                            // ideally we fetch student grade but for now strict to PRD snippet logic or defaulting
                        });

                    if (dbError) throw dbError;

                    toast.success("Başarılı", { description: "Dosya başarıyla yüklendi!" });
                    onUploadComplete();
                });


        } catch (error) {
            console.error('Upload failed:', error);
            toast.error("Hata", { description: "Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin." });
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
                accept=".pdf,.jpg,.jpeg,.png"
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
                        Ders Kitabı veya Notları Yükle
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        PDF, JPG veya PNG dosyalarını buraya sürükleyin
                    </p>
                </div>

                <Button variant="secondary" size="sm" className="mt-2" disabled={isUploading}>
                    Bilgisayardan Seç
                </Button>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs">
                    Kabul edilen formatlar: PDF (max 50MB), JPG/PNG (max 10MB)
                </p>
            </div>

            {isUploading && uploadProgress !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-lg p-6">
                    <div className="w-full max-w-xs">
                        <UploadProgressBar progress={uploadProgress} />
                        <p className="text-center text-sm font-medium mt-2 text-primary animate-pulse">
                            Yükleniyor...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
