'use server';

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * Process OCR for a course by calling the API route
 * This approach avoids using Node.js/Browser specific libraries (like pdf-parse) in the Server Action environment
 * which can cause "DOMMatrix is not defined" errors.
 */
export async function processCourseOCR(courseId: string): Promise<{
    success: boolean;
    message: string;
    pageCount?: number;
}> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    try {
        // Forward cookies for authentication
        const cookieHeader = (await headers()).get('cookie') || '';

        const response = await fetch(`${baseUrl}/api/courses/${courseId}/process-ocr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            }
        });

        const contentType = response.headers.get("content-type");

        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error("❌ Non-JSON API Response received:", text.substring(0, 500));
            return {
                success: false,
                message: "Sunucudan beklenmeyen yanıt alındı (HTML/Text)"
            };
        }

        if (!response.ok) {
            return {
                success: false,
                message: data.error || data.details || "İşlem başarısız oldu"
            };
        }

        return {
            success: true,
            message: data.message,
            pageCount: data.pageCount
        };

    } catch (error: any) {
        console.error("OCR Action Error:", error);
        return {
            success: false,
            message: error.message || "Bağlantı hatası oluştu"
        };
    }
}

/**
 * Get course processing status
 * @param courseId - UUID of the course
 * @returns Current status and page count
 */
export async function getCourseStatus(courseId: string): Promise<{
    status: string | null;
    pageCount: number | null;
    errorMessage: string | null;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courses")
        .select("status, page_count, error_message")
        .eq("id", courseId)
        .single();

    if (error || !data) {
        return {
            status: null,
            pageCount: null,
            errorMessage: "Kurs bulunamadı"
        };
    }

    return {
        status: data.status,
        pageCount: data.page_count,
        errorMessage: data.error_message
    };
}
