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

  // Get roadmap IDs to clean up dependent tables
  const { data: roadmaps } = await admin
    .from("roadmaps")
    .select("id")
    .eq("user_id", userId);

  const roadmapIds = (roadmaps ?? []).map((r: { id: string }) => r.id);

  // Delete in dependency order
  if (roadmapIds.length > 0) {
    await admin.from("ai_content_cache").delete().in("roadmap_id", roadmapIds);
    await admin.from("section_progress").delete().eq("user_id", userId);
    await admin.from("quiz_attempts").delete().eq("user_id", userId);
    await admin.from("project_submissions").delete().eq("user_id", userId);
    await admin.from("chat_sessions").delete().eq("user_id", userId);
    await admin.from("roadmaps").delete().eq("user_id", userId);
  }

  await admin.from("user_badges").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.from("users").delete().eq("id", userId);

  // Finally delete from auth.users
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
