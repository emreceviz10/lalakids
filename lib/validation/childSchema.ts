import { z } from 'zod';

export const ChildProfileSchema = z.object({
    first_name: z.string()
        .min(2, 'İsim en az 2 karakter olmalı')
        .max(100, 'İsim çok uzun')
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'İsim sadece harf içerebilir'),

    last_name: z.string()
        .min(2, 'Soyisim en az 2 karakter olmalı')
        .max(100, 'Soyisim çok uzun')
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Soyisim sadece harf içerebilir'),

    display_name: z.string()
        .min(2, 'Görünen isim en az 2 karakter olmalı')
        .max(50, 'Görünen isim çok uzun')
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Görünen isim sadece harf içerebilir')
        .optional()
        .or(z.literal('')),

    date_of_birth: z.string().transform((str) => new Date(str)).pipe(
        z.date()
            .max(new Date(), 'Doğum tarihi gelecekte olamaz')
            .min(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'Çocuk 18 yaşından küçük olmalı')
    ).or(z.date()),

    grade_level: z.coerce.number()
        .int()
        .min(1, 'Sınıf seviyesi 1-5 arasında olmalı')
        .max(5, 'Sınıf seviyesi 1-5 arasında olmalı'),

    avatar_url: z.string().url().optional(),
});

export type ChildFormData = z.infer<typeof ChildProfileSchema>;
