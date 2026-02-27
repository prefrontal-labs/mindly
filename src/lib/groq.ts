import Groq from "groq-sdk";
import { createHash } from "crypto";
import { redis } from "./redis";

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------
export const SMART_MODEL = "llama-3.3-70b-versatile";
export const FAST_MODEL  = "llama-3.1-8b-instant";
export const AI_MODEL    = SMART_MODEL; // legacy alias

// ---------------------------------------------------------------------------
// Key rotation — reads GROQ_API_KEY_1, GROQ_API_KEY_2, ... from env
// Falls back to GROQ_API_KEY if no numbered keys are found
// ---------------------------------------------------------------------------
function getApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) keys.push(key);
    else break;
  }
  if (keys.length === 0 && process.env.GROQ_API_KEY) {
    keys.push(process.env.GROQ_API_KEY);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// groqChat — single entry point for all LLM calls
// Handles: Redis cache → key rotation → 429 retry → cache write
// ---------------------------------------------------------------------------
export interface GroqChatOptions {
  model: string;
  messages: { role: "user" | "system" | "assistant"; content: string }[];
  temperature?: number;
  max_tokens?: number;
  /** Cache TTL in seconds. 0 = never cache (use for conversational / per-user calls) */
  ttl?: number;
}

export async function groqChat(options: GroqChatOptions): Promise<string> {
  const { model, messages, temperature = 0.7, max_tokens = 4000, ttl = 86400 } = options;

  // --- Cache check ---
  let cacheKey = "";
  if (ttl > 0) {
    const fingerprint = messages.map((m) => m.content).join("|");
    cacheKey = `groq:${createHash("md5").update(`${model}:${fingerprint}`).digest("hex")}`;
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) return cached;
    } catch {
      // Redis unavailable — proceed to Groq
    }
  }

  // --- Key selection via round-robin counter ---
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("No Groq API keys configured. Set GROQ_API_KEY_1 in env.");

  let startIndex = 0;
  try {
    const counter = await redis.incr("groq:key_counter");
    startIndex = Number(counter) % keys.length;
  } catch {
    startIndex = Math.floor(Math.random() * keys.length);
  }

  // --- Call Groq, rotate key on 429 ---
  let lastError: unknown;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (startIndex + attempt) % keys.length;
    const client = new Groq({ apiKey: keys[keyIndex] });

    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const content = completion.choices[0]?.message?.content ?? "";

      // --- Write to cache ---
      if (ttl > 0 && content && cacheKey) {
        try {
          await redis.set(cacheKey, content, { ex: ttl });
        } catch {
          // Cache write failure is non-fatal
        }
      }

      return content;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit");
      if (isRateLimit && attempt < keys.length - 1) {
        // rotate to next key
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error("All Groq API keys exhausted");
}

// ---------------------------------------------------------------------------
// JSON extraction helpers
// ---------------------------------------------------------------------------
export function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end   = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.substring(start, end + 1)); } catch { /* fall through */ }
  }
  const stripped = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(stripped);
}

export function extractJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.substring(start, end + 1)); } catch { /* fall through */ }
  }
  const stripped = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(stripped);
}
