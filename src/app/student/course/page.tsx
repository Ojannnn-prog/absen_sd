import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseClient from "./CourseClient";

export default async function StudentCoursePage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  // Get active theme to apply to the container
  const student = await prisma.student.findUnique({
    where: { id: session.id },
    select: { activeTheme: true }
  });

  // Get all resources
  const resources = await prisma.courseResource.findMany({
    orderBy: { orderIndex: 'asc' }
  });

  // Get student progress
  const progress = await prisma.studentProgress.findMany({
    where: { studentId: session.id },
    select: { resourceId: true }
  });

  const completedIds = progress.map(p => p.resourceId);

  return (
    <div className={`theme-${student?.activeTheme || 'default'} animate-in fade-in duration-500 min-h-screen flex flex-col`}>
      <CourseClient resources={resources} completedIds={completedIds} />
    </div>
  );
}
