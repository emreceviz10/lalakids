'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChildSelector } from '@/components/dashboard/child-selector';

interface ClientProps {
    children: any[];
    activeChild: any;
    stats: any;
    recentCourses: any[];
}

/**
 * Client component for interactive dashboard
 * PRD 4.9.1: Real-time data display with child switching
 */
export function ParentDashboardClient({
    children,
    activeChild,
    stats,
    recentCourses
}: ClientProps) {
    const router = useRouter();
    const displayName = activeChild.display_name || activeChild.first_name;

    const handleSelectChild = (childId: string) => {
        router.push(`/parent/dashboard?child=${childId}`);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header with child selector */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Hoş Geldiniz 👋
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {displayName}'in öğrenme yolculuğunu buradan takip edebilirsiniz.
                        </p>
                    </div>

                    {/* Child Selector - PRD 4.9.1 */}
                    {children.length > 1 && (
                        <ChildSelector
                            children={children}
                            activeChildId={activeChild.id}
                            onSelectChild={handleSelectChild}
                        />
                    )}
                </div>

                <Link
                    href="/parent/upload"
                    className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Yeni Materyal Yükle
                </Link>
            </div>

            {/* Stats Grid - PRD 4.9.1: Show streak, XP, active lessons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Total Materials */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                    <div className="size-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">library_books</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Toplam Materyal
                        </p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">
                            {stats.totalCourses}
                        </p>
                    </div>
                </div>

                {/* Weekly Time */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                    <div className="size-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">timelapse</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Haftalık Süre
                        </p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">
                            {stats.weeklyMinutes} dk
                        </p>
                    </div>
                </div>

                {/* Total XP */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                    <div className="size-14 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">emoji_events</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Kazanılan XP
                        </p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">
                            {stats.totalXP.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Current Streak Badge */}
            {activeChild.current_streak > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-4">
                    <div className="size-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-black text-xl">
                        🔥
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                            {activeChild.current_streak} Günlük Seri! 🎉
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Harika! Devam et ve rekorunu kır!
                        </p>
                    </div>
                </div>
            )}

            {/* Recent Courses */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Son Çalışmalar
                    </h3>
                    {stats.totalCourses > 5 && (
                        <Link
                            href={`/parent/courses?child=${activeChild.id}`}
                            className="text-primary font-bold text-sm hover:underline"
                        >
                            Tümünü Gör
                        </Link>
                    )}
                </div>

                {recentCourses.length === 0 ? (
                    <div className="p-8 text-center py-16">
                        <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                            <span className="material-symbols-outlined text-4xl">history_edu</span>
                        </div>
                        <p className="text-slate-500 font-medium">
                            Henüz bir materyal yüklenmemiş. Yeni bir materyal yükleyerek başlayın!
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {recentCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/parent/course/${course.id}`}
                                className="p-6 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="size-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center text-2xl">
                                    {getSubjectEmoji(course.subject)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                        {course.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 capitalize">
                                        {course.subject}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={course.status} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getSubjectEmoji(subject: string): string {
    const emojiMap: Record<string, string> = {
        matematik: '🔢',
        fen: '🔬',
        türkçe: '📖',
        sosyal: '🌍',
        ingilizce: '🇬🇧',
    };
    return emojiMap[subject?.toLowerCase()] || '📚';
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'İşleniyor', className: 'bg-yellow-100 text-yellow-700' },
        processing: { label: 'Hazırlanıyor', className: 'bg-blue-100 text-blue-700' },
        ready: { label: 'Hazır', className: 'bg-green-100 text-green-700' },
        error: { label: 'Hata', className: 'bg-red-100 text-red-700' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${config.className}`}>
            {config.label}
        </span>
    );
}
