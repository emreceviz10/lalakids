import { model } from "./gemini";
import { createClient } from "@/lib/supabase/server";
import { GeneratedLesson, ExtractedContent } from "./types";

export async function processCourse(courseId: string) {
    console.log(`Starting processing for course ${courseId}`);
    const supabase = await createClient();

    try {
        // 1. Fetch Course Data
        const { data: course, error } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .single();

        if (error || !course) throw new Error("Course not found");

        await supabase
            .from("courses")
            .update({ status: "processing", error_message: null })
            .eq("id", courseId);

        // 2. Download File
        const fileBuffer = await downloadFile(course.original_file_url);

        // 3. Vision API (Extract Context)
        console.log("Analyzing visual content...");
        const extractedContent = await analyzeContent(fileBuffer, course.original_file_type);

        // 4. Update Course Metadata
        await supabase.from("courses").update({
            extracted_concepts: extractedContent.concepts,
            status: "generating_content"
        }).eq("id", courseId);

        // 5. Generate Lesson Content
        console.log("Generating lesson content...");
        const lesson = await generateLessonContent(extractedContent, course.grade_level);

        // 6. Save Content to DB
        if (lesson.scenes.length > 0) {
            const scenesData = lesson.scenes.map(scene => ({
                course_id: courseId,
                scene_order: scene.order,
                narrative_text: scene.narrative,
                visual_description: scene.visualPrompt,
                learning_objective: scene.educationalGoal
            }));
            await supabase.from("scenes").insert(scenesData);
        }

        // Set status to ready
        await supabase.from("courses").update({
            status: "ready"
        }).eq("id", courseId);

        console.log(`Course ${courseId} processing complete.`);

    } catch (error: any) {
        console.error("Pipeline Error:", error);
        await supabase
            .from("courses")
            .update({ status: "error", error_message: error.message })
            .eq("id", courseId);
    }
}

async function downloadFile(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function analyzeContent(buffer: Buffer, fileType: string): Promise<ExtractedContent> {
    const prompt = `
      Analyze this educational material.
      Extract the main topics, key concepts, and suggested subject area.
      Return strictly JSON: { "concepts": [], "topics": [], "subject": "Math|Science|etc", "gradeLevel": number, "rawText": "summary" }
    `;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType: fileType === "pdf" ? "application/pdf" : "image/jpeg"
            }
        }
    ]);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text) as ExtractedContent;
}

async function generateLessonContent(content: ExtractedContent, grade: number): Promise<GeneratedLesson> {
    const prompt = `
      Create a gamified lesson for a Grade ${grade} student.
      Concepts: ${content.concepts.join(", ")}.
      
      Requirements:
      1. Story Mode: 5-7 scenes. 
      2. Flashcards: 5 terms.
      3. Quiz: 5 multiple choice.
      
      Return strictly JSON struct:
      {
        "scenes": [{ "order": 1, "narrative": "...", "visualPrompt": "...", "educationalGoal": "..." }],
        "flashcards": [{ "term": "...", "definition": "...", "example": "..." }],
        "quiz": [{ "question": "...", "options": ["A","B","C","D"], "correctAnswerIndex": 0, "explanation": "..." }],
        "summary": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr) as GeneratedLesson;
}
