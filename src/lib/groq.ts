import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Smart model: deep reasoning, complex generation (roadmaps, lessons, projects, quiz)
export const SMART_MODEL = "llama-3.3-70b-versatile";

// Fast model: conversational, low-latency responses (tutor chat, interview)
export const FAST_MODEL = "llama-3.1-8b-instant";

// Legacy export — kept for compatibility, points to smart model
export const AI_MODEL = SMART_MODEL;

/** Extract a JSON array from a model response, handling markdown and surrounding text */
export function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch {
      // fall through
    }
  }
  // Strip markdown fences and try again
  const stripped = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(stripped);
}

/** Extract a JSON object from a model response, handling markdown and surrounding text */
export function extractJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch {
      // fall through
    }
  }
  const stripped = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(stripped);
}

export default groq;
