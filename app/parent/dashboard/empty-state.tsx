'use client';

import { useState } from 'react';
import { AddChildModal } from '../components/AddChildModal';
import { useRouter } from 'next/navigation';

export function EmptyChildState() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-5xl">👶</span>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Hoş Geldiniz! 🎉
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md">
                        Çocuğunuzun öğrenme yolculuğuna başlamak için önce bir profil oluşturalım.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    İlk Çocuk Profilini Oluştur
                </button>
            </div>

            <AddChildModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={() => router.refresh()}
            />
        </>
    );
}
