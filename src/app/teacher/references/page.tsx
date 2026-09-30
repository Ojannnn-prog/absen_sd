import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherReferencesClient from "./TeacherReferencesClient";

export default async function TeacherReferencesPage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") redirect("/login");

  const references = await prisma.teacherReference.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      notes: {
        where: { teacherId: session.id },
        select: { content: true, updatedAt: true },
        take: 1,
      },
    },
  });

  const safeReferences = references.map((reference) => ({
    id: reference.id,
    title: reference.title,
    driveUrl: reference.driveUrl,
    fileType: reference.fileType,
    note: reference.notes[0] || null,
  }));

  return <TeacherReferencesClient initialReferences={safeReferences} />;
}
