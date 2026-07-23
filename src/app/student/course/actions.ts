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
