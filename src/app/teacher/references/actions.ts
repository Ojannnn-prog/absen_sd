"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/security";
import { revalidatePath } from "next/cache";

export async function saveTeacherReferenceNote(referenceId: string, content: string) {
  const session = await requireRole("teacher");
  const normalizedContent = typeof content === "string" ? content.trim() : "";

  if (normalizedContent.length > 100_000) {
    throw new Error("Catatan terlalu panjang.");
  }

  const reference = await prisma.teacherReference.findUnique({
    where: { id: referenceId },
    select: { id: true },
  });

  if (!reference) throw new Error("Modul referensi tidak ditemukan.");

  await prisma.teacherReferenceNote.upsert({
    where: {
      referenceId_teacherId: {
        referenceId,
        teacherId: session.id,
      },
    },
    create: {
      referenceId,
      teacherId: session.id,
      content: normalizedContent,
    },
    update: {
      content: normalizedContent,
    },
  });

  revalidatePath("/teacher/references");
  return { success: true };
}
