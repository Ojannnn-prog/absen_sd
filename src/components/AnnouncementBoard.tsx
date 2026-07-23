import prisma from "@/lib/prisma";
import { Bell, Trophy, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AnnouncementBoard() {
  // Fetch latest 3 announcements
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Top students statistic
  const topStudents = await prisma.student.findMany({
    take: 3,
    include: {
      _count: {
        select: { attendances: { where: { status: "Hadir" } } }
      }
    },
    orderBy: {
      attendances: {
        _count: "desc"
      }
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pengumuman Terkini */}
      <div className="card-soft p-6 lg:col-span-2 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-text-header flex items-center gap-2 mb-2">
          <Bell className="w-6 h-6 text-yellow-500" />
          Papan Pengumuman
        </h2>
        
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-body bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
            <p>Belum ada pengumuman saat ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-5 rounded-xl bg-blue-50/40 border border-blue-100 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-gray-900 mb-2 break-words">{ann.title}</h3>
                
                <div 
                  className="prose prose-sm prose-blue max-w-none text-gray-700 leading-relaxed break-words overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: ann.content }}
                />
                
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-blue-100/50 text-[11px] text-gray-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  Diunggah pada {format(ann.createdAt, "dd MMMM yyyy, HH:mm", { locale: id })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistik Absensi */}
      <div className="card-soft p-6 flex flex-col gap-4 bg-gradient-to-b from-white to-indigo-50/30">
        <h2 className="text-xl font-bold text-text-header flex items-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Siswa Terajin
        </h2>
        
        {topStudents.length === 0 ? (
          <div className="text-sm text-center text-gray-500 py-6">
            Data kehadiran belum tersedia.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topStudents.map((student, index) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.studentCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{student._count.attendances}</p>
                  <p className="text-[10px] uppercase text-gray-400">Hadir</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
