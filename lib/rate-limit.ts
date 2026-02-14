/**
 * Serverless-safe token-bucket rate limiter
 * Uses a Map that resets per-invocation (best-effort for serverless).
 * For production with real enforcement, swap to Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitEntry {
    tokens: number;
    lastRefill: number;
}

// Global scope — persists within a single warm function instance
const rateLimitMap = new Map<string, RateLimitEntry>();

// Lazy cleanup: evict stale keys inline instead of setInterval (avoids leaks in dev HMR)
function cleanupStale() {
    const now = Date.now();
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, entry] of entries) {
        if (now - entry.lastRefill > 10 * 60 * 1000) {
            rateLimitMap.delete(key);
        }
    }
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (usually IP address)
 * @param maxTokens - Maximum number of tokens (requests) per interval
 * @param intervalMs - Time interval in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function rateLimit(
    identifier: string,
    maxTokens: number = 5,
    intervalMs: number = 60 * 1000
): boolean {
    // Periodic cleanup on ~5% of calls
    if (Math.random() < 0.05) cleanupStale();

    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry) {
        rateLimitMap.set(identifier, {
            tokens: maxTokens - 1,
            lastRefill: now,
        });
        return true;
    }

    // Calculate time elapsed and refill tokens
    const elapsed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((elapsed / intervalMs) * maxTokens);

    if (tokensToAdd > 0) {
        entry.tokens = Math.min(maxTokens, entry.tokens + tokensToAdd);
        entry.lastRefill = now;
    }

    if (entry.tokens > 0) {
        entry.tokens--;
        return true;
    }

    return false;
}

/**
 * Get remaining tokens for an identifier
 */
export function getRemainingTokens(
    identifier: string,
    maxTokens: number = 5
): number {
    const entry = rateLimitMap.get(identifier);
    if (!entry) return maxTokens;
    return entry.tokens;
}
