"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/security";
import { revalidatePath } from "next/cache";

const REFERENCE_FILE_TYPES = new Set([
  "PDF",
  "Word",
  "Excel",
  "PowerPoint",
  "Gambar",
  "Video",
  "Audio",
  "Lainnya",
]);

function normalizeReferenceData(data: { title: string; driveUrl: string; fileType: string }) {
  const title = data.title.trim();
  const driveUrl = data.driveUrl.trim();
  const fileType = data.fileType.trim();

  if (!title || title.length > 160) {
    throw new Error("Judul referensi wajib diisi dan maksimal 160 karakter.");
  }

  if (!REFERENCE_FILE_TYPES.has(fileType)) {
    throw new Error("Jenis file referensi tidak valid.");
  }

  if (driveUrl.length > 2048) {
    throw new Error("Link referensi terlalu panjang.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(driveUrl);
  } catch {
    throw new Error("Link Google Drive tidak valid.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !["drive.google.com", "docs.google.com"].includes(parsedUrl.hostname.toLowerCase())
  ) {
    throw new Error("Referensi harus menggunakan link Google Drive atau Google Docs HTTPS.");
  }

  const path = parsedUrl.pathname.replace(/\/(view|edit|preview)\/?$/, "/preview");
  parsedUrl.pathname = path;

  return { title, driveUrl: parsedUrl.toString(), fileType };
}

export async function createTeacherReference(data: { title: string; driveUrl: string; fileType: string }) {
  await requireRole("admin");
  const normalized = normalizeReferenceData(data);

  await prisma.teacherReference.create({ data: normalized });

  revalidatePath("/admin/references");
  revalidatePath("/teacher/references");
  return { success: true };
}

export async function updateTeacherReference(
  id: string,
  data: { title: string; driveUrl: string; fileType: string }
) {
  await requireRole("admin");
  const normalized = normalizeReferenceData(data);

  await prisma.teacherReference.update({
    where: { id },
    data: normalized,
  });

  revalidatePath("/admin/references");
  revalidatePath("/teacher/references");
  return { success: true };
}

export async function deleteTeacherReference(id: string) {
  await requireRole("admin");

  await prisma.teacherReference.delete({ where: { id } });

  revalidatePath("/admin/references");
  revalidatePath("/teacher/references");
  return { success: true };
}
