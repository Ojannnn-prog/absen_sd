import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import StudentQR from "@/components/StudentQR";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { History, UserCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const session = await getSession();
  
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
    include: {
      attendances: {
        orderBy: { timestamp: "desc" },
      }
    }
  });

  if (!student) {
    redirect("/login");
  }

  const encodedName = encodeURIComponent(student.name);
  const avatarBg = student.gender === 'L' ? 'e0f2fe' : 'fce7f3';
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodedName}&backgroundColor=${avatarBg}`;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header Info Siswa */}
      <div className="card-soft p-6 flex flex-col md:flex-row items-center md:items-start gap-6 bg-gradient-to-r from-white to-blue-50/50">
        <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full shadow-md border-4 border-white" />
        <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
          <h1 className="text-2xl font-extrabold text-text-header">{student.name}</h1>
          <p className="text-primary font-medium">{student.studentCode}</p>
          <div className="mt-3 inline-flex px-3 py-1 bg-white border border-gray-100 rounded-full text-sm text-gray-600 shadow-sm">
            Total Kehadiran: <span className="font-bold text-gray-900 ml-1">{student.attendances.filter(a => a.status === 'Hadir').length} Hari</span>
          </div>
          
          <div className="mt-6 w-full max-w-[250px]">
            <ChangePasswordModal />
          </div>
        </div>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex flex-col items-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Kartu Absensi Anda</p>
          <StudentQR studentCode={student.studentCode} name={student.name} />
        </div>
      </div>

      {/* Riwayat Absensi */}
      <div className="card-soft p-6">
        <h2 className="text-xl font-bold text-text-header flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-primary" />
          Riwayat Kehadiran Terakhir
        </h2>
        
        {student.attendances.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Belum ada riwayat absensi.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {student.attendances.map((att) => (
              <div key={att.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${
                    att.status === 'Hadir' ? 'bg-green-400' :
                    att.status === 'Izin' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <div>
                    <p className="font-bold text-gray-900">{format(att.timestamp, "EEEE, dd MMMM yyyy", { locale: localeId })}</p>
                    <p className="text-sm text-gray-500">{format(att.timestamp, "HH:mm 'WIB'", { locale: localeId })}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                  att.status === 'Hadir' ? 'bg-green-100 text-green-700' :
                  att.status === 'Izin' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {att.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
