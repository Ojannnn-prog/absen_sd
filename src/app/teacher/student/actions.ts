"use server";

import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createStudentByTeacher(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return { success: false, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id }
    });
    if (!teacher) {
      return { success: false, message: "Guru tidak ditemukan" };
    }

    const name = formData.get("name") as string;
    const gender = formData.get("gender") as string;
    const birthPlace = formData.get("birthPlace") as string;
    const birthDateStr = formData.get("birthDate") as string;
    const classGroup = teacher.classGroup || "A";

    if (!name || !gender) {
      return { success: false, message: "Nama dan jenis kelamin wajib diisi" };
    }

    let birthDate = null;
    if (birthDateStr) {
      const parsed = new Date(birthDateStr);
      if (!isNaN(parsed.getTime())) {
        birthDate = parsed;
      }
    }

    // Generate sequence number based on highest existing studentCode
    const lastStudent = await prisma.student.findFirst({
      orderBy: { studentCode: 'desc' }
    });

    let nextSequence = 1;
    if (lastStudent && lastStudent.studentCode.startsWith('2312026')) {
      const lastSeqStr = lastStudent.studentCode.slice(7);
      const lastSeqNum = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeqNum)) {
        nextSequence = lastSeqNum + 1;
      }
    }

    const sequence = String(nextSequence).padStart(3, "0");
    const studentCode = `2312026${sequence}`;
    const username = studentCode;
    const randomPass = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(randomPass);

    await prisma.student.create({
      data: {
        name,
        gender,
        birthPlace,
        birthDate,
        studentCode,
        username,
        classGroup,
        password: hashedPassword,
      }
    });

    revalidatePath("/teacher/student");

    return {
      success: true,
      studentCode,
      username,
      password: randomPass
    };
  } catch (error: any) {
    console.error("Create Student By Teacher Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat membuat siswa" };
  }
}

export async function updateStudentByTeacher(id: string, data: {
  name: string;
  password?: string;
  gender: string;
  birthPlace: string;
  birthDate: Date | null;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return { success: false, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id }
    });
    if (!teacher) return { success: false, message: "Unauthorized" };

    const student = await prisma.student.findUnique({
      where: { id }
    });
    if (!student || student.classGroup !== teacher.classGroup) {
      return { success: false, message: "Akses ditolak: siswa ini bukan dari kelas Anda" };
    }

    const updateData: any = {
      name: data.name,
      gender: data.gender,
      birthPlace: data.birthPlace,
      birthDate: data.birthDate
    };

    if (data.password && data.password.trim() !== "") {
      updateData.password = await hashPassword(data.password.trim());
    }

    await prisma.student.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/teacher/student");
    return { success: true };
  } catch (error: any) {
    console.error("Update Student By Teacher Error:", error);
    return { success: false, message: "Gagal memperbarui siswa" };
  }
}

export async function deleteStudentByTeacher(id: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return { success: false, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id }
    });
    if (!teacher) return { success: false, message: "Unauthorized" };

    const student = await prisma.student.findUnique({
      where: { id }
    });
    if (!student || student.classGroup !== teacher.classGroup) {
      return { success: false, message: "Akses ditolak: siswa ini bukan dari kelas Anda" };
    }

    await prisma.attendance.deleteMany({
      where: { studentId: id }
    });

    await prisma.student.delete({
      where: { id }
    });

    revalidatePath("/teacher/student");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Student By Teacher Error:", error);
    return { success: false, message: "Gagal menghapus siswa" };
  }
}
