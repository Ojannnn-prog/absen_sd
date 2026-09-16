import { getSession, type UserRole } from "@/lib/auth";

export async function requireRole(roles: UserRole | UserRole[]) {
  const session = await getSession();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!session || !allowedRoles.includes(session.role as UserRole)) {
    throw new Error("Unauthorized");
  }

  return session;
}

export function isValidClassGroup(value: unknown): value is "A" | "B" | "C" {
  return value === "A" || value === "B" || value === "C";
}

export function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9_-]{1,100}$/i.test(value);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
