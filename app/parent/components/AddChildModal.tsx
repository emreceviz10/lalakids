'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChildProfileSchema, type ChildFormData } from '@/lib/validation/childSchema';
import { AvatarUpload } from './AvatarUpload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddChildModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AddChildModal({ open, onOpenChange, onSuccess }: AddChildModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<ChildFormData>({
        resolver: zodResolver(ChildProfileSchema) as any,
        defaultValues: {
            first_name: '',
            last_name: '',
            date_of_birth: '', // String for HTML date input
            grade_level: '1',  // String for select
            display_name: '',
            avatar_url: '',
        }
    });

    const onSubmit = async (data: ChildFormData) => {
        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append('first_name', data.first_name);
            formData.append('last_name', data.last_name);
            if (data.display_name) formData.append('display_name', data.display_name);

            // Convert date string to ISO format
            if (data.date_of_birth) {
                const dateObj = new Date(data.date_of_birth);
                formData.append('date_of_birth', dateObj.toISOString());
            }

            // Convert grade_level to string (in case it's number)
            formData.append('grade_level', String(data.grade_level));

            if (selectedFile) {
                formData.append('avatar_file', selectedFile);
            }

            const response = await fetch('/api/children/create', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Çocuk profili oluşturulamadı');
            }

            toast.success('Çocuk profili başarıyla oluşturuldu!');
            form.reset();
            setSelectedFile(null);
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh(); // Fallback refresh
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Bir hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center text-slate-900 dark:text-white font-lexend">
                        Yeni Çocuk Profili
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="flex justify-center">
                        <AvatarUpload onFileSelect={setSelectedFile} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name" className="font-poppins font-semibold">Ad</Label>
                            <Input
                                id="first_name"
                                placeholder="Mehmet"
                                {...form.register('first_name')}
                                className={form.formState.errors.first_name ? 'border-red-500' : ''}
                            />
                            {form.formState.errors.first_name && (
                                <p className="text-xs text-red-500">{form.formState.errors.first_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name" className="font-poppins font-semibold">Soyad</Label>
                            <Input
                                id="last_name"
                                placeholder="Yılmaz"
                                {...form.register('last_name')}
                                className={form.formState.errors.last_name ? 'border-red-500' : ''}
                            />
                            {form.formState.errors.last_name && (
                                <p className="text-xs text-red-500">{form.formState.errors.last_name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="display_name" className="font-poppins font-semibold">Görünen Ad (İsteğe bağlı)</Label>
                        <Input
                            id="display_name"
                            placeholder="Memo"
                            {...form.register('display_name')}
                        />
                        {form.formState.errors.display_name && (
                            <p className="text-xs text-red-500">{form.formState.errors.display_name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date_of_birth" className="font-poppins font-semibold">Doğum Tarihi</Label>
                            <Input
                                id="date_of_birth"
                                type="date"
                                {...form.register('date_of_birth')}
                                className={form.formState.errors.date_of_birth ? 'border-red-500' : ''}
                            />
                            {form.formState.errors.date_of_birth && (
                                <p className="text-xs text-red-500">{form.formState.errors.date_of_birth.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="grade_level" className="font-poppins font-semibold">Sınıf Seviyesi</Label>
                            <select
                                id="grade_level"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...form.register('grade_level')}
                            >
                                <option value={1}>1. Sınıf</option>
                                <option value={2}>2. Sınıf</option>
                                <option value={3}>3. Sınıf</option>
                                <option value={4}>4. Sınıf</option>
                                <option value={5}>5. Sınıf</option>
                            </select>
                            {form.formState.errors.grade_level && (
                                <p className="text-xs text-red-500">{form.formState.errors.grade_level.message as string}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            İptal
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary-dark w-full sm:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                'Kaydet'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
