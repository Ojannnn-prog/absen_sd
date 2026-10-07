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

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function getSession(): Promise<SessionPayload | null> {
  // 1. Cek sesi cookie lokal terlebih dahulu (Login Username & Password)
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (session && session.length <= 2048) {
      const payload = await decrypt(session);
      if (payload) return payload;
    }
  } catch (error) {
    // Lanjutkan pengecekan ke sesi Clerk
  }

  // 2. Cek sesi Clerk (Login Google / OAuth)
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      process.env.CLERK_SECRET_KEY = "sk_test_xcRc9sw6Jh1CcZkj94EsEuOR1dNdmmzFpW8qRgUiJz";
    }
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_aGFuZHkta2luZ2Zpc2gtNjU1Ni5jbGVyay5hY2NvdW50cy5kZXYk";
    }

    const clerkAuth = await auth();
    if (clerkAuth?.userId) {
      const clerkId = clerkAuth.userId;

      // 2a. Cari akun Admin yang sudah tertaut
      const admin = await prisma.admin.findFirst({ where: { clerkId } });
      if (admin) {
        return { id: admin.id, role: "admin", username: admin.username };
      }

      // 2b. Cari akun Guru yang sudah tertaut
      const teacher = await prisma.teacher.findFirst({ where: { clerkId } });
      if (teacher) {
        return {
          id: teacher.id,
          role: "teacher",
          username: teacher.username,
          classGroup: teacher.classGroup,
        };
      }

      // 2c. Cari akun Siswa yang sudah tertaut
      const student = await prisma.student.findFirst({ where: { clerkId } });
      if (student) {
        return {
          id: student.id,
          role: "student",
          username: student.username,
          classGroup: student.classGroup,
        };
      }

      // 2d. Skenario B: Pencocokan otomatis via Email jika sudah diisi oleh Admin
      const clerkUser = await currentUser();
      const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

      if (primaryEmail) {
        // Cek apakah email terdaftar di Admin
        const adminByEmail = await prisma.admin.findFirst({
          where: { email: { equals: primaryEmail, mode: "insensitive" } },
        });
        if (adminByEmail) {
          await prisma.admin.update({
            where: { id: adminByEmail.id },
            data: { clerkId },
          });
          return { id: adminByEmail.id, role: "admin", username: adminByEmail.username };
        }

        // Cek apakah email terdaftar di Guru
        const teacherByEmail = await prisma.teacher.findFirst({
          where: { email: { equals: primaryEmail, mode: "insensitive" } },
        });
        if (teacherByEmail) {
          await prisma.teacher.update({
            where: { id: teacherByEmail.id },
            data: { clerkId },
          });
          return {
            id: teacherByEmail.id,
            role: "teacher",
            username: teacherByEmail.username,
            classGroup: teacherByEmail.classGroup,
          };
        }

        // Cek apakah email terdaftar di Siswa
        const studentByEmail = await prisma.student.findFirst({
          where: { email: { equals: primaryEmail, mode: "insensitive" } },
        });
        if (studentByEmail) {
          await prisma.student.update({
            where: { id: studentByEmail.id },
            data: { clerkId },
          });
          return {
            id: studentByEmail.id,
            role: "student",
            username: studentByEmail.username,
            classGroup: studentByEmail.classGroup,
          };
        }
      }
    }
  } catch (error) {
    // Jika Clerk tidak aktif atau terjadi error, kembalikan null dengan aman
  }

  return null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24,
};
