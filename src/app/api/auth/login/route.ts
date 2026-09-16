import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";
import {
  getClientAddress,
  getLoginThrottleStatus,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/rate-limit";

const INVALID_CREDENTIALS_MESSAGE = "Username atau password salah";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Permintaan tidak diizinkan" }, { status: 403 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return NextResponse.json({ error: "Permintaan terlalu besar" }, { status: 413 });
  }

  const loginKey = `login:${getClientAddress(req)}`;
  const throttle = getLoginThrottleStatus(loginKey);
  if (!throttle.allowed) {
    const response = NextResponse.json(
      {
        error: "Login ditahan sementara. Silakan tunggu sebelum mencoba lagi.",
        cooldownSeconds: throttle.retryAfter,
        attemptsRemaining: throttle.attemptsRemaining,
      },
      { status: 429 }
    );
    response.headers.set("Retry-After", String(throttle.retryAfter));
    return response;
  }

  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data login tidak valid" }, { status: 400 });
    }

    const { username, password } = body as { username?: unknown; password?: unknown };
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.trim().length < 1 ||
      username.trim().length > 100 ||
      password.length < 1 ||
      password.length > 128
    ) {
      return NextResponse.json({ error: "Data login tidak valid" }, { status: 400 });
    }

    const normalizedUsername = username.trim();

    // Cek di tabel Admin
    const admin = await prisma.admin.findUnique({
      where: { username: normalizedUsername },
    });

    if (admin) {
      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        const failure = recordLoginFailure(loginKey);
        return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE, ...failure }, { status: 401 });
      }

      recordLoginSuccess(loginKey);
      const session = await encrypt({ id: admin.id, role: "admin", username: admin.username });
      const res = NextResponse.json({ success: true, role: "admin" });
      res.cookies.set({
        name: "session",
        value: session,
        ...sessionCookieOptions,
      });
      return res;
    }

    // Cek di tabel Teacher jika bukan admin
    const teacher = await prisma.teacher.findUnique({
      where: { username: normalizedUsername },
    });

    if (teacher) {
      const isValid = await verifyPassword(password, teacher.password);
      if (!isValid) {
        const failure = recordLoginFailure(loginKey);
        return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE, ...failure }, { status: 401 });
      }

      recordLoginSuccess(loginKey);
      const session = await encrypt({ id: teacher.id, role: "teacher", username: teacher.username, classGroup: teacher.classGroup });
      const res = NextResponse.json({ success: true, role: "teacher", classGroup: teacher.classGroup });
      res.cookies.set({
        name: "session",
        value: session,
        ...sessionCookieOptions,
      });
      return res;
    }

    // Cek di tabel Student jika bukan admin maupun teacher
    const student = await prisma.student.findUnique({
      where: { username: normalizedUsername },
    });

    if (student) {
      const isValid = await verifyPassword(password, student.password);
      if (!isValid) {
        const failure = recordLoginFailure(loginKey);
        return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE, ...failure }, { status: 401 });
      }

      recordLoginSuccess(loginKey);
      const session = await encrypt({ id: student.id, role: "student", username: student.username, classGroup: student.classGroup });
      const res = NextResponse.json({ success: true, role: "student", classGroup: student.classGroup });
      res.cookies.set({
        name: "session",
        value: session,
        ...sessionCookieOptions,
      });
      return res;
    }

    const failure = recordLoginFailure(loginKey);
    return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE, ...failure }, { status: 401 });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat login" }, { status: 500 });
  }
}
