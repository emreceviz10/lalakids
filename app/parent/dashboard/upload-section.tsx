'use client';

import React, { useState } from 'react';
import { FileUploadZone } from '@/components/parent/FileUploadZone';
import { UploadedFilesList } from '@/components/parent/UploadedFilesList';

interface ParentUploadSectionProps {
    studentId: string;
}

export function ParentUploadSection({ studentId }: ParentUploadSectionProps) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleUploadComplete = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mt-8">
            <div className="flex flex-col space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Yeni Materyal Yükle
                </h3>
                <p className="text-sm text-slate-500">
                    Öğrenci için ders kitabı sayfaları, notlar veya çalışma kağıtları yükleyin.
                </p>
            </div>

            <FileUploadZone
                studentId={studentId}
                onUploadComplete={handleUploadComplete}
            />

            <UploadedFilesList
                studentId={studentId}
                refreshTrigger={refreshTrigger}
            />
        </div>
    );
}
