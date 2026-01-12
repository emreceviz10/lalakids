'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Clock, CheckCircle2, AlertCircle, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { processCourseOCR } from '@/app/actions/course-processing';

interface UploadedFileCardProps {
    file: {
        id: string;
        title: string;
        original_file_name: string;
        original_file_type: 'pdf' | 'image' | 'text';
        status: string;
        page_count?: number;
        error_message?: string;
        created_at: string;
    };
    onStatusChange?: (id: string, newStatus: string, pageCount?: number) => void;
}

const statusConfig = {
    pending: {
        label: 'İşlenmeyi Bekliyor',
        icon: Clock,
        color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'
    },
    ocr_processing: {
        label: 'İşleniyor...',
        icon: Loader2,
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        animate: true
    },
    analyzing: {
        label: 'Analiz Ediliyor',
        icon: Sparkles,
        color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    },
    generating_scenes: {
        label: 'Dersler Hazırlanıyor',
        icon: Clock,
        color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    },
    ready: {
        label: 'Hazır',
        icon: CheckCircle2,
        color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    error: {
        label: 'Hata',
        icon: AlertCircle,
        color: 'text-red-600 bg-red-100 dark:bg-red-900/20'
    },
    failed: {
        label: 'İşlem Başarısız',
        icon: AlertCircle,
        color: 'text-red-600 bg-red-100 dark:bg-red-900/20'
    }
};

export function UploadedFileCard({ file, onStatusChange }: UploadedFileCardProps) {
    const [currentStatus, setCurrentStatus] = useState(file.status);
    const [pageCount, setPageCount] = useState(file.page_count);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isTextDocument = (format: string) => {
        const textFormats = ['txt', 'docx', 'rtf', 'odt', 'md', 'text'];
        return textFormats.includes(format?.toLowerCase() || '');
    };

    const isText = isTextDocument(file.original_file_type) || isTextDocument(file.id); // fallback check if needed, but rely on props
    // Actually the props passed 'file' has 'original_file_type' which is 'pdf' | 'image' | 'text' (after our DB update)
    // But waiting for DB update, let's use file extension logic if available, or just trust the new type.
    // The component might receive 'text' as type now.

    const Icon = file.original_file_type === 'pdf' ? FileText : (isTextDocument(file.original_file_type) ? FileText : ImageIcon);
    // @ts-ignore - statusConfig indexing might fail strict check if status is unknown string
    const status = statusConfig[currentStatus] || statusConfig.pending;
    const StatusIcon = status.icon;

    const timeAgo = formatDistanceToNow(new Date(file.created_at), {
        addSuffix: true,
        locale: tr
    });

    const handleProcessOCR = async () => {
        setIsProcessing(true);
        setCurrentStatus('ocr_processing');

        toast.info("OCR Başlatıldı", {
            description: `${file.original_file_name} işleniyor...`,
            duration: 5000
        });

        startTransition(async () => {
            const result = await processCourseOCR(file.id);

            setIsProcessing(false);

            if (result.success) {
                setCurrentStatus('analyzing');
                setPageCount(result.pageCount);
                toast.success("OCR Tamamlandı! ✨", {
                    description: result.message,
                    duration: 5000
                });
                onStatusChange?.(file.id, 'analyzing', result.pageCount);
            } else {
                setCurrentStatus('pending');
                toast.error("OCR Başarısız", {
                    description: result.message,
                    duration: 5000
                });
                onStatusChange?.(file.id, 'pending');
            }
        });
    };

    const handleRetry = async () => {
        try {
            setIsProcessing(true);
            const response = await fetch(`/api/courses/${file.id}/retry-extraction`, { method: 'POST' });
            if (!response.ok) throw new Error('Retry failed');
            toast.success("Dosya tekrar işleniyor...");
            window.location.reload();
        } catch (error) {
            console.error('Retry failed:', error);
            toast.error("Tekrar deneme başarısız");
        } finally {
            setIsProcessing(false);
        }
    };



    const handleConvertToPDF = () => {
        toast.info('Lütfen dosyayı Word veya LibreOffice\'te açıp "PDF olarak kaydet" seçeneğini kullanın.');
    };

    const showOCRButton = (currentStatus === 'pending' || currentStatus === 'error') && !isTextDocument(file.original_file_type);
    const showRetry = currentStatus === 'error';


    return (
        <Card className="p-4 hover:shadow-md transition-shadow group border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
                {/* File icon */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/5 transition-colors">
                    <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate mb-0.5 text-slate-900 dark:text-slate-100">
                        {file.title || file.original_file_name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {timeAgo}
                        </p>
                        {pageCount && (
                            <span className="text-xs text-slate-400">
                                • {pageCount} sayfa
                            </span>
                        )}

                        {/* Status Text for Text Docs */}
                        {currentStatus === 'pending' && isText && (
                            <span className="text-xs text-blue-500 font-medium animate-pulse">
                                • Otomatik işleniyor...
                            </span>
                        )}
                    </div>

                    {/* Error UI */}
                    {currentStatus === 'failed' && (
                        <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                            <p className="text-xs text-red-600 font-medium mb-1">
                                {file.error_message || "Dosya işlenemedi"}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" className="h-6 text-[10px] px-2" onClick={handleRetry} disabled={isProcessing}>
                                    Tekrar Dene
                                </Button>
                                <Button variant="secondary" size="sm" className="h-6 text-[10px] px-2" onClick={handleConvertToPDF}>
                                    PDF Çözümü
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* OCR Button */}
                {showOCRButton && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30"
                        onClick={handleProcessOCR}
                        disabled={isProcessing || isPending}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                İşleniyor...
                            </>
                        ) : showRetry ? (
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
                )}

                {/* Status badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.color}`}>
                    <StatusIcon className={`w-3 h-3 ${status.animate ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{status.label}</span>
                </div>
            </div>
        </Card >
    );
}
