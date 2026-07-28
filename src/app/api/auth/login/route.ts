import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, encrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Cek di tabel Admin
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (admin) {
      const isValid = await verifyPassword(password, admin.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password salah" }, { status: 401 });
      }

      const session = await encrypt({ id: admin.id, role: "admin", username: admin.username });
      const res = NextResponse.json({ success: true, role: "admin" });
      res.cookies.set({
        name: "session",
        value: session,
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return res;
    }

    // Cek di tabel Teacher jika bukan admin
    const teacher = await prisma.teacher.findUnique({
      where: { username },
    });

    if (teacher) {
      const isValid = await verifyPassword(password, teacher.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password salah" }, { status: 401 });
      }

      const session = await encrypt({ id: teacher.id, role: "teacher", username: teacher.username, classGroup: teacher.classGroup });
      const res = NextResponse.json({ success: true, role: "teacher", classGroup: teacher.classGroup });
      res.cookies.set({
        name: "session",
        value: session,
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return res;
    }

    // Cek di tabel Student jika bukan admin maupun teacher
    const student = await prisma.student.findUnique({
      where: { username },
    });

    if (student) {
      const isValid = await verifyPassword(password, student.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password salah" }, { status: 401 });
      }

      const session = await encrypt({ id: student.id, role: "student", username: student.username, classGroup: student.classGroup });
      const res = NextResponse.json({ success: true, role: "student", classGroup: student.classGroup });
      res.cookies.set({
        name: "session",
        value: session,
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return res;
    }

    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
