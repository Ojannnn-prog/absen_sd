import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminResourcesClient from "./AdminResourcesClient";

export default async function AdminResourcesPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const resources = await prisma.courseResource.findMany({
    orderBy: { orderIndex: 'asc' }
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Sumber Belajar</h1>
          <p className="text-gray-500 mt-1">Tambahkan materi pembelajaran (Video, Teks, Audio) via Google Drive Embed.</p>
        </div>
      </div>

      <AdminResourcesClient initialResources={resources} />
    </div>
  );
}
