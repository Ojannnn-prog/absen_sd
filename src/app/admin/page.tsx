import StudentList from "@/components/StudentList";
import AdminHeader from "./AdminHeader";
import AttendanceChart from "@/components/AttendanceChart";
import ExportButtons from "@/components/ExportButtons";
import { Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getMonthlyAttendanceData } from "./chartActions";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect("/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id },
    select: { id: true, username: true, name: true }
  });

  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" }
  });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" }
  });

  const chartData = await getMonthlyAttendanceData();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <AdminHeader admin={admin} announcements={announcements} />

      {/* Chart Section */}
      <div className="w-full">
        <AttendanceChart data={chartData} />
      </div>

      <div className="card-soft p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-text-header flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Daftar Siswa
          </h2>
          <ExportButtons />
        </div>
        
        <StudentList initialStudents={students} />
      </div>
    </div>
  );
}
