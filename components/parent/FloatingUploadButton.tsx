import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tr } from '@/lib/locales/tr';

interface FloatingUploadButtonProps {
    onClick: () => void;
    className?: string;
}

export function FloatingUploadButton({ onClick, className }: FloatingUploadButtonProps) {
    return (
        <Button
            size="lg"
            onClick={onClick}
            className={cn(
                // Position
                'fixed bottom-6 right-6 z-50',
                // Size & Shape
                'h-14 px-6 rounded-full shadow-xl shadow-primary/30',
                // Interactions
                'hover:scale-105 active:scale-95 transition-all duration-300',
                // Visuals
                'bg-primary hover:bg-primary/90 text-white border-2 border-white/20',
                className
            )}
        >
            <Plus className="w-6 h-6 mr-2" />
            <span className="font-bold">{tr.upload.fabLabel}</span>
        </Button>
    );
}
