import { z } from 'zod';

// Simple schema with string-based fields for form compatibility
// Type conversion happens in onSubmit handler
export const ChildProfileSchema = z.object({
    first_name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    last_name: z.string().min(2, 'Soyisim en az 2 karakter olmalı'),
    date_of_birth: z.string().min(1, 'Doğum tarihi gerekli'), // HTML date input returns string
    grade_level: z.string().or(z.number()), // Select returns string, we convert in onSubmit
    display_name: z.string().optional(),
    avatar_url: z.string().optional(),
});

export type ChildFormData = z.infer<typeof ChildProfileSchema>;
