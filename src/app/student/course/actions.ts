"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAsCompleted(resourceId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") return { success: false, message: "Unauthorized" };

    // Check if already completed
    const existing = await prisma.studentProgress.findUnique({
      where: {
        studentId_resourceId: {
          studentId: session.id,
          resourceId
        }
      }
    });

    if (!existing) {
      await prisma.studentProgress.create({
        data: {
          studentId: session.id,
          resourceId
        }
      });
    }

    revalidatePath("/student/course");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal menyimpan progres" };
  }
}

export async function submitQuiz(resourceId: string, answers: Record<string, string>) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") return { success: false, message: "Unauthorized" };

    const resource = await prisma.courseResource.findUnique({
      where: { id: resourceId },
      include: { questions: true }
    });

    if (!resource || resource.type !== "Quiz") {
      return { success: false, message: "Quiz tidak ditemukan" };
    }

    let correctCount = 0;
    const totalQuestions = resource.questions.length;

    if (totalQuestions === 0) {
      return { success: false, message: "Quiz belum memiliki soal" };
    }

    resource.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 60;

    const attempt = await prisma.quizAttempt.create({
      data: {
        studentId: session.id,
        resourceId,
        score,
        passed
      }
    });

    if (passed) {
      // Auto mark as completed
      await markAsCompleted(resourceId);
    }

    revalidatePath("/student/course");
    return { success: true, score, passed, attempt };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal memproses nilai ujian" };
  }
}
