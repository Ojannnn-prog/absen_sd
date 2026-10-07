"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { encrypt, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function checkClerkLinkingStatus() {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return { isSignedIn: false, isLinked: false };
  }

  try {
    const clerkAuth = await auth();
    if (!clerkAuth?.userId) {
      return { isSignedIn: false, isLinked: false };
    }

    const clerkId = clerkAuth.userId;

    // 1. Cek apakah sudah tertaut
    const admin = await prisma.admin.findFirst({ where: { clerkId } });
    if (admin) {
      return { isSignedIn: true, isLinked: true, role: "admin", name: admin.name || admin.username };
    }

    const teacher = await prisma.teacher.findFirst({ where: { clerkId } });
    if (teacher) {
      return { isSignedIn: true, isLinked: true, role: "teacher", name: teacher.name, classGroup: teacher.classGroup };
    }

    const student = await prisma.student.findFirst({ where: { clerkId } });
    if (student) {
      return { isSignedIn: true, isLinked: true, role: "student", name: student.name, classGroup: student.classGroup };
    }

    // 2. Cek auto-link via email (Skenario B)
    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();

    if (primaryEmail) {
      const adminByEmail = await prisma.admin.findFirst({
        where: { email: { equals: primaryEmail, mode: "insensitive" } },
      });
      if (adminByEmail) {
        await prisma.admin.update({ where: { id: adminByEmail.id }, data: { clerkId } });
        return { isSignedIn: true, isLinked: true, role: "admin", name: adminByEmail.name || adminByEmail.username };
      }

      const teacherByEmail = await prisma.teacher.findFirst({
        where: { email: { equals: primaryEmail, mode: "insensitive" } },
      });
      if (teacherByEmail) {
        await prisma.teacher.update({ where: { id: teacherByEmail.id }, data: { clerkId } });
        return { isSignedIn: true, isLinked: true, role: "teacher", name: teacherByEmail.name, classGroup: teacherByEmail.classGroup };
      }

      const studentByEmail = await prisma.student.findFirst({
        where: { email: { equals: primaryEmail, mode: "insensitive" } },
      });
      if (studentByEmail) {
        await prisma.student.update({ where: { id: studentByEmail.id }, data: { clerkId } });
        return { isSignedIn: true, isLinked: true, role: "student", name: studentByEmail.name, classGroup: studentByEmail.classGroup };
      }
    }

    // Jika belum tertaut sama sekali (Skenario A)
    return {
      isSignedIn: true,
      isLinked: false,
      email: primaryEmail || null,
      fullName: `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || null,
    };
  } catch (error) {
    console.error("Error checking Clerk linking status:", error);
    return { isSignedIn: false, isLinked: false };
  }
}

export async function linkSchoolAccountWithClerk(usernameInput: string, passwordInput: string) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return {
      success: false,
      message: "Layanan autentikasi Google belum dikonfigurasi.",
    };
  }

  try {
    const clerkAuth = await auth();
    if (!clerkAuth?.userId) {
      return {
        success: false,
        message: "Sesi Google tidak terdeteksi. Silakan klik Masuk dengan Google terlebih dahulu.",
      };
    }

    const clerkId = clerkAuth.userId;
    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim() || null;
    const username = usernameInput.trim();

    // 1. Cek Admin
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin) {
      const isValid = await verifyPassword(passwordInput, admin.password);
      if (!isValid) return { success: false, message: "Password sekolah salah." };

      await prisma.admin.update({
        where: { id: admin.id },
        data: { clerkId, email: admin.email || primaryEmail },
      });

      // Berikan cookie sesi lokal juga untuk kompatibilitas ganda
      const session = await encrypt({ id: admin.id, role: "admin", username: admin.username });
      const cookieStore = await cookies();
      cookieStore.set({ name: "session", value: session, ...sessionCookieOptions });

      return { success: true, role: "admin", message: "Akun Administrator berhasil ditautkan ke Google!" };
    }

    // 2. Cek Guru
    const teacher = await prisma.teacher.findUnique({ where: { username } });
    if (teacher) {
      const isValid = await verifyPassword(passwordInput, teacher.password);
      if (!isValid) return { success: false, message: "Password sekolah salah." };

      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { clerkId, email: teacher.email || primaryEmail },
      });

      const session = await encrypt({
        id: teacher.id,
        role: "teacher",
        username: teacher.username,
        classGroup: teacher.classGroup,
      });
      const cookieStore = await cookies();
      cookieStore.set({ name: "session", value: session, ...sessionCookieOptions });

      return { success: true, role: "teacher", message: `Akun Guru Kelas 6${teacher.classGroup} berhasil ditautkan ke Google!` };
    }

    // 3. Cek Siswa (bisa lewat username atau NIS)
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ username }, { studentCode: username }],
      },
    });

    if (student) {
      const isValid = await verifyPassword(passwordInput, student.password);
      if (!isValid) return { success: false, message: "Password sekolah salah." };

      await prisma.student.update({
        where: { id: student.id },
        data: { clerkId, email: student.email || primaryEmail },
      });

      const session = await encrypt({
        id: student.id,
        role: "student",
        username: student.username,
        classGroup: student.classGroup,
      });
      const cookieStore = await cookies();
      cookieStore.set({ name: "session", value: session, ...sessionCookieOptions });

      return { success: true, role: "student", message: `Akun Siswa (${student.name}) berhasil ditautkan ke Google!` };
    }

    return { success: false, message: "Username atau NIS tidak ditemukan di sistem sekolah." };
  } catch (error) {
    console.error("Error linking account:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat menautkan akun." };
  }
}

export async function unlinkUserGoogleAccount(targetId: string, targetRole: "teacher" | "student") {
  try {
    if (targetRole === "teacher") {
      await prisma.teacher.update({
        where: { id: targetId },
        data: { clerkId: null },
      });
      revalidatePath("/admin/teacher");
    } else {
      await prisma.student.update({
        where: { id: targetId },
        data: { clerkId: null },
      });
      revalidatePath("/admin/student");
    }
    return { success: true, message: "Tautan akun Google berhasil diputuskan." };
  } catch (error) {
    console.error("Error unlinking account:", error);
    return { success: false, message: "Gagal memutuskan tautan akun." };
  }
}
