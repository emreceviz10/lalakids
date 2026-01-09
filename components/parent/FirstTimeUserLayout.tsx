import { Card } from '@/components/ui/card';
import { FileUploadZone } from '@/components/parent/FileUploadZone';
import { tr } from '@/lib/locales/tr';
import { AddChildModal } from '@/app/parent/components/AddChildModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
    selectedChild: any;
    childProfiles: any[];
    onSelectChild: (id: string) => void;
}

export function FirstTimeUserLayout({ selectedChild, childProfiles, onSelectChild }: Props) {
    const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Mock header prop structure or rework ParentHeader.
    // ParentHeader right now seems simpler and maybe doesn't take props based on previous inspect?
    // Let's check ParentHeader usage in previous page.tsx. It was <ParentHeader /> with no props.
    // BUT the requirement is to have child selector.
    // Wait, `ChildSelector` was in `ParentDashboardClient`.
    // We should probably lift ChildSelector up or include it here.
    // The design shows Header -> Hero -> HowItWorks.
    // `ParentDashboardClient` had the structure:
    // Header (Welcome msg + Selector) -- Top Right Button
    // Stats ...

    // I will include the Child Selector section here similar to `ParentDashboardClient`.

    const displayName = selectedChild.display_name || selectedChild.first_name;

    return (
        <div className="container mx-auto px-4 py-6 max-w-5xl animate-fade-in-up">



            {/* Hero section */}
            <Card className="p-8 md:p-12 text-center mb-8 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-white">
                        {tr.firstTimeUser.heroTitle}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                        {tr.firstTimeUser.heroSubtitle.replace('{childName}', displayName)}
                    </p>

                    <FileUploadZone
                        studentId={selectedChild.id}
                        onUploadComplete={() => {
                            queryClient.invalidateQueries({ queryKey: ['recent-uploads', selectedChild.id] });
                            queryClient.invalidateQueries({ queryKey: ['child-stats', selectedChild.id] });
                        }}
                    />
                </div>
            </Card>

            {/* How it works section */}
            <Card className="p-6 md:p-8 border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-xl font-bold mb-8 text-center text-slate-900 dark:text-white">
                    {tr.firstTimeUser.howItWorks.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-2xl border border-slate-100 dark:border-slate-700">
                            📂
                        </div>
                        <h4 className="font-bold mb-2 text-slate-900 dark:text-white">{tr.firstTimeUser.howItWorks.step1Title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-4">
                            {tr.firstTimeUser.howItWorks.step1Desc}
                        </p>
                    </div>
                    <div className="text-center relative">
                        <div className="hidden md:block absolute top-7 -left-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-2xl border border-slate-100 dark:border-slate-700 relative z-10">
                            ✨
                        </div>
                        <h4 className="font-bold mb-2 text-slate-900 dark:text-white">{tr.firstTimeUser.howItWorks.step2Title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-4">
                            {tr.firstTimeUser.howItWorks.step2Desc}
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="hidden md:block absolute top-7 -left-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-2xl border border-slate-100 dark:border-slate-700">
                            🎓
                        </div>
                        <h4 className="font-bold mb-2 text-slate-900 dark:text-white">{tr.firstTimeUser.howItWorks.step3Title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-4">
                            {tr.firstTimeUser.howItWorks.step3Desc}
                        </p>
                    </div>
                </div>
            </Card>

            <AddChildModal
                open={isAddChildModalOpen}
                onOpenChange={setIsAddChildModalOpen}
            />
        </div>
    );
}
