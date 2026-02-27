import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Null-safe Redis wrapper
// If env vars are missing (local dev / CI), all operations are no-ops/throws
// so groq.ts catch blocks handle it gracefully without SDK warning spam.
// ---------------------------------------------------------------------------

function buildClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const client = buildClient();

if (!client) {
  console.warn("[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — caching disabled.");
}

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    if (!client) throw new Error("Redis not configured");
    return client.get<T>(key);
  },

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
    if (!client) throw new Error("Redis not configured");
    await client.set(key, value, opts ?? {});
  },

  async incr(key: string): Promise<number> {
    if (!client) throw new Error("Redis not configured");
    return client.incr(key) as Promise<number>;
  },
};
