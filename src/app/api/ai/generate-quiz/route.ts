import { NextResponse } from "next/server";
import { groqChat, SMART_MODEL, extractJsonArray } from "@/lib/groq";
import { generateQuizPrompt } from "@/lib/prompts/quiz";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { sectionTitle, topics, certification, difficulty, skipCache } = await request.json();

    const prompt = generateQuizPrompt(sectionTitle, topics, certification, difficulty);

    const content = await groqChat({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 6000,
      ttl: skipCache ? 0 : 86400, // 24h, bypass on explicit retry
    });

    let questions: unknown[];
    try {
      questions = extractJsonArray(content);
    } catch {
      questions = [];
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
  }
}
