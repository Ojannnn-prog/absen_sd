import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        attendances: true,
        studentProgress: true,
        quizAttempts: true,
      }
    });

    // Calculate score for each student
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
        profileImage: student.profileImage, // We still return this for the Leaderboard UI
        activeTitle: student.activeTitle,
        avatarConfig: student.avatarConfig,
        totalScore,
        currentBalance,
      };
    });

    // Sort by totalScore descending
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data leaderboard" }, { status: 500 });
  }
}
