
import { createClient } from "@/lib/supabase/server";
import { visionModel } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 60; // Set max duration to 60 seconds for OCR processing

interface ExtractedPage {
    pageNumber: number;
    content: string;
}

interface GeminiOCRResponse {
    pages: ExtractedPage[];
}

const OCR_PROMPT = `Bu eğitim materyalini analiz et. Tüm metin içeriğini doğru bir şekilde çıkar.

Kurallar:
1. Dil: Türkçe - Türkçe karakterleri doğru şekilde çıkar (ş, ğ, ü, ö, ç, ı)
2. Başlıkları, alt başlıkları, soruları ve cevapları koru
3. Formatı ve yapıyı mümkün olduğunca koru
4. Her sayfa için temiz, okunabilir metin döndür
5. Matematik formüllerini ve sembolleri metin olarak yaz

Yanıtı SADECE aşağıdaki JSON formatında ver, başka hiçbir şey ekleme:
{
  "pages": [
    { "pageNumber": 1, "content": "sayfa içeriği buraya..." },
    { "pageNumber": 2, "content": "sayfa içeriği buraya..." }
  ]
}

Eğer tek sayfa varsa, tek elemanlı dizi döndür.`;

/**
 * Attempts to extract text directly from PDF buffer using pdf-parse
 */
async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedPage[] | null> {
    try {
        console.log("[PDF-Text] Loading pdf-parse module...");
        // Lazy load pdf-parse to avoid top-level crashes in serverless/edge environments
        // @ts-ignore
        const pdf = require('pdf-parse');

        const pages: ExtractedPage[] = [];

        const options = {
            pagerender: async function (pageData: any) {
                const textContent = await pageData.getTextContent();
                let text = '';
                let lastY;

                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) {
                        text += item.str;
                    }
                    else {
                        text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                }

                const content = text.trim();
                if (content) {
                    pages.push({
                        pageNumber: pageData.pageIndex + 1,
                        content: content
                    });
                }
                return text;
            }
        };

        await pdf(buffer, options);

        pages.sort((a, b) => a.pageNumber - b.pageNumber);

        const totalTextLength = pages.reduce((sum, p) => sum + p.content.length, 0);

        if (pages.length === 0 || (totalTextLength / pages.length) < 50) {
            console.log(`[PDF-Text] Low text density (${totalTextLength} chars in ${pages.length} pages). Falling back to OCR.`);
            return null;
        }

        console.log(`[PDF-Text] Successfully extracted text from ${pages.length} pages using text layer.`);
        return pages;

    } catch (error) {
        console.warn("[PDF-Text] Extraction failed or module missing, falling back to Gemini:", error);
        return null;
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    console.log("🔍 OCR API Route Hit");

    try {
        const { courseId } = await params;
        console.log("🔍 OCR Processing CourseId:", courseId);

        const supabase = await createClient();

        // 1. Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error("❌ Auth Error:", authError);
            return NextResponse.json(
                { error: "Unauthorized - No valid session" },
                { status: 401 }
            );
        }

        // 2. Fetch course record
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            console.error("❌ Course Fetch Error:", courseError);
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404 }
            );
        }

        // 3. Verify ownership
        if (course.parent_id !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized - You do not own this course" },
                { status: 403 }
            );
        }

        // 4. Update status
        await supabase.from("courses").update({ status: "ocr_processing", error_message: null }).eq("id", courseId);

        // 5. Download file using Authenticated R2 Client
        // Using correct CLOUDFLARE_ prefixed env vars
        console.log(`[OCR] Initializing R2 Client for bucket: ${process.env.CLOUDFLARE_R2_BUCKET_NAME}`);

        const s3Client = new S3Client({
            region: "auto",
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
            },
        });

        // Parse course.original_file_url to get KEY
        const urlObj = new URL(course.original_file_url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const fileKey = pathParts.join('/');

        console.log("[OCR] Fetching object with Key:", fileKey);

        const command = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: fileKey,
        });

        const s3Response = await s3Client.send(command);

        if (!s3Response.Body) {
            throw new Error("R2 response body is empty");
        }

        // Convert stream to Buffer
        const byteArray = await s3Response.Body.transformToByteArray();
        const buffer = Buffer.from(byteArray);

        console.log(`[OCR] File downloaded successfully. Size: ${buffer.length} bytes`);

        let extractedPages: ExtractedPage[] = [];
        let method = "Gemini Vision";

        // 6. Hybrid Strategy
        if (course.original_file_type === 'pdf') {
            console.log("[OCR] Attempting native PDF text extraction...");
            const pdfTextPages = await extractTextFromPDF(buffer);

            if (pdfTextPages && pdfTextPages.length > 0) {
                extractedPages = pdfTextPages;
                method = "PDF Text Layer";
            }
        }

        // 7. Fallback to Gemini
        if (extractedPages.length === 0) {
            console.log("[OCR] Using Gemini Vision API...");

            if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
                console.error("❌ Missing GOOGLE_GENERATIVE_AI_API_KEY");
                throw new Error("Missing Gemini API Key configuration");
            }

            const base64Content = buffer.toString("base64");
            const mimeType = course.original_file_type === "pdf" ? "application/pdf" : `image/${course.original_file_type}`;

            const result = await visionModel.generateContent([
                OCR_PROMPT,
                { inlineData: { data: base64Content, mimeType: mimeType } }
            ]);

            const responseText = result.response.text();

            try {
                let cleanedText = responseText.trim();
                // Strip markdown code fences if present
                if (cleanedText.startsWith('```json')) {
                    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                } else if (cleanedText.startsWith('```')) {
                    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }

                extractedPages = (JSON.parse(cleanedText) as GeminiOCRResponse).pages;
            } catch (e) {
                console.error("Gemini Parse Error. Raw text:", responseText);
                throw new Error("Invalid response from AI model");
            }
        }

        if (!extractedPages?.length) {
            throw new Error("No content extracted from file");
        }

        // 8. Save results
        console.log(`[OCR] Saving ${extractedPages.length} pages...`);

        await supabase.from("course_pages").delete().eq("course_id", courseId);

        const { error: insertError } = await supabase.from("course_pages").insert(
            extractedPages.map(p => ({
                course_id: courseId,
                page_number: p.pageNumber,
                content: p.content
            }))
        );

        if (insertError) throw new Error(`DB Insert Error: ${insertError.message}`);

        await supabase.from("courses").update({
            status: "analyzing",
            page_count: extractedPages.length,
            updated_at: new Date().toISOString()
        }).eq("id", courseId);

        return NextResponse.json({
            success: true,
            message: `Processed via ${method}`,
            pageCount: extractedPages.length
        });

    } catch (error: any) {
        console.error("❌ OCR API Critical Error:", error);

        // Attempt to update DB status to error
        try {
            // Only if we have courseId from params
            const { courseId } = await params;
            const supabase = await createClient();
            await supabase.from("courses").update({
                status: "error",
                error_message: error.message || "Unknown error",
                updated_at: new Date().toISOString()
            }).eq("id", courseId);
        } catch (dbError) {
            console.error("Failed to update course status to error:", dbError);
        }

        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
