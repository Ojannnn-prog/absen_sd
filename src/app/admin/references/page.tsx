import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminReferencesClient from "./AdminReferencesClient";

export default async function AdminReferencesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const references = await prisma.teacherReference.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full min-w-0 max-w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Modul & Referensi Guru</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Kelola bahan rujukan guru melalui link Google Drive atau Google Docs.
        </p>
      </div>
      <AdminReferencesClient initialReferences={references} />
    </div>
  );
}
