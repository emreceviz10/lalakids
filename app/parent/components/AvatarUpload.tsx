'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, User } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AvatarUploadProps {
    onFileSelect: (file: File | null) => void;
    className?: string;
}

export function AvatarUpload({ onFileSelect, className }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Görsel boyutu 5MB\'dan küçük olmalıdır.');
            return;
        }

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Sadece JPG veya PNG formatları kabul edilir.');
            return;
        }

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onFileSelect(file);
    };

    const handleClear = () => {
        setPreview(null);
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("flex flex-col items-center gap-4", className)}>
            <div
                className="relative group cursor-pointer"
                onClick={triggerClick}
            >
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    {preview ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={preview}
                                alt="Avatar preview"
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <User className="w-10 h-10 text-gray-400" />
                    )}
                </div>

                <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md">
                    <Upload className="w-3 h-3" />
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png"
            />

            {preview && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                >
                    <X className="w-3 h-3 mr-1" />
                    Kaldır
                </Button>
            )}

            {!preview && (
                <p className="text-xs text-gray-500 text-center">
                    JPG veya PNG, max 5MB
                </p>
            )}
        </div>
    );
}
