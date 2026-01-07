"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const navItems = [
        { href: "/parent", label: "Ana Sayfa", icon: "dashboard" },
        { href: "/parent/courses", label: "Materyaller", icon: "library_books" },
        { href: "/parent/students", label: "Öğrenci Profili", icon: "face" },
        { href: "/parent/settings", label: "Ayarlar", icon: "settings" },
    ];

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-slate-900">
            {/* Sidebar - Desktop */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col fixed inset-y-0">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 transform -rotate-6">
                        <span className="text-xl">🦉</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Lala Kids</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Menü</div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium group",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                            >
                                <span className={cn("material-symbols-outlined text-xl", isActive ? "fill-1" : "")}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content Wrapper */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <header className="md:hidden h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="text-sm">🦉</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">Lala Kids</span>
                    </div>
                    <button className="p-2 text-slate-500">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </header>

                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>

            {/* Load Material Symbols */}
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </div>
    );
}
