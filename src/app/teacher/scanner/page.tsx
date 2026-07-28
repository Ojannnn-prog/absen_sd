import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherScannerClient from "./TeacherScannerClient";

export default async function TeacherScannerPage() {
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

  return <TeacherScannerClient teacher={teacher} />;
}
