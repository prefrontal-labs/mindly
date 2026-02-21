import { NextResponse } from "next/server";
import groq, { AI_MODEL } from "@/lib/groq";
import { getTutorSystemPrompt } from "@/lib/prompts/tutor";
import { getInterviewSystemPrompt } from "@/lib/prompts/interview";
import type { ChatMessage } from "@/types";

export async function POST(request: Request) {
  try {
    const {
      messages,
      sectionTitle,
      topics,
      certification,
      sessionType,
    }: {
      messages: ChatMessage[];
      sectionTitle?: string;
      topics?: string[];
      certification?: string;
      sessionType: "tutor" | "interview";
    } = await request.json();

    const systemPrompt =
      sessionType === "interview"
        ? getInterviewSystemPrompt(certification || "Agentic AI Fundamentals")
        : getTutorSystemPrompt(
            sectionTitle || "General",
            topics || [],
            certification || "Agentic AI Fundamentals"
          );

    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
