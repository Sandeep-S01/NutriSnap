import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logTracker } from './logger';

let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a rate limiter that allows 45 requests per minute
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(45, '60 s'),
      analytics: true,
      prefix: 'scanfood_ratelimit',
    });
    logTracker.info('Upstash Redis Rate Limiter initialized successfully');
  } catch (err) {
    logTracker.apiError('Upstash Redis Rate Limiter initialization', err);
  }
} else {
  logTracker.warn('Upstash Redis environment variables are missing. Rate limiting is disabled.');
}

/**
 * Checks if a given identifier (e.g. IP address) has exceeded the rate limit.
 * Returns true if allowed, false if rate limited.
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!ratelimit) {
    // If not configured, bypass rate limiting
    return { success: true, limit: 45, remaining: 45, reset: Date.now() + 60000 };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    logTracker.apiError('Rate limiting check', err);
    // Bypass on error to prevent blocking users due to network issues with Upstash Redis
    return { success: true, limit: 45, remaining: 45, reset: Date.now() + 60000 };
  }
}
