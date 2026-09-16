import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/security";

const AVAILABLE_TITLES = new Set([
  "Sang Jagoan",
  "Sang Ahli Coding",
  "Sang Ahli Prompt",
  "Kompetitor Handal",
  "Si Paling Rajin",
  "Raja Kuis",
  "Bintang Kelas",
  "Pahlawan Belajar",
  "Penguasa Materi",
  "Master Logika",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Permintaan tidak diizinkan" }, { status: 403 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 128 * 1024) {
      return NextResponse.json({ error: "Permintaan terlalu besar" }, { status: 413 });
    }

    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await params;
    if (!["title", "equip", "avatar-pass", "save-avatar"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch latest student data to get points
    const student = await prisma.student.findUnique({
      where: { id: session.id },
      include: {
        attendances: true,
        studentProgress: true,
        quizAttempts: true,
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const attendancePoints = student.attendances.length * 2;
    const progressPoints = student.studentProgress.length * 5;
    const passedQuizzes = student.quizAttempts.filter((q) => q.passed).length;
    const quizPoints = passedQuizzes * 10;
    const totalScore = attendancePoints + progressPoints + quizPoints;
    const currentPoints = totalScore - student.spentPoints;

    if (action === "title") {
      const body = await request.json();
      const { title } = body;

      if (typeof title !== "string" || !AVAILABLE_TITLES.has(title)) {
        return NextResponse.json({ error: "Titel tidak valid" }, { status: 400 });
      }
      if (student.unlockedTitles.includes(title)) {
        return NextResponse.json({ error: "Titel sudah dimiliki" }, { status: 400 });
      }
      if (currentPoints < 5) {
        return NextResponse.json({ error: "Poin tidak cukup" }, { status: 400 });
      }

      await prisma.student.update({
        where: { id: student.id },
        data: {
          spentPoints: student.spentPoints + 5,
          unlockedTitles: { push: title }
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "equip") {
      const body = await request.json();
      const { title } = body;

      if (typeof title !== "string" || !AVAILABLE_TITLES.has(title) || !student.unlockedTitles.includes(title)) {
        return NextResponse.json({ error: "Titel tidak dimiliki" }, { status: 400 });
      }

      await prisma.student.update({
        where: { id: student.id },
        data: { activeTitle: title }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "avatar-pass") {
      if (student.avatarUnlocked) {
        return NextResponse.json({ error: "Sudah memiliki Avatar Pass" }, { status: 400 });
      }
      if (currentPoints < 10) {
        return NextResponse.json({ error: "Poin tidak cukup" }, { status: 400 });
      }

      await prisma.student.update({
        where: { id: student.id },
        data: {
          spentPoints: student.spentPoints + 10,
          avatarUnlocked: true
        }
      });

      return NextResponse.json({ success: true });
    }
    
    if (action === "save-avatar") {
      const body = await request.json();
      const { avatarUrl } = body; // We store the finalized SVG data URI here
      
      if (!student.avatarUnlocked) {
         return NextResponse.json({ error: "Avatar Pass belum terbuka" }, { status: 400 });
      }

      let avatarUrlObject: URL;
      if (typeof avatarUrl !== "string" || avatarUrl.length > 1000) {
        return NextResponse.json({ error: "Avatar tidak valid" }, { status: 400 });
      }
      try {
        avatarUrlObject = new URL(avatarUrl);
      } catch {
        return NextResponse.json({ error: "Avatar tidak valid" }, { status: 400 });
      }
      if (
        avatarUrlObject.protocol !== "https:" ||
        avatarUrlObject.hostname !== "api.dicebear.com" ||
        !avatarUrlObject.pathname.startsWith("/7.x/avataaars/svg")
      ) {
        return NextResponse.json({ error: "Sumber avatar tidak diizinkan" }, { status: 400 });
      }

      await prisma.student.update({
        where: { id: student.id },
        data: {
          avatarConfig: avatarUrlObject.toString()
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Shop API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
