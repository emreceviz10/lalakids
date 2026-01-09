import { z } from 'zod';

export const ChildProfileSchema = z.object({
    first_name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    last_name: z.string().min(2, 'Soyisim en az 2 karakter olmalı'),
    date_of_birth: z.preprocess(
        (arg) => {
            if (typeof arg === 'string' || arg instanceof Date) {
                return new Date(arg);
            }
            return arg;
        },
        z.date({ required_error: 'Doğum tarihi gerekli' })
    ),
    grade_level: z.preprocess(
        (arg) => {
            if (typeof arg === 'string') {
                return parseInt(arg, 10);
            }
            return arg;
        },
        z.number().int().min(1).max(5)
    ),
    display_name: z.string().optional(),
    avatar_url: z.string().optional(),
});

export type ChildFormData = {
    first_name: string;
    last_name: string;
    date_of_birth: Date;
    grade_level: number;
    display_name?: string;
    avatar_url?: string;
};
