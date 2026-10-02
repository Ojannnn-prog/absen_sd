type AiRateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForAiRateLimit = globalThis as typeof globalThis & {
  temanMuRateLimit?: Map<string, AiRateLimitEntry>;
};

const store = globalForAiRateLimit.temanMuRateLimit ?? new Map<string, AiRateLimitEntry>();
globalForAiRateLimit.temanMuRateLimit = store;

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;

export function consumeTemanMuRateLimit(key: string) {
  const now = Date.now();
  const current = store.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + WINDOW_MS }
    : current;

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  store.set(key, entry);

  return { allowed: true, retryAfter: 0 };
}
