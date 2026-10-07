"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function enrollStudentFace(
  studentId: string,
  descriptor: number[],
  photoBase64: string
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "teacher")) {
      return { success: false, message: "Akses ditolak: Hanya Admin atau Guru yang dapat mendaftarkan wajah." };
    }

    if (!studentId || !descriptor || descriptor.length !== 128) {
      return { success: false, message: "Data vektor wajah tidak valid (harus 128 dimensi)." };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, classGroup: true }
    });

    if (!student) {
      return { success: false, message: "Siswa tidak ditemukan." };
    }

    // Jika guru, pastikan siswa berada di kelas yang sama (default "A")
    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
        select: { classGroup: true }
      });
      const tClass = teacher?.classGroup || "A";
      const sClass = student.classGroup || "A";
      if (!teacher || sClass !== tClass) {
        return { success: false, message: "Akses ditolak: Anda hanya dapat mendaftarkan wajah siswa kelas Anda." };
      }
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        faceDescriptor: descriptor,
        facePhoto: photoBase64,
        faceEnrolledAt: new Date(),
      }
    });

    revalidatePath("/admin/student");
    revalidatePath("/teacher/student");
    revalidatePath("/admin/scanner");
    revalidatePath("/teacher/scanner");

    return { 
      success: true, 
      message: `Wajah ${student.name} berhasil didaftarkan!` 
    };
  } catch (error: any) {
    console.error("Enroll Face Error:", error);
    return { success: false, message: "Gagal menyimpan data wajah siswa." };
  }
}

export async function deleteStudentFace(studentId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "teacher")) {
      return { success: false, message: "Akses ditolak." };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, classGroup: true }
    });

    if (!student) {
      return { success: false, message: "Siswa tidak ditemukan." };
    }

    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
        select: { classGroup: true }
      });
      const tClass = teacher?.classGroup || "A";
      const sClass = student.classGroup || "A";
      if (!teacher || sClass !== tClass) {
        return { success: false, message: "Akses ditolak: Siswa bukan anggota kelas Anda." };
      }
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        faceDescriptor: null,
        facePhoto: null,
        faceEnrolledAt: null,
      }
    });

    revalidatePath("/admin/student");
    revalidatePath("/teacher/student");
    revalidatePath("/admin/scanner");
    revalidatePath("/teacher/scanner");

    return { 
      success: true, 
      message: `Data wajah ${student.name} berhasil dihapus.` 
    };
  } catch (error: any) {
    console.error("Delete Face Error:", error);
    return { success: false, message: "Gagal menghapus data wajah." };
  }
}

export async function getClassFaceDescriptors(classGroup?: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "teacher")) {
      return { success: false, message: "Akses ditolak.", students: [] };
    }

    let targetClass = classGroup;

    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
        select: { classGroup: true }
      });
      if (!teacher) {
        return { success: false, message: "Data guru tidak valid.", students: [] };
      }
      targetClass = teacher.classGroup || "A";
    }

    const whereClause: any = {
      faceDescriptor: { not: null }
    };

    if (targetClass && targetClass !== "ALL") {
      if (targetClass === "A") {
        whereClause.OR = [
          { classGroup: "A" },
          { classGroup: null }
        ];
      } else {
        whereClause.classGroup = targetClass;
      }
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        studentCode: true,
        gender: true,
        classGroup: true,
        faceDescriptor: true,
        facePhoto: true,
        faceEnrolledAt: true,
      },
      orderBy: { name: "asc" }
    });

    return { 
      success: true, 
      students: students.map(s => ({
        ...s,
        classGroup: s.classGroup || "A",
        faceEnrolledAt: s.faceEnrolledAt ? s.faceEnrolledAt.toISOString() : null
      }))
    };
  } catch (error: any) {
    console.error("Get Face Descriptors Error:", error);
    return { success: false, message: "Gagal memuat data wajah siswa.", students: [] };
  }
}

export async function recordAttendanceByFace(studentId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "teacher")) {
      return { success: false, message: "Akses ditolak: Tidak memiliki otorisasi." };
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        studentCode: true,
        gender: true,
        classGroup: true
      }
    });

    if (!student) {
      return { success: false, message: "Siswa tidak ditemukan." };
    }

    // Isolasi kelas guru
    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
        select: { classGroup: true }
      });
      const tClass = teacher?.classGroup || "A";
      const sClass = student.classGroup || "A";
      if (!teacher || sClass !== tClass) {
        return {
          success: false,
          message: `Akses ditolak: ${student.name} adalah siswa Kelas 6${sClass}, bukan Kelas 6${tClass}.`
        };
      }
    }

    // Cek absensi hari ini (00:00 WIB)
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

    if (session.role === "admin") {
      revalidatePath("/admin");
      revalidatePath("/admin/scanner");
    } else {
      revalidatePath("/teacher");
      revalidatePath("/teacher/scanner");
    }

    return {
      success: true,
      student,
      timestamp: newAttendance.timestamp
    };
  } catch (error: any) {
    console.error("Record Attendance By Face Error:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat memproses absensi wajah." };
  }
}
