import { createClient } from "@/lib/supabase/server";
import { visionModel } from "@/lib/ai/gemini";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { extractTextFromDocument, isTextDocument } from '@/lib/extraction/textExtractor';
import { convertImageToJpg, requiresConversion, isImage } from '@/lib/extraction/imageConverter';

export const maxDuration = 60; // Set max duration to 60 seconds

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

const ERROR_MESSAGES = {
    UNSUPPORTED_FORMAT: 'Desteklenmeyen dosya formatı. Kabul edilen formatlar:\n' +
        '📄 PDF: .pdf (max 50MB)\n' +
        '📝 Belgeler: .txt, .docx, .rtf, .odt, .md (max 20MB)\n' +
        '🖼️ Görseller: .jpg, .png, .webp, .heic, .tiff (max 10MB)',
    HEIC_CONVERSION_FAILED: 'iPhone fotoğrafı dönüştürülemedi. Alternatif çözümler:\n' +
        '1. Fotoğrafları Paylaş menüsünden JPG olarak dışa aktarın\n' +
        '2. Ekran görüntüsü alın\n' +
        '3. Fotoğraflar uygulamasında "Kopyala" yapıp yapıştırın',
    IMAGE_CONVERSION_FAILED: 'Görsel dönüştürülemedi. Lütfen dosyayı JPG veya PNG formatında dışa aktarıp tekrar deneyin.',
    TEXT_EXTRACTION_FAILED: 'Metin çıkarılamadı. Dosya bozuk veya desteklenmiyor olabilir. Lütfen PDF olarak kaydedip tekrar deneyin.'
};

/**
 * PDF Text Extraction using pdf-parse
 */
