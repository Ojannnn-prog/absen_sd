import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { AUTH_AUDIENCE, AUTH_ISSUER } from "@/lib/auth-constants";

export { AUTH_AUDIENCE, AUTH_ISSUER } from "@/lib/auth-constants";

export type UserRole = "admin" | "teacher" | "student";

export type SessionPayload = {
  id: string;
  role: UserRole;
  username: string;
  classGroup?: string;
};

function getAuthKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey || secretKey.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return new TextEncoder().encode(secretKey);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getAuthKey());
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, getAuthKey(), {
    algorithms: ["HS256"],
    issuer: AUTH_ISSUER,
    audience: AUTH_AUDIENCE,
  });

  if (
    typeof payload.id !== "string" ||
    !["admin", "teacher", "student"].includes(String(payload.role)) ||
    typeof payload.username !== "string"
  ) {
    throw new Error("Invalid session payload");
  }

  return payload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    if (session.length > 2048) return null;
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24,
};
