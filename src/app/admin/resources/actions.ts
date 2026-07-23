"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createResource(data: {
  title: string;
  type: string;
  description: string;
  driveUrl: string;
  durationMins: number;
  questions?: any[];
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return { success: false, message: "Unauthorized" };

    // Get max orderIndex
    const lastResource = await prisma.courseResource.findFirst({
      orderBy: { orderIndex: 'desc' }
    });
    const nextOrder = lastResource ? lastResource.orderIndex + 1 : 0;

    await prisma.courseResource.create({
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        driveUrl: data.driveUrl,
        durationMins: data.durationMins,
        orderIndex: nextOrder,
        questions: data.questions ? {
          create: data.questions
        } : undefined
      }
    });

    revalidatePath("/admin/resources");
    revalidatePath("/student/course");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal membuat materi" };
  }
}

export async function updateResource(id: string, data: {
  title: string;
  type: string;
  description: string;
  driveUrl: string;
  durationMins: number;
  questions?: any[];
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return { success: false, message: "Unauthorized" };

    if (data.type === 'Quiz' && data.questions) {
      // Delete existing questions and recreate
      await prisma.question.deleteMany({ where: { resourceId: id } });
    }

    await prisma.courseResource.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        driveUrl: data.driveUrl,
        durationMins: data.durationMins,
        questions: data.questions ? {
          create: data.questions
        } : undefined
      }
    });

    revalidatePath("/admin/resources");
    revalidatePath("/student/course");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal memperbarui materi" };
  }
}

export async function deleteResource(id: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return { success: false, message: "Unauthorized" };

    await prisma.courseResource.delete({
      where: { id }
    });

    revalidatePath("/admin/resources");
    revalidatePath("/student/course");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal menghapus materi" };
  }
}
