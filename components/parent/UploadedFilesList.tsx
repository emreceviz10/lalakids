'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatFileSize } from '@/lib/utils/fileValidation'; // Assuming we export this or duplicate it
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Course {
    id: string;
    title: string;
    original_file_name: string;
    original_file_type: 'pdf' | 'image';
    status: 'pending' | 'ocr_processing' | 'error' | string;
    created_at: string;
    // add other fields as needed
}

interface UploadedFilesListProps {
    studentId: string;
    refreshTrigger?: number; // Prop to trigger refetch
}

export function UploadedFilesList({ studentId, refreshTrigger }: UploadedFilesListProps) {
    const [files, setFiles] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        setLoading(true);
        const supabase = createClient();

        // Fetch courses for this student that are in processing or pending states
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('student_id', studentId)
            .in('status', ['pending', 'ocr_processing', 'error'])
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

    const handleDelete = async (id: string, fileName: string) => {
        // Optimistic update or waiting? Let's wait for confirmation.
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2 py-0.5 rounded-full font-medium">İşlenmeyi Bekliyor</span>;
            case 'ocr_processing':
                return <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> İşleniyor...</span>;
            case 'error':
                return <span className="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">Hata Oluştu</span>;
            default:
                return null;
        }
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
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                    {/* We don't have file size in the table schema from PRD unfortunately. */}
                                    {/* PRD Section 3.2.2 shows page_count, but not size. */}
                                    {/* We'll just show page count if available or skip size for now to be safe. */}
                                    {/* Or we could have stored it but it wasn't in schema snippet. */}
                                    {/* Waiting for OCR */}
                                    {new Date(file.created_at).toLocaleDateString()}
                                </span>
                                {getStatusBadge(file.status)}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            onClick={() => handleDelete(file.id, file.original_file_name)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                    </div>
                ))}
            </div>
        </div>
    );
}
