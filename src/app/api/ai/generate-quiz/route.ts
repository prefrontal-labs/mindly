import { NextResponse } from "next/server";
import groq, { AI_MODEL } from "@/lib/groq";
import { generateQuizPrompt } from "@/lib/prompts/quiz";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { sectionTitle, topics, certification, difficulty, roadmapId, sectionIndex, skipCache } = await request.json();

    // Check cache first (skip on retry)
    if (roadmapId != null && sectionIndex != null && !skipCache) {
      const supabase = await createClient();
      const { data: cached } = await supabase
        .from("ai_content_cache")
        .select("content")
        .eq("roadmap_id", roadmapId)
        .eq("section_index", sectionIndex)
        .eq("content_type", "quiz")
        .single();

      if (cached?.content) {
        return NextResponse.json({ questions: cached.content, cached: true });
      }
    }

    // No cache — call LLM
    const prompt = generateQuizPrompt(sectionTitle, topics, certification, difficulty);

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content || "[]";

    let questions;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      questions = JSON.parse(jsonStr);
    } catch {
      questions = [];
    }

    // Save to cache
    if (roadmapId != null && sectionIndex != null && questions?.length > 0) {
      const supabase = await createClient();
      await supabase.from("ai_content_cache").upsert(
        { roadmap_id: roadmapId, section_index: sectionIndex, content_type: "quiz", content: questions },
        { onConflict: "roadmap_id,section_index,content_type" }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
