"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateStudent(id: string, data: {
  name: string;
  password?: string;
  gender: string;
  birthPlace: string;
  birthDate: Date | null;
  classGroup?: string;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return { success: false, message: "Unauthorized" };

    const updateData: any = {
      name: data.name,
      gender: data.gender,
      birthPlace: data.birthPlace,
      birthDate: data.birthDate
    };

    if (data.classGroup) {
      updateData.classGroup = data.classGroup;
    }

    if (data.password) {
      updateData.password = data.password;
    }

    await prisma.student.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/admin/student");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal memperbarui data siswa" };
  }
}

export async function deleteStudent(id: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return { success: false, message: "Unauthorized" };

    await prisma.student.delete({
      where: { id }
    });

    revalidatePath("/admin/student");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: "Gagal menghapus siswa" };
  }
}
