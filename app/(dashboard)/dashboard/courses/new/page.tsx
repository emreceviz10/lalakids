"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewCoursePage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        subject: "mathematics",
        gradeLevel: 3,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Lütfen bir dosya seçin");

        setLoading(true);

        try {
            // 1. Get Presigned URL
            const presignRes = await fetch("/api/upload/presign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                }),
            });

            const { signedUrl, fileKey, error } = await presignRes.json();
            if (error) throw new Error(error);

            // 2. Upload File to R2
            const uploadRes = await fetch(signedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            // 3. Create Course Record
            const courseRes = await fetch("/api/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    original_file_url: `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`, // Will need logic to resolve public URL or serve via proxy
                    // For now, storing fileKey or constructing URL if bucket is public or we have a domain
                    original_file_key: fileKey, // Helper for backend
                    original_file_name: file.name,
                    original_file_type: file.type.includes("pdf") ? "pdf" : "image",
                }),
            });

            if (!courseRes.ok) {
                const courseErr = await courseRes.json();
                throw new Error(courseErr.error || "Failed to create course");
            }

            router.push("/dashboard");
            router.refresh();

        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Yeni Materyal Yükle</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Başlık</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="Örn: Kesirler Çalışma Kağıdı"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ders</label>
                            <select
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="mathematics">Matematik</option>
                                <option value="science">Fen Bilimleri</option>
                                <option value="turkish_language">Türkçe</option>
                                <option value="life_sciences">Hayat Bilgisi</option>
                                <option value="english">İngilizce</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sınıf</label>
                            <select
                                value={formData.gradeLevel}
                                onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                {[1, 2, 3, 4, 5].map(g => (
                                    <option key={g} value={g}>{g}. Sınıf</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Dosya (PDF veya Resim)</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary">cloud_upload</span>
                                <p className="font-medium text-slate-500 group-hover:text-primary">
                                    {file ? file.name : "Dosyayı buraya sürükleyin veya seçin"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin material-symbols-outlined">refresh</span>
                                Yükleniyor...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Materyali Oluştur
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
