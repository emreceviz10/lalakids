"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button3D } from "@/components/ui/button-3d";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.refresh();
            router.push("/parent/dashboard");
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary-500 via-secondary-500 to-pink-500">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

            <Card variant="glass" padding="lg" className="w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="flex flex-col items-center mb-8">
                    <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-4 transform -rotate-6">
                        <span className="text-3xl">🦉</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight font-display">Lala Kids</h1>
                    <p className="text-slate-500 font-medium">Öğrenmenin Eğlenceli Yolu</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">E-posta Adresi</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full px-4 py-3 outline-none font-medium"
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3 outline-none font-medium"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    <Button3D
                        type="submit"
                        disabled={loading}
                        loading={loading}
                        fullWidth
                        className="py-3.5"
                    >
                        {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                    </Button3D>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white/50 backdrop-blur-sm text-slate-500 font-medium rounded-md">veya</span>
                        </div>
                    </div>

                    <Button3D
                        onClick={handleGoogleLogin}
                        variant="outline"
                        fullWidth
                        className="mt-6"
                        iconPosition="left"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                        Google ile Giriş Yap
                    </Button3D>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 font-medium">
                        Hesabın yok mu?{" "}
                        <Link href="/signup" className="text-primary font-bold hover:underline">
                            Hemen Kayıt Ol
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
