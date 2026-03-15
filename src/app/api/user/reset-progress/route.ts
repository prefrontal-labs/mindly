import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const userId = user.id;

  // Get user's roadmap IDs for dependent table cleanup
  const { data: roadmaps } = await admin
    .from("roadmaps")
    .select("id")
    .eq("user_id", userId);

  const roadmapIds = (roadmaps ?? []).map((r: { id: string }) => r.id);

  if (roadmapIds.length > 0) {
    await admin.from("ai_content_cache").delete().in("roadmap_id", roadmapIds);
    await admin.from("chat_sessions").delete().eq("user_id", userId);
  }

  await admin.from("section_progress").delete().eq("user_id", userId);
  await admin.from("quiz_attempts").delete().eq("user_id", userId);
  await admin.from("project_submissions").delete().eq("user_id", userId);
  await admin.from("user_badges").delete().eq("user_id", userId);

  return NextResponse.json({ success: true });
}
