"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function recordAttendance(studentCode: string) {
  try {
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
