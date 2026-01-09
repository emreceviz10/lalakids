import { Card } from '@/components/ui/card';
import { FileText, Image as ImageIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface UploadedFileCardProps {
    file: {
        id: string;
        title: string;
        original_file_name: string;
        original_file_type: 'pdf' | 'image';
        status: string;
        created_at: string;
    };
}

const statusConfig = {
    pending: {
        label: 'İşlenmeyi Bekliyor',
        icon: Clock,
        color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'
    },
    ocr_processing: {
        label: 'İşleniyor...',
        icon: Clock,
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    analyzing: {
        label: 'Analiz Ediliyor',
        icon: Clock,
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
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
    }
};

export function UploadedFileCard({ file }: UploadedFileCardProps) {
    const Icon = file.original_file_type === 'pdf' ? FileText : ImageIcon;
    // @ts-ignore - statusConfig indexing might fail strict check if status is unknown string
    const status = statusConfig[file.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    const timeAgo = formatDistanceToNow(new Date(file.created_at), {
        addSuffix: true,
        locale: tr
    });

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
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {timeAgo}
                    </p>
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{status.label}</span>
                </div>
            </div>
        </Card>
    );
}
