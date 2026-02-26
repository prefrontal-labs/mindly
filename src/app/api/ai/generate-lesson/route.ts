import { NextResponse } from "next/server";
import groq, { SMART_MODEL, extractJsonObject } from "@/lib/groq";
import { generateLessonPrompt } from "@/lib/prompts/lesson";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { sectionTitle, topics, certification, roadmapId, sectionIndex, topicFilter } = await request.json();

    // Cache key: use "lesson" for full section, "lesson_topic:<name>" for single topic
    const contentType = topicFilter ? `lesson_topic:${topicFilter}` : "lesson";

    // Check cache first
    if (roadmapId != null && sectionIndex != null) {
      const supabase = await createClient();
      const { data: cached } = await supabase
        .from("ai_content_cache")
        .select("content")
        .eq("roadmap_id", roadmapId)
        .eq("section_index", sectionIndex)
        .eq("content_type", contentType)
        .single();

      if (cached?.content) {
        return NextResponse.json({ lesson: cached.content, cached: true });
      }
    }

    // No cache — call LLM
    const prompt = generateLessonPrompt(sectionTitle, topics, certification);

    const completion = await groq.chat.completions.create({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const content = completion.choices[0]?.message?.content || "{}";

    let lesson;
    try {
      lesson = extractJsonObject(content);
    } catch {
      lesson = {
        overview: "Failed to parse lesson content. Please try again.",
        concepts: [],
        scenario: null,
        flashcards: [],
      };
    }

    // Save to cache
    if (roadmapId != null && sectionIndex != null && (lesson as { concepts?: unknown[] }).concepts?.length) {
      const supabase = await createClient();
      await supabase.from("ai_content_cache").upsert(
        { roadmap_id: roadmapId, section_index: sectionIndex, content_type: contentType, content: lesson },
        { onConflict: "roadmap_id,section_index,content_type" }
      );
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Lesson generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 }
    );
  }
}
