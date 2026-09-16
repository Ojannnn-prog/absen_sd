"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/security";

export async function recordAttendance(studentCode: string) {
  try {
    await requireRole("admin");
    if (!/^2312026\d{3}$/.test(studentCode)) {
      return { success: false, message: "Kode siswa tidak valid." };
    }
    // Cari siswa berdasarkan studentCode
    const student = await prisma.student.findUnique({
      where: { studentCode },
      select: {
        id: true,
        name: true,
        studentCode: true,
        gender: true
      }
    });

    if (!student) {
      return { success: false, message: "Siswa tidak ditemukan dalam database." };
    }

    // Cek apakah sudah absen hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        timestamp: {
          gte: today, // Lebih besar atau sama dengan awal hari ini
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

    // Rekam kehadiran baru (Hadir)
    const newAttendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        status: "Hadir"
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/scanner");

    return { 
      success: true, 
      student,
      timestamp: newAttendance.timestamp
    };

  } catch (error: any) {
    console.error("Attendance Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat memproses absen." };
  }
}
