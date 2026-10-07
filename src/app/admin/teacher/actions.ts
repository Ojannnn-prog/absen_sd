"use server";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/security";
import { randomBytes } from "node:crypto";

export async function createTeacher(formData: FormData) {
  await requireRole("admin");
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const nip = formData.get("nip") as string;
  const classGroup = formData.get("classGroup") as string || "A";
  const passwordInput = formData.get("password") as string;
  const emailInput = formData.get("email") as string;
  const email = emailInput && emailInput.trim() !== "" ? emailInput.trim().toLowerCase() : null;

  if (!name || !username) {
    return { success: false, message: "Nama dan username wajib diisi" };
  }

  try {
    const existing = await prisma.teacher.findUnique({
      where: { username },
    });
    if (existing) {
      return { success: false, message: "Username sudah digunakan oleh guru lain." };
    }

    const plainPassword = passwordInput && passwordInput.trim() !== "" 
      ? passwordInput.trim() 
      : randomBytes(6).toString("base64url").slice(0, 8);
    const hashedPassword = await hashPassword(plainPassword);

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        nip: nip && nip.trim() !== "" ? nip.trim() : null,
        classGroup,
        password: hashedPassword,
        email,
        avatarUnlocked: true, // Default premium avatar untuk Guru
      },
      select: {
        id: true,
        name: true,
        username: true,
        nip: true,
        classGroup: true,
        profileImage: true,
        avatarConfig: true,
        email: true,
        clerkId: true,
      },
    });

    revalidatePath("/admin/teacher");
    revalidatePath("/admin");

    return {
      success: true,
      teacher,
      password: plainPassword,
    };
  } catch (error: any) {
    console.error("Create Teacher Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat membuat data guru." };
  }
}

export async function updateTeacher(id: string, formData: FormData) {
  await requireRole("admin");
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const nip = formData.get("nip") as string;
  const classGroup = formData.get("classGroup") as string;
  const newPassword = formData.get("newPassword") as string;
  const emailInput = formData.get("email");

  const updateData: any = {};

  if (name && name.trim() !== "") updateData.name = name.trim();
  if (username && username.trim() !== "") updateData.username = username.trim();
  updateData.nip = nip && nip.trim() !== "" ? nip.trim() : null;
  if (classGroup) updateData.classGroup = classGroup;

  if (emailInput !== null) {
    const emailStr = (emailInput as string).trim().toLowerCase();
    updateData.email = emailStr !== "" ? emailStr : null;
  }

  if (newPassword && newPassword.trim() !== "") {
    updateData.password = await hashPassword(newPassword.trim());
  }

  try {
    await prisma.teacher.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/teacher");
    return { success: true };
  } catch (error: any) {
    console.error("Update Teacher Error:", error);
    return { success: false, message: "Gagal memperbarui data guru." };
  }
}

export async function deleteTeacher(id: string) {
  await requireRole("admin");
  try {
    await prisma.teacher.delete({
      where: { id },
    });

    revalidatePath("/admin/teacher");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menghapus guru: " + error.message);
  }
}
