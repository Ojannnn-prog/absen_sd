"use server";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createStudent(formData: FormData) {
  const name = formData.get("name") as string;
  const gender = formData.get("gender") as string;
  const birthPlace = formData.get("birthPlace") as string;
  const birthDateStr = formData.get("birthDate") as string;
  
  if (!name || !gender) {
    throw new Error("Nama dan jenis kelamin wajib diisi");
  }

  // Parse tanggal lahir
  let birthDate = null;
  if (birthDateStr) {
    birthDate = new Date(birthDateStr);
  }

  // Generate sequence number
  const count = await prisma.student.count();
  const sequence = String(count + 1).padStart(3, "0");
  const studentCode = `2312026${sequence}`;

  // Generate username and password
  const username = studentCode; // Bisa disesuaikan
  // Password acak 8 karakter
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
      password: hashedPassword,
    }
  });

  revalidatePath("/admin");
  
  return { 
    success: true, 
    studentCode, 
    username, 
    password: randomPass // Kembalikan password asli sekali saja untuk dicatat admin
  };
}

export async function importStudentsBulk(studentsData: any[]) {
  if (!studentsData || studentsData.length === 0) {
    throw new Error("Data siswa kosong");
  }

  // Hash password sementara sekali (karena semuanya sama)
  const defaultPassword = "231Sukaasih";
  const hashedPassword = await hashPassword(defaultPassword);

  // Ambil jumlah siswa saat ini untuk men-generate kode urut
  const count = await prisma.student.count();
  
  const newStudents = studentsData.map((student, index) => {
    const sequence = String(count + index + 1).padStart(3, "0");
    const studentCode = `2312026${sequence}`;
    
    // Parse tanggal jika ada
    let birthDate = null;
    if (student.birthDate) {
      // Excel might return date as string or JS Date object
      birthDate = new Date(student.birthDate);
    }

    return {
      name: student.name || "Tanpa Nama",
      gender: student.gender === "P" || student.gender === "Perempuan" ? "P" : "L",
      birthPlace: student.birthPlace || null,
      birthDate: birthDate,
      studentCode: studentCode,
      username: studentCode,
      password: hashedPassword,
    };
  });

  // Gunakan transaction untuk memastikan semua masuk atau gagal semua
  await prisma.$transaction(
    newStudents.map((data) => prisma.student.create({ data }))
  );

  revalidatePath("/admin");
  return { success: true, count: newStudents.length };
}

export async function updateStudent(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const gender = formData.get("gender") as string;
  const birthPlace = formData.get("birthPlace") as string;
  const birthDateStr = formData.get("birthDate") as string;
  const newPassword = formData.get("newPassword") as string;

  let birthDate = null;
  if (birthDateStr) {
    birthDate = new Date(birthDateStr);
  }

  const updateData: any = {
    name,
    gender,
    birthPlace,
    birthDate,
  };

  if (newPassword && newPassword.trim() !== "") {
    updateData.password = await hashPassword(newPassword.trim());
  }

  await prisma.student.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteStudent(id: string) {
  try {
    // Delete all attendance records associated with the student first
    await prisma.attendance.deleteMany({
      where: { studentId: id }
    });
    
    // Delete the student
    await prisma.student.delete({
      where: { id }
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menghapus siswa: " + error.message);
  }
}

export async function updateAdmin(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const newPassword = formData.get("newPassword") as string;

  const updateData: any = {};
  if (name && name.trim() !== "") {
    updateData.name = name.trim();
  }

  if (newPassword && newPassword.trim() !== "") {
    updateData.password = await hashPassword(newPassword.trim());
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.admin.update({
      where: { id },
      data: updateData,
    });
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function createAnnouncement(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content || content === "<p><br></p>") {
    throw new Error("Judul dan isi pengumuman tidak boleh kosong");
  }

  await prisma.announcement.create({
    data: {
      title,
      content,
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({
    where: { id }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
