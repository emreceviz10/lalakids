"use client";

import Link from "next/link";

export default function ParentDashboardPage() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Hoş Geldiniz 👋</h2>
                    <p className="text-slate-500 font-medium">Çocuğunuzun öğrenme yolculuğunu buradan takip edebilirsiniz.</p>
                </div>
                <Link
                    href="/parent/orders/new"
                    className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Yeni Materyal Yükle
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                    <div className="size-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">library_books</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Toplam Materyal</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">12</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                    <div className="size-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">timelapse</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Haftalık Süre</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">45 dk</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                    <div className="size-14 bg-yellow-50 text-yellow-500 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">emoji_events</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kazanılan XP</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">1,250</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Son Aktiviteler</h3>
                    <button className="text-primary font-bold text-sm hover:underline">Tümünü Gör</button>
                </div>
                <div className="p-8 text-center py-16">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                        <span className="material-symbols-outlined text-4xl">history_edu</span>
                    </div>
                    <p className="text-slate-500 font-medium">Henüz bir aktivite yok. Yeni bir materyal yükleyerek başlayın!</p>
                </div>
            </div>
        </div>
    );
}
