"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function recordAttendanceByTeacher(studentCode: string) {
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
      where: { studentCode },
      select: {
        id: true,
        name: true,
        studentCode: true,
        gender: true,
        classGroup: true
      }
    });

    if (!student) {
      return { success: false, message: "Siswa tidak ditemukan dalam database." };
    }

    // Validasi kelas: Guru hanya boleh absen siswa di kelasnya
    if (student.classGroup !== teacher.classGroup) {
      return {
        success: false,
        message: `Akses ditolak: ${student.name} adalah siswa Kelas 6${student.classGroup || "A"}, bukan Kelas 6${teacher.classGroup || "A"}.`
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        timestamp: {
          gte: today,
        }
      }
    });

    if (existingAttendance) {
      return { 
        success: false, 
        message: "Sudah diabsen", 
        student,
        timestamp: existingAttendance.timestamp
      };
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        status: "Hadir"
      }
    });

    revalidatePath("/teacher");
    revalidatePath("/teacher/scanner");

    return { 
      success: true, 
      student,
      timestamp: newAttendance.timestamp
    };
  } catch (error) {
    console.error("Teacher Record Attendance Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat scan absensi." };
  }
}
