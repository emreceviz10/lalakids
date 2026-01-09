import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Removed Progress import as it might not be exported from components/ui/progress or might need verifying.
// Assuming standard shadcn Setup. If not, I'll use a simple div for progress.
import { BookOpen, ChartBar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { tr } from '@/lib/locales/tr';

interface LessonCardProps {
    lesson: {
        id: string;
        progress_percentage: number;
        courses: {
            id: string;
            title: string;
            subject: string;
            grade_level: number;
            status: string;
        };
    };
}

export function LessonCard({ lesson }: LessonCardProps) {
    const router = useRouter();
    const { courses: course, progress_percentage } = lesson;

    const isComplete = progress_percentage >= 100;
    const isProcessing = course.status !== 'ready';

    return (
        <Card
            padding="none"
            className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-slate-200 dark:border-slate-800"
        >
            {/* Header with icon */}
            <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="size-16 bg-white/50 dark:bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <BookOpen className="w-8 h-8 text-primary" />
                </div>
                {isComplete && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                        {tr.lessonCard.complete}
                    </div>
                )}
            </div>

            <div className="p-5">

                <h3 className="font-bold mb-1 line-clamp-1 text-lg text-slate-900 dark:text-white" title={course.title}>
                    {course.title}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
                    {course.subject} • {course.grade_level}. Sınıf
                </p>

                {isProcessing ? (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-4 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                        {tr.lessonCard.processing}
                    </div>
                ) : (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-600 dark:text-slate-300">
                            <span>İlerleme</span>
                            <span>%{Math.round(progress_percentage)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${Math.min(progress_percentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="flex-1 font-bold"
                        onClick={() => router.push(`/parent/courses/${course.id}`)}
                        disabled={isProcessing}
                    >
                        {isComplete ? tr.lessonCard.review : tr.lessonCard.continue}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="px-3"
                        onClick={() => router.push(`/parent/courses/${course.id}/progress`)}
                    >
                        <ChartBar className="w-4 h-4 text-slate-500" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
