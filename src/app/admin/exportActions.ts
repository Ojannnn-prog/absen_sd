"use server";

import prisma from "@/lib/prisma";

export async function getExportData() {
  try {
    const students = await prisma.student.findMany({
      include: {
        attendances: true
      },
      orderBy: { name: "asc" }
    });

    const exportData = students.map((s, index) => {
      let hadir = 0;
      let izin = 0;
      let absen = 0; // Alpha / tidak ada keterangan

      s.attendances.forEach(att => {
        if (att.status === "Hadir") hadir++;
        else if (att.status === "Izin") izin++;
        else absen++;
      });

      return {
        No: index + 1,
        "Nama Siswa": s.name,
        "L/P": s.gender,
        "Nomor Induk": s.studentCode,
        "Tempat Lahir": s.birthPlace || "-",
        "Tanggal Lahir": s.birthDate ? s.birthDate.toLocaleDateString("id-ID") : "-",
        "Hadir": hadir,
        "Izin": izin,
        "Absen/Alpha": absen,
        "Total Catatan": s.attendances.length
      };
    });

    return exportData;
  } catch (error) {
    console.error("Export data error:", error);
    return [];
  }
}
