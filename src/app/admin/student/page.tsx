import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminStudentClient from "./AdminStudentClient";

export default async function AdminStudentPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      gender: true,
      birthPlace: true,
      birthDate: true,
      studentCode: true,
      username: true,
      classGroup: true,
      profileImage: true,
      nickname: true,
      spentPoints: true,
      activeTheme: true,
      unlockedThemes: true,
      activeTitle: true,
      unlockedTitles: true,
      avatarUnlocked: true,
      avatarConfig: true,
      createdAt: true,
      lastActive: true,
      attendances: true,
      studentProgress: true,
      quizAttempts: true,
      facePhoto: true,
      faceEnrolledAt: true,
    },
  });

  return (
    <div className="animate-in fade-in duration-500">
      <AdminStudentClient initialStudents={students} />
    </div>
  );
}
