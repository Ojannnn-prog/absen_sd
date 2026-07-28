import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminTeacherClient from "./AdminTeacherClient";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTeacherPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dasbor
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            Kelola Data Guru & Role Kelas
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Atur akun guru pengampu untuk Kelas 6A, 6B, dan 6C beserta hak akses kelasnya.
          </p>
        </div>
      </div>

      <AdminTeacherClient initialTeachers={teachers} />
    </div>
  );
}
