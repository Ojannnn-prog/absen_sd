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
    include: {
      attendances: true,
      studentProgress: true,
      quizAttempts: true,
    }
  });

  return (
    <div className="animate-in fade-in duration-500">
      <AdminStudentClient initialStudents={students} />
    </div>
  );
}
