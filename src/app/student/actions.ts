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

export async function updateProfile(nickname: string | null, profileImage: string | null) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") return { success: false, message: "Unauthorized" };

    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    await prisma.student.update({
      where: { id: session.id },
      data: updateData
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: "Terjadi kesalahan" };
  }
}

export async function buyTheme(themeId: string, price: number) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") return { success: false, message: "Unauthorized" };

    const student = await prisma.student.findUnique({
      where: { id: session.id },
      include: { attendances: true }
    });

    if (!student) return { success: false, message: "User not found" };

    const totalPoints = (student.attendances.length * 10) - student.spentPoints;

    if (totalPoints < price) {
      return { success: false, message: "Poin tidak cukup!" };
    }

    if (student.unlockedThemes.includes(themeId)) {
      return { success: false, message: "Tema sudah dibeli" };
    }

    await prisma.student.update({
      where: { id: session.id },
      data: {
        spentPoints: { increment: price },
        unlockedThemes: { push: themeId },
        activeTheme: themeId // Langsung pakai setelah dibeli
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error buying theme:", error);
    return { success: false, message: "Gagal membeli tema" };
  }
}

export async function equipTheme(themeId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") return { success: false, message: "Unauthorized" };

    const student = await prisma.student.findUnique({ where: { id: session.id } });
    
    if (!student?.unlockedThemes.includes(themeId)) {
      return { success: false, message: "Anda belum memiliki tema ini" };
    }

    await prisma.student.update({
      where: { id: session.id },
      data: { activeTheme: themeId }
    });

    return { success: true };
  } catch (error) {
    console.error("Error equip theme:", error);
    return { success: false, message: "Gagal memakai tema" };
  }
}

export async function pingActive() {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") return;

    await prisma.student.update({
      where: { id: session.id },
      data: { lastActive: new Date() }
    });
  } catch (error) {
    // silently fail
  }
}
