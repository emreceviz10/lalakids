import { useState } from 'react';
import { BookOpen, Flame, Trophy, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/parent/StatCard';
import { LessonCard } from '@/components/parent/LessonCard';
import { UploadedFileCard } from '@/components/parent/UploadedFileCard';
import { UploadSection } from '@/components/parent/UploadSection';
import { FloatingUploadButton } from '@/components/parent/FloatingUploadButton';
import { useChildStats } from '@/lib/hooks/useChildStats';
import { useActiveLessons } from '@/lib/hooks/useActiveLessons';
import { useRecentUploads } from '@/lib/hooks/useRecentUploads';
import { tr } from '@/lib/locales/tr';
import { AddChildModal } from '@/app/parent/components/AddChildModal';

interface Props {
    selectedChild: any;
    childProfiles: any[];
    onSelectChild: (id: string) => void;
}

export function ActiveUserLayout({ selectedChild, childProfiles, onSelectChild }: Props) {
    const { data: stats } = useChildStats(selectedChild.id);
    // const { data: activeLessons } = useActiveLessons(selectedChild.id);
    const activeLessons: any[] = [];
    const { data: recentUploads } = useRecentUploads(selectedChild.id);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

    const displayName = selectedChild.display_name || selectedChild.first_name;

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl animate-fade-in-up pb-24 md:pb-8">

            {/* Child Selector Header Area - Logic handled in ParentDashboardClient usually, 
           but we need to leave space or render it here if we refactor `ParentDashboardClient` 
           to delegate full rendering to layouts.
           I'll assume `ParentDashboardClient` renders the header, loops children.
           Wait, `ParentDashboardClient` had the header inside it.
           If `ParentDashboardClient` renders conditional layouts, it should probably pass the header logic OR 
           render header then the layout.
           The PRD spec said "Header with child selector" inside the layout component. 
           So I should render the Header content here or simpler: let ParentDashboardClient render Header and then 
           render {Layout} below it. That's cleaner.
           BUT the FirstTimeUserLayout had specific Hero layout that might conflict with fixed header.
           Let's assume ParentDashboardClient renders the COMMON header (Welcome + Child Selector + Add Button).
           AND THEN renders the specific layout below.
           
           Actually, FirstTimeUserLayout wants a "Prominent" feel.
           Let's stick to the plan: ParentDashboardClient handles state and renders Header + Layout.
       */}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    icon={BookOpen}
                    label={tr.activeUser.stats.totalMaterials}
                    value={stats?.totalMaterials || 0}
                    color="blue"
                />
                <StatCard
                    icon={Flame}
                    label={tr.activeUser.stats.weeklyTime}
                    value={`${stats?.weeklyHours || 0}s`}
                    color="orange"
                />
                <StatCard
                    icon={Trophy}
                    label={tr.activeUser.stats.totalXP}
                    value={stats?.totalXP || 0}
                    color="yellow"
                />
            </div>

            {/* Active Lessons Section */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        {tr.activeUser.sections.activeLessons}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUploadModal(true)}
                        className="hidden md:flex text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        {tr.activeUser.sections.addNew}
                    </Button>
                </div>

                {activeLessons && activeLessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {activeLessons.map((lesson: any) => (
                            <LessonCard key={lesson.id} lesson={lesson} />
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                        <div className="font-medium text-slate-500 max-w-md mx-auto">
                            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            {tr.activeUser.sections.noActiveLessons.replace('{childName}', displayName)}
                        </div>
                    </div>
                )}
            </section>

            {/* Recent Uploads Section */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {tr.activeUser.sections.recentUploads}
                    </h2>
                    {recentUploads && recentUploads.length > 3 && (
                        <Button variant="ghost" size="sm" className="text-slate-500">
                            {tr.activeUser.sections.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>

                {recentUploads && recentUploads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recentUploads.slice(0, 6).map((upload: any) => (
                            <UploadedFileCard key={upload.id} file={upload} />
                        ))}
                    </div>
                ) : (
                    <Card className="p-6 text-center shadow-sm">
                        <p className="text-slate-500">
                            {tr.activeUser.sections.noRecentUploads}
                        </p>
                    </Card>
                )}
            </section>

            {/* Upload Modal (Mobile) or Inline (Desktop) */}
            {/* Logic: 
           - Mobile: Standard Modal triggered by FAB or Button.
           - Desktop: We can have an inline section at the bottom? 
             The layout plan said "Inline upload zone for desktop".
             Let's add the UploadSection component at the bottom for desktop.
      */}
            <div className="hidden md:block mt-12 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                <UploadSection
                    studentId={selectedChild.id}
                />
            </div>

            {showUploadModal && (
                <UploadSection
                    studentId={selectedChild.id}
                    isModal={true}
                    open={showUploadModal}
                    onOpenChange={setShowUploadModal}
                />
            )}

            {/* Floating Action Button (Mobile Only) */}
            <FloatingUploadButton
                onClick={() => setShowUploadModal(true)}
                className="md:hidden"
            />

            <AddChildModal
                open={isAddChildModalOpen}
                onOpenChange={setIsAddChildModalOpen}
            />
        </div>
    );
}
