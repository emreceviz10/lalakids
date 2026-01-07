import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { processCourse } from "@/lib/ai/pipeline";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            title,
            subject,
            gradeLevel,
            original_file_url,
            original_file_name,
            original_file_type
        } = body;

        // Basic validation
        if (!title || !original_file_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert into Supabase
        const { data: course, error } = await supabase
            .from("courses")
            .insert({
                parent_id: user.id,
                student_id: user.id, // Assign to self as placeholder
                title,
                subject,
                grade_level: gradeLevel,
                original_file_url,
                original_file_name,
                original_file_type,
                status: "pending",
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Trigger AI Pipeline (Asynchronous start)
        // In a real serverless env (Vercel), this might timeout if awaited.
        // Ideally use Inngest/Trigger.dev, or `waitUntil` if supported.
        // For local dev/MVP, we can just not await it or let it run.
        console.log("Triggering pipeline for:", course.id);
        processCourse(course.id).catch(err => console.error("Async Pipeline Error:", err));

        return NextResponse.json({ success: true, course });

    } catch (err: any) {
        console.error("Course creation error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
