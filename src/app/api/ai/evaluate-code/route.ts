import { NextResponse } from "next/server";
import { groqChat, SMART_MODEL, extractJsonObject } from "@/lib/groq";
import { evaluateCodePrompt } from "@/lib/prompts/project";
import type { CodeFeedback } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { code, solutionCode, step, language } = await request.json();

    const prompt = evaluateCodePrompt(code, solutionCode, step, language);

    const content = await groqChat({
      model: SMART_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 3000,
      ttl: 0, // never cache — each submission is unique
    });

    let feedback: CodeFeedback;
    try {
      feedback = extractJsonObject(content) as unknown as CodeFeedback;
    } catch {
      feedback = {
        overall: "I couldn't properly evaluate your code right now. Please try again.",
        issues: [],
        suggestions: ["Make sure your code is syntactically correct"],
        score: 50,
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Code evaluation error:", error);
    return NextResponse.json({ error: "Failed to evaluate code" }, { status: 500 });
  }
}
