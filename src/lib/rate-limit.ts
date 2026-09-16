type LoginThrottleEntry = {
  failedAttempts: number;
  windowResetAt: number;
  cooldownUntil: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  attendanceLoginThrottle?: Map<string, LoginThrottleEntry>;
};

const loginStore = globalForRateLimit.attendanceLoginThrottle ?? new Map<string, LoginThrottleEntry>();
globalForRateLimit.attendanceLoginThrottle = loginStore;

export function getClientAddress(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

function getLoginEntry(key: string) {
  const now = Date.now();
  const current = loginStore.get(key);

  if (!current || current.windowResetAt <= now) {
    const freshEntry = {
      failedAttempts: 0,
      windowResetAt: now + LOGIN_WINDOW_MS,
      cooldownUntil: 0,
    };
    loginStore.set(key, freshEntry);
    return freshEntry;
  }

  return current;
}

export function getLoginThrottleStatus(key: string) {
  const now = Date.now();
  const entry = getLoginEntry(key);

  if (entry.cooldownUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.cooldownUntil - now) / 1000),
      attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - entry.failedAttempts),
    };
  }

  if (entry.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.windowResetAt - now) / 1000),
      attemptsRemaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfter: 0,
    attemptsRemaining: MAX_LOGIN_ATTEMPTS - entry.failedAttempts,
  };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = getLoginEntry(key);
  entry.failedAttempts += 1;

  // Tiga percobaan awal diberi kesempatan; setelah kegagalan ke-3 mulai cooldown 15 detik, lalu 30 detik.
  const cooldownSeconds =
    entry.failedAttempts < 3 ? 0 : entry.failedAttempts === 3 ? 15 : 30;
  entry.cooldownUntil = cooldownSeconds > 0 ? now + cooldownSeconds * 1000 : 0;
  loginStore.set(key, entry);

    return {
      cooldownSeconds,
      attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - entry.failedAttempts),
      initialAttemptsRemaining: Math.max(0, 3 - entry.failedAttempts),
    };
}

export function recordLoginSuccess(key: string) {
  loginStore.delete(key);
}
