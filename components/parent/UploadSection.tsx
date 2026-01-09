'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploadZone } from './FileUploadZone';
import { tr } from '@/lib/locales/tr';
import { useQueryClient } from '@tanstack/react-query';

interface UploadSectionProps {
    studentId: string;
    isModal?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function UploadSection({
    studentId,
    isModal = false,
    open,
    onOpenChange
}: UploadSectionProps) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleSuccess = () => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['recent-uploads', studentId] });
        queryClient.invalidateQueries({ queryKey: ['child-stats', studentId] });

        // Refresh server components to update the UI state (e.g. switch from FirstTimeUserLayout)
        router.refresh();

        // Close modal if open

        // Close modal if open
        if (isModal && onOpenChange) {
            onOpenChange(false);
        }
    };

    if (isModal) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold">{tr.upload.modalTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-2">
                        <FileUploadZone
                            studentId={studentId}
                            onUploadComplete={handleSuccess}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Desktop: Inline display
    return (
        <section className="mb-0">
            <div className="flex flex-col space-y-1 mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {tr.upload.title}
                </h2>
                <p className="text-sm text-slate-500">
                    Ders materyallerini buradan yükleyebilirsiniz.
                </p>
            </div>
            <FileUploadZone
                studentId={studentId}
                onUploadComplete={handleSuccess}
            />
        </section>
    );
}
