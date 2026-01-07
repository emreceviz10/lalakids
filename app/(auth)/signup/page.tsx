"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button3D } from "@/components/ui/button-3d";

export default function SignupPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    role: "parent", // Default to parent for signup flow
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            setError("Kayıt başarılı! Lütfen e-postanızı kontrol edin.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary-500 via-secondary-500 to-pink-500">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

            <Card variant="glass" padding="lg" className="w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="flex flex-col items-center mb-8">
                    <div className="size-16 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-lg shadow-secondary/30 mb-4 transform rotate-6">
                        <span className="text-3xl">👨‍👩‍👧‍👦</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight font-display">Ebeveyn Kaydı</h1>
                    <p className="text-slate-500 font-medium">Çocuğunuzun eğitim yolculuğuna başlayın</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Ad</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="glass-input w-full px-4 py-3 outline-none font-medium"
                                placeholder="Adınız"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Soyad</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="glass-input w-full px-4 py-3 outline-none font-medium"
                                placeholder="Soyadınız"
                                required
                            />
                        </div>
                    </div>

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
                        <div className={`p-3 rounded-2xl text-sm font-bold border flex items-center gap-2 ${error.includes("başarılı") ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                            <span className="text-lg">{error.includes("başarılı") ? "✅" : "⚠️"}</span> {error}
                        </div>
                    )}

                    <Button3D
                        type="submit"
                        disabled={loading}
                        loading={loading}
                        fullWidth
                        className="py-3.5"
                    >
                        {loading ? "Kaydediliyor..." : "Hesap Oluştur"}
                    </Button3D>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 font-medium">
                        Zaten hesabın var mı?{" "}
                        <Link href="/login" className="text-secondary font-bold hover:underline">
                            Giriş Yap
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
