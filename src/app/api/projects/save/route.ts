import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId, code, currentStep, feedback, completed } = await request.json();

    // Upsert project submission
    const { data, error } = await supabase
      .from("project_submissions")
      .upsert(
        {
          user_id: user.id,
          project_id: projectId,
          code,
          current_step: currentStep,
          feedback: feedback || {},
          completed: completed || false,
          last_saved_at: new Date().toISOString(),
          completed_at: completed ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,project_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Save error:", error);
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lastSaved: data.last_saved_at,
    });
  } catch (error) {
    console.error("Project save error:", error);
    return NextResponse.json(
      { error: "Failed to save project" },
      { status: 500 }
    );
  }
}