async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedPage[] | null> {
    try {
        console.log("[PDF-Text] Loading pdf-parse module...");
        // @ts-ignore
        const pdf = require('pdf-parse');
        const options = {
            pagerender: async function (pageData: any) {
                const textContent = await pageData.getTextContent();
                let text = '';
                let lastY;
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) text += item.str;
                    else text += '\n' + item.str;
                    lastY = item.transform[5];
                }
                return text;
            }
        };

        const data = await pdf(buffer, options);
        // pdf-parse returns total text. We probably want page-by-page.
        // The default pdf-parse logic merges everything unless we handle it carefully.
        // For now, retaining similar logic to previous implementation which pushed to `pages` via pagerender callback.
        // Wait, the previous implementation had logic inside pagerender pushing to `pages` array.
        // BUT `pdf-parse` is synchronous-ish inside `pdf(buffer, options)`.
        // I need to capture page content.

        // Re-implementing the capture logic correctly from previous version:
        // The previous version had `const pages: ExtractedPage[] = [];` in outer scope of `extractTextFromPDF`
        // and pushed inside `pagerender`.

        const pages: ExtractedPage[] = [];
        const captureOptions = {
            pagerender: async function (pageData: any) {
                const textContent = await pageData.getTextContent();
                let text = '';
                let lastY;
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) text += item.str;
                    else text += '\n' + item.str;
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

        await pdf(buffer, captureOptions);
        pages.sort((a, b) => a.pageNumber - b.pageNumber);

        const totalTextLength = pages.reduce((sum, p) => sum + p.content.length, 0);
        if (pages.length === 0 || (totalTextLength / pages.length) < 50) {
            console.log(`[PDF-Text] Low text density. Falling back to OCR.`);
            return null;
        }
        return pages;
    } catch (error) {
        console.warn("[PDF-Text] Extraction failed:", error);
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
        const supabase = await createClient();

        // 1. Verify Authentication & Ownership
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .single();

        if (courseError || !course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
        if (course.parent_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        // Update status to processing
        await supabase.from("courses").update({ status: "ocr_processing", error_message: null }).eq("id", courseId);

        // 2. Download File
        const s3Client = new S3Client({
            region: "auto",
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
            },
        });

        const urlObj = new URL(course.original_file_url);
        const fileKey = urlObj.pathname.split('/').filter(Boolean).join('/');

        const s3Response = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: fileKey,
        }));

        if (!s3Response.Body) throw new Error("Empty file from R2");
        const fileBuffer = Buffer.from(await s3Response.Body.transformToByteArray());

        // 3. Determine File Format
        // Use stored file_format if available, else derive AND STORE IT if missing (migration handling)
        let fileExtension = course.file_format || course.original_file_type;
        if (!fileExtension || fileExtension === 'pdf' || fileExtension === 'image') {
            // fallback to extension from key
            fileExtension = fileKey.split('.').pop()?.toLowerCase() || '';
        }

        console.log(`Processing file: ${fileKey} (${fileExtension})`);

        let extractedPages: ExtractedPage[] = [];
        let method = "Gemini Vision";
        let processingMetadata = {};

        // === ROUTE 1: Text Documents ===
        if (isTextDocument(fileExtension)) {
            console.log(`[Text Extraction] Processing ${fileExtension} document`);
            try {
                const result = await extractTextFromDocument(fileBuffer, fileExtension);
                extractedPages = [{ pageNumber: 1, content: result.text }];
                method = `Text Extraction (${result.format})`;
                processingMetadata = result.metadata || {};
            } catch (error: any) {
                console.error("Text extraction failed:", error);
                throw new Error(`${ERROR_MESSAGES.TEXT_EXTRACTION_FAILED} (${error.message})`);
            }
        }

        // === ROUTE 2: Images (Convert & Vision) ===
        else if (isImage(fileExtension)) {
            let imageBuffer = fileBuffer;
            let mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

            if (requiresConversion(fileExtension)) {
                console.log(`[Image Conversion] Converting ${fileExtension} -> JPG`);
                try {
                    const conversion = await convertImageToJpg(fileBuffer, fileExtension);
                    imageBuffer = conversion.buffer as any;
                    mimeType = 'image/jpeg';
                    method = `Gemini Vision (Converted from ${fileExtension})`;

                    // Upload converted file (Optional/Temporary)
                    const convertedKey = `converted/${course.student_id}/${Date.now()}_converted.jpg`;
                    await s3Client.send(new PutObjectCommand({
                        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
                        Key: convertedKey,
                        Body: imageBuffer,
                        ContentType: 'image/jpeg'
                    }));

                } catch (error: any) {
                    console.error("Image conversion failed:", error);
                    const msg = fileExtension === 'heic' ? ERROR_MESSAGES.HEIC_CONVERSION_FAILED : ERROR_MESSAGES.IMAGE_CONVERSION_FAILED;
                    throw new Error(msg);
                }
            }

            // Process with Gemini
            console.log("[Gemini] Analyzing image...");
            const base64Content = imageBuffer.toString("base64");
            const result = await visionModel.generateContent([
                OCR_PROMPT,
                { inlineData: { data: base64Content, mimeType: mimeType } }
            ]);
            const responseText = result.response.text();
            extractedPages = parseGeminiResponse(responseText);
        }

        // === ROUTE 3: PDF (Native or Vision) ===
        else if (fileExtension === 'pdf' || !fileExtension) {
            // 1. Try Native Text Extraction
            const textPages = await extractTextFromPDF(fileBuffer);
            if (textPages) {
                extractedPages = textPages;
                method = "PDF Text Layer";
            } else {
                // 2. Fallback to Gemini
                console.log("[Gemini] Analyzing PDF...");
                const base64Content = fileBuffer.toString("base64");
                const result = await visionModel.generateContent([
                    OCR_PROMPT,
                    { inlineData: { data: base64Content, mimeType: "application/pdf" } }
                ]);
                extractedPages = parseGeminiResponse(result.response.text());
            }
        }

        else {
            throw new Error(ERROR_MESSAGES.UNSUPPORTED_FORMAT);
        }

        // 4. Save Results
        if (!extractedPages.length) throw new Error("İçerik çıkarılamadı.");

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
            processing_metadata: { method, ...processingMetadata },
            updated_at: new Date().toISOString()
        }).eq("id", courseId);

        return NextResponse.json({
            success: true,
            method,
            pageCount: extractedPages.length
        });

    } catch (error: any) {
        console.error("Processing Error:", error);

        // Update DB with error
        try {
            const { courseId } = await params;
            const supabase = await createClient();
            await supabase.from("courses").update({
                status: "error",
                error_message: error.message || "Bilinmeyen hata",
                updated_at: new Date().toISOString()
            }).eq("id", courseId);
        } catch { }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function parseGeminiResponse(text: string): ExtractedPage[] {
    try {
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        return (JSON.parse(cleaned) as GeminiOCRResponse).pages;
    } catch (e) {
        console.error("Gemini Parse Error:", text);
        throw new Error("Yapay zeka yanıtı anlaşılamadı (JSON hatası)");
    }
}
