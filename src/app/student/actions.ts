"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export async function updateStudentPassword(newPassword: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return { success: false, message: "Unauthorized" };
    }

    if (newPassword.length < 4) {
      return { success: false, message: "Password minimal 4 karakter." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: session.id },
      data: { password: hashedPassword }
    });

    return { success: true, message: "Password berhasil diperbarui!" };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}
