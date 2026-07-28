import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const queryClassGroup = searchParams.get("classGroup");

    const whereClause: any = {};
    let classGroupLabel = "ALL";

    if (session?.role === "student") {
      const student = await prisma.student.findUnique({
        where: { id: session.id },
        select: { classGroup: true }
      });
      whereClause.classGroup = student?.classGroup || "A";
      classGroupLabel = student?.classGroup || "A";
    } else if (session?.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
        select: { classGroup: true }
      });
      whereClause.classGroup = teacher?.classGroup || "A";
      classGroupLabel = teacher?.classGroup || "A";
    } else if (queryClassGroup && queryClassGroup !== "ALL") {
      whereClause.classGroup = queryClassGroup;
      classGroupLabel = queryClassGroup;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        attendances: true,
        studentProgress: true,
        quizAttempts: true,
      }
    });

    const leaderboard = students.map((student) => {
      const attendancePoints = student.attendances.length * 2;
      const progressPoints = student.studentProgress.length * 5;
      const passedQuizzes = student.quizAttempts.filter((q) => q.passed).length;
      const quizPoints = passedQuizzes * 10;
      
      const totalScore = attendancePoints + progressPoints + quizPoints;
      const currentBalance = totalScore - student.spentPoints;

      return {
        id: student.id,
        name: student.name,
        gender: student.gender,
        classGroup: student.classGroup,
        profileImage: student.profileImage,
        activeTitle: student.activeTitle,
        avatarConfig: student.avatarConfig,
        totalScore,
        currentBalance,
      };
    });

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      leaderboard,
      classGroup: classGroupLabel
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data leaderboard" }, { status: 500 });
  }
}
