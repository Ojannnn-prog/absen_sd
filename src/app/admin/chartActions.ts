"use server";

import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { id } from "date-fns/locale";

export async function getMonthlyAttendanceData() {
  try {
    const today = new Date();
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);

    // Ambil semua absensi di bulan ini
    const attendances = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: firstDay,
          lte: lastDay,
        }
      },
      select: {
        timestamp: true
      }
    });

    // Buat deretan tanggal dari awal bulan hingga hari ini (atau akhir bulan)
    // Agar grafik terlihat penuh satu bulan penuh:
    const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Inisialisasi map dengan count 0 untuk setiap hari
    const attendanceMap = new Map<string, number>();
    daysInMonth.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      attendanceMap.set(dateKey, 0);
    });

    // Hitung jumlah absensi per hari
    attendances.forEach(att => {
      const dateKey = format(att.timestamp, 'yyyy-MM-dd');
      if (attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, attendanceMap.get(dateKey)! + 1);
      }
    });

    // Format menjadi array untuk Recharts
    const chartData = daysInMonth.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd MMM', { locale: id }),
        fullDate: format(day, 'EEEE, dd MMMM yyyy', { locale: id }),
        hadir: attendanceMap.get(dateKey) || 0
      };
    });

    return chartData;

  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    return [];
  }
}
