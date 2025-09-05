const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();

  if (!rateLimit.has(identifier)) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const current = rateLimit.get(identifier)!;

  if (now > current.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}
