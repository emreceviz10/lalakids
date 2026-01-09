import { z } from 'zod';

export const ChildProfileSchema = z.object({
    first_name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    last_name: z.string().min(2, 'Soyisim en az 2 karakter olmalı'),
    date_of_birth: z.coerce.date({
        required_error: "Doğum tarihi gerekli",
        invalid_type_error: "Geçersiz tarih formatı",
    }),
    grade_level: z.coerce.number()
        .int()
        .min(1, 'Sınıf seviyesi 1-5 arasında olmalı')
        .max(5, 'Sınıf seviyesi 1-5 arasında olmalı'),
    display_name: z.string().optional(),
    avatar_url: z.string().optional(),
});

export type ChildFormData = z.infer<typeof ChildProfileSchema>;
