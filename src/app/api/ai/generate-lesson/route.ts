import { NextResponse } from "next/server";
import { groqChat, SMART_MODEL, extractJsonObject } from "@/lib/groq";
import { generateLessonPrompt } from "@/lib/prompts/lesson";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { sectionTitle, topics, certification, topicFilter } = await request.json();

    const title = topicFilter || sectionTitle;
    const resolvedTopics = topicFilter ? [topicFilter] : topics;
    const prompt = generateLessonPrompt(title, resolvedTopics, certification);

    const content = await groqChat({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 6000,
      ttl: 86400, // 24h — same lesson for same section/topic
    });

    let lesson;
    try {
      lesson = extractJsonObject(content);
    } catch {
      lesson = { overview: "Failed to parse lesson content. Please try again.", concepts: [], scenarios: [], flashcards: [] };
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Lesson generation error:", error);
    return NextResponse.json({ error: "Failed to generate lesson" }, { status: 500 });
  }
}
