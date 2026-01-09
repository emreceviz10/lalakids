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

    date_of_birth: z.coerce.date(), // coerce string to Date
    grade_level: z.coerce.number().int().min(1).max(5), // coerce to number
    display_name: z.string().optional(),
    avatar_url: z.string().optional(),
});

export type ChildFormData = z.infer<typeof ChildProfileSchema>;
