"use server";

import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTeacherDashboardData() {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return null;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.id },
    });

    if (!teacher) return null;

    const classGroup = teacher.classGroup || "A";

    // Cari siswa yang hanya berada di kelas Guru ini
    const students = await prisma.student.findMany({
      where: { classGroup },
      include: {
        attendances: {
          orderBy: { timestamp: "desc" }
        },
      },
      orderBy: { name: "asc" }
    });

    // Hitung statistik kelas hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let presentToday = 0;
    let izinToday = 0;
    let absenToday = 0;

    students.forEach((s) => {
      const attToday = s.attendances.find((a) => {
        const d = new Date(a.timestamp);
        return d >= today;
      });

      if (attToday) {
        if (attToday.status === "Hadir") presentToday++;
        else if (attToday.status === "Izin") izinToday++;
        else absenToday++;
      }
    });

    // Pengumuman global
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });

    return {
      teacher,
      students: JSON.parse(JSON.stringify(students)),
      stats: {
        totalStudents: students.length,
        presentToday,
        izinToday,
        absenToday,
      },
      announcements: JSON.parse(JSON.stringify(announcements))
    };
  } catch (error) {
    console.error("Get Teacher Dashboard Data Error:", error);
    return null;
  }
}

export async function updateTeacherProfile(data: {
  name?: string;
  nickname?: string;
  password?: string;
  avatarConfig?: string;
  profileImage?: string;
  activeTheme?: string;
  activeTitle?: string;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return { success: false, message: "Unauthorized" };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.nickname !== undefined) updateData.nickname = data.nickname.trim();
    if (data.avatarConfig !== undefined) updateData.avatarConfig = data.avatarConfig;
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
    if (data.activeTheme !== undefined) updateData.activeTheme = data.activeTheme;
    if (data.activeTitle !== undefined) updateData.activeTitle = data.activeTitle;

    if (data.password && data.password.trim() !== "") {
      updateData.password = await hashPassword(data.password.trim());
    }

    await prisma.teacher.update({
      where: { id: session.id },
      data: updateData
    });

    revalidatePath("/teacher");
    return { success: true };
  } catch (error: any) {
    console.error("Update Teacher Profile Error:", error);
    return { success: false, message: "Gagal memperbarui profil Guru" };
  }
}
