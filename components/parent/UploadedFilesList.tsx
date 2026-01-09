'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { FileText, Image as ImageIcon, Trash2, Loader2, AlertCircle, Sparkles, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processCourseOCR } from '@/app/actions/course-processing';

interface Course {
    id: string;
    title: string;
    original_file_name: string;
    original_file_type: 'pdf' | 'image';
    status: 'pending' | 'ocr_processing' | 'analyzing' | 'error' | string;
    page_count?: number;
    error_message?: string;
    created_at: string;
}

interface UploadedFilesListProps {
    studentId: string;
    refreshTrigger?: number;
}

export function UploadedFilesList({ studentId, refreshTrigger }: UploadedFilesListProps) {
    const [files, setFiles] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const fetchFiles = async () => {
        setLoading(true);
        const supabase = createClient();

        // Fetch courses for this student that are in processing or pending states
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('student_id', studentId)
            .in('status', ['pending', 'ocr_processing', 'analyzing', 'error'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching files:', error);
        } else {
            setFiles(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (studentId) {
            fetchFiles();
        }
    }, [studentId, refreshTrigger]);

    // Poll for status updates when there are files being processed
    useEffect(() => {
        const hasProcessingFiles = files.some(f => f.status === 'ocr_processing');
        if (!hasProcessingFiles) return;

        const interval = setInterval(() => {
            fetchFiles();
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [files, studentId]);

    const handleDelete = async (id: string, fileName: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("Silinemedi", { description: "Dosya silinirken hata oluştu." });
        } else {
            toast.success("Silindi", { description: `${fileName} silindi.` });
            setFiles(files.filter(f => f.id !== id));
        }
    };

    const handleProcessOCR = async (courseId: string, fileName: string) => {
        // Add to processing set for UI feedback
        setProcessingIds(prev => new Set(prev).add(courseId));

        // Update local state optimistically
        setFiles(prev => prev.map(f =>
            f.id === courseId ? { ...f, status: 'ocr_processing' } : f
        ));

        toast.info("OCR Başlatıldı", {
            description: `${fileName} işleniyor...`,
            duration: 5000
        });

        startTransition(async () => {
            const result = await processCourseOCR(courseId);

            // Remove from processing set
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(courseId);
                return next;
            });

            if (result.success) {
                toast.success("OCR Tamamlandı! ✨", {
                    description: result.message,
                    duration: 5000
                });
                // Update local state with new status
                setFiles(prev => prev.map(f =>
                    f.id === courseId
                        ? { ...f, status: 'analyzing', page_count: result.pageCount }
                        : f
                ));
            } else {
                toast.error("OCR Başarısız", {
                    description: result.message,
                    duration: 5000
                });
                // Revert to pending state
                setFiles(prev => prev.map(f =>
                    f.id === courseId
                        ? { ...f, status: 'pending', error_message: result.message }
                        : f
                ));
            }
        });
    };

    const getStatusBadge = (file: Course) => {
        const isProcessing = processingIds.has(file.id);

        switch (file.status) {
            case 'pending':
                return (
                    <span className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        İşlenmeyi Bekliyor
                    </span>
                );
            case 'ocr_processing':
                return (
                    <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        OCR İşleniyor...
                    </span>
                );
            case 'analyzing':
                return (
                    <span className="text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {file.page_count ? `${file.page_count} sayfa | ` : ''}Analiz Ediliyor
                    </span>
                );
            case 'error':
                return (
                    <span className="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Hata Oluştu
                    </span>
                );
            default:
                return null;
        }
    };

    const getActionButton = (file: Course) => {
        const isProcessing = processingIds.has(file.id) || file.status === 'ocr_processing';

        if (file.status === 'pending' || file.status === 'error') {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30"
                    onClick={() => handleProcessOCR(file.id, file.original_file_name)}
                    disabled={isProcessing || isPending}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            İşleniyor...
                        </>
                    ) : file.status === 'error' ? (
                        <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Tekrar Dene
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            OCR İşle
                        </>
                    )}
                </Button>
            );
        }

        return null;
    };

    if (loading && files.length === 0) {
        return (
            <div className="flex flex-col space-y-3 mt-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="mt-6 text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Henüz dosya yüklemediniz</p>
                <p className="text-xs text-slate-400 mt-1">Yukarıdan dosya yükleyerek başlayın!</p>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 pl-1">
                Son Yüklenenler ({files.length})
            </h3>
            <div className="grid gap-3">
                {files.map((file) => (
                    <div key={file.id} className="group relative flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:border-primary/50 transition-colors">

                        <div className="flex-shrink-0">
                            {file.original_file_type === 'pdf' ? (
                                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">
                                    {file.original_file_name}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-slate-500">
                                    {new Date(file.created_at).toLocaleDateString('tr-TR')}
                                </span>
                                {getStatusBadge(file)}
                            </div>
                            {file.error_message && file.status === 'error' && (
                                <p className="text-xs text-red-500 mt-1 truncate">
                                    {file.error_message}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {getActionButton(file)}

                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                onClick={() => handleDelete(file.id, file.original_file_name)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
