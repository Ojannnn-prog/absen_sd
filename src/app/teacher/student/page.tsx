import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherStudentClient from "./TeacherStudentClient";

export default async function TeacherStudentPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    redirect("/login");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.id }
  });

  if (!teacher) {
    redirect("/login");
  }

  const classGroup = teacher.classGroup || "A";

  const totalResources = await prisma.courseResource.count();

  // Ambil hanya siswa dengan classGroup yang sama dengan Guru ini
  const students = await prisma.student.findMany({
    where: { classGroup },
    orderBy: { name: 'asc' },
    include: {
      attendances: true,
      studentProgress: true,
      quizAttempts: {
        include: { resource: true },
        orderBy: { createdAt: 'desc' }
      },
    }
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <TeacherStudentClient 
        teacher={teacher} 
        initialStudents={JSON.parse(JSON.stringify(students))} 
        totalResources={totalResources}
      />
    </div>
  );
}
