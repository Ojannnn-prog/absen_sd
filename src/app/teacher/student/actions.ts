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

export async function importTeacherStudentsBulk(studentsData: any[], classGroup: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return { success: false, message: "Unauthorized" };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id }
    });

    if (!teacher || teacher.classGroup !== classGroup) {
      return { success: false, message: "Akses ditolak: Anda hanya dapat mengimpor siswa ke kelas Anda sendiri" };
    }

    if (!studentsData || studentsData.length === 0) {
      return { success: false, message: "Data siswa kosong" };
    }

    const defaultPassword = "231Sukaasih";
    const hashedPassword = await hashPassword(defaultPassword);

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
    
    const newStudents = studentsData.map((student, index) => {
      const sequence = String(nextSequence + index).padStart(3, "0");
      const studentCode = `2312026${sequence}`;
      
      let birthDate = null;
      if (student.birthDate) {
        const parsed = new Date(student.birthDate);
        if (!isNaN(parsed.getTime())) {
          birthDate = parsed;
        }
      }

      return {
        name: student.name || "Tanpa Nama",
        gender: student.gender === "P" || student.gender === "Perempuan" ? "P" : "L",
        birthPlace: student.birthPlace || null,
        birthDate: birthDate,
        studentCode: studentCode,
        username: studentCode,
        classGroup: teacher.classGroup || "A", // Paksa ke kelas guru
        password: hashedPassword,
      };
    });

    const result = await prisma.student.createMany({
      data: newStudents,
      skipDuplicates: true
    });

    revalidatePath("/teacher/student");
    revalidatePath("/teacher");
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error("Teacher Bulk Import Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat menyimpan data." };
  }
}

export async function recordManualAttendanceByTeacher(studentId: string, status: "Hadir" | "Izin" | "Alpha") {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return { success: false, message: "Unauthorized: Anda bukan Guru." };
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id }
    });
    if (!teacher) {
      return { success: false, message: "Guru tidak ditemukan." };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    if (!student || student.classGroup !== teacher.classGroup) {
      return { success: false, message: "Akses ditolak: Siswa bukan dari kelas Anda." };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        timestamp: {
          gte: today,
        },
      },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { status },
      });
    } else {
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          status,
        },
      });
    }

    revalidatePath("/teacher");
    revalidatePath("/teacher/student");
    revalidatePath("/student");
    return { success: true };
  } catch (error: any) {
    console.error("recordManualAttendanceByTeacher error:", error);
    return { success: false, message: "Gagal mencatat absensi manual." };
  }
}
