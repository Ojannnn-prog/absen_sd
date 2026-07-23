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
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return { success: false, message: "Unauthorized" };

    // Get max orderIndex
    const lastResource = await prisma.courseResource.findFirst({
      orderBy: { orderIndex: 'desc' }
    });
    const nextOrder = lastResource ? lastResource.orderIndex + 1 : 1;

    await prisma.courseResource.create({
      data: {
        ...data,
        orderIndex: nextOrder
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
