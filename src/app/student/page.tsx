import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import StudentQR from "@/components/StudentQR";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import ProfileEditor from "@/components/ProfileEditor";
import ThemeShop from "@/components/ThemeShop";
import StudentKTACard from "@/components/StudentKTACard";
import TitleShop from "@/components/TitleShop";
import AvatarMaker from "@/components/AvatarMaker";
import { format, addHours } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { History, Crown, Medal, Flame, Award, CheckCircle2, XCircle } from "lucide-react";
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
      },
      studentProgress: true,
      quizAttempts: {
        include: { resource: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!student) {
    redirect("/login");
  }

  const presentCount = student.attendances.filter(a => a.status === 'Hadir').length;
  const isProPlayer = presentCount > 3;
  
  const attendancePoints = student.attendances.length * 2;
  const progressPoints = student.studentProgress.length * 5;
  const passedQuizzes = student.quizAttempts.filter((q) => q.passed).length;
  const quizPoints = passedQuizzes * 10;
  const totalScore = attendancePoints + progressPoints + quizPoints;
  const currentPoints = totalScore - student.spentPoints;

  // Dicebear avatar as fallback
  const encodedName = encodeURIComponent(student.name);
  const avatarBg = student.gender === 'L' ? 'e0f2fe' : 'fce7f3';
  const defaultAvatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodedName}&backgroundColor=${avatarBg}`;
  
  const avatarUrl = student.profileImage || defaultAvatarUrl;

  return (
    <div className={`theme-${student.activeTheme} flex flex-col gap-8 animate-in fade-in duration-500`}>
      {/* Gamification Header */}
      <div className="card-soft p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 bg-gradient-to-r from-white to-[var(--theme-primary,var(--color-primary))]/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-transparent transition-all hover:border-[var(--theme-primary,var(--color-primary))]/20 relative overflow-hidden">
        
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary,var(--color-primary))] opacity-5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative">
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className={`w-32 h-32 md:w-40 md:h-40 rounded-[2rem] object-cover shadow-xl border-4 ${isProPlayer ? 'border-yellow-400' : 'border-white'}`} 
          />
          {isProPlayer && (
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-300 to-yellow-500 p-2.5 rounded-2xl shadow-lg transform rotate-12 hover:rotate-0 transition-transform cursor-help" title="Player Aktif!">
              <Crown className="w-8 h-8 text-white drop-shadow-md" />
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start relative z-20 w-full">
          {/* Level Badge */}
          <div className="mb-3">
            {isProPlayer ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black rounded-full shadow-md uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" /> Player Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full shadow-inner uppercase tracking-wider">
                <Medal className="w-3.5 h-3.5" /> Newbie
              </span>
            )}
          </div>

          <ProfileEditor initialNickname={student.nickname} studentName={student.name} />

          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            {student.activeTitle && (
              <div className="w-full mb-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                  {student.activeTitle}
                </span>
              </div>
            )}
            <div className="inline-flex px-4 py-2 bg-white border-2 border-gray-100 rounded-xl text-sm shadow-sm">
              <span className="text-gray-500 mr-2 font-medium">Hadir:</span>
              <span className="font-black text-gray-900">{presentCount} Hari</span>
            </div>
            <div className="inline-flex px-4 py-2 bg-[var(--theme-primary,var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-md shadow-[var(--theme-primary,var(--color-primary))]/20">
              💎 {currentPoints} Poin
            </div>
          </div>
          
          <div className="mt-6 w-full max-w-[250px]">
            <ChangePasswordModal />
          </div>
        </div>
        
        {/* QR Code Card */}
        <div className="bg-white p-5 rounded-[2rem] shadow-xl border-4 border-gray-50 flex flex-col items-center relative z-10 hover:-translate-y-2 transition-transform duration-300">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Login QR Card</p>
          <StudentQR studentCode={student.studentCode} name={student.name} />
          <p className="text-xs font-mono font-bold text-gray-500 mt-3">{student.studentCode}</p>
        </div>
      </div>

      {/* KTA Card Section */}
      <div className="card-soft p-6 md:p-8 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm border border-gray-100">
        <StudentKTACard student={{
          name: student.name,
          studentCode: student.studentCode,
          birthPlace: student.birthPlace,
          birthDate: student.birthDate,
          gender: student.gender,
          profileImage: student.profileImage
        }} />
      </div>

      {/* Title Shop & Avatar Pass */}
      <TitleShop 
        currentPoints={currentPoints}
        unlockedTitles={student.unlockedTitles}
        activeTitle={student.activeTitle}
        avatarUnlocked={student.avatarUnlocked}
      />

      {/* Avatar Maker (Hanya muncul jika sudah dibeli) */}
      {student.avatarUnlocked && (
        <AvatarMaker 
          initialConfig={student.avatarConfig} 
          studentName={student.name} 
        />
      )}

      {/* Theme Shop */}
      <ThemeShop 
        currentPoints={currentPoints}
        unlockedThemes={student.unlockedThemes}
        activeTheme={student.activeTheme}
      />

      {/* Leaderboard */}
      <LeaderboardView />

      {/* Riwayat Nilai Ujian */}
      <div className="card-soft p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <Award className="w-6 h-6 text-yellow-500" />
          Riwayat Nilai Ujian (Quiz)
        </h2>
        
        {(!student.quizAttempts || student.quizAttempts.length === 0) ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            Belum ada data ujian. Ikuti sesi Quiz di Ruang Belajar untuk mendapatkan nilai!
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 font-bold text-gray-600">Topik / Nama Quiz</th>
                  <th className="py-3 px-4 font-bold text-gray-600 text-center">Skor (0-100)</th>
                  <th className="py-3 px-4 font-bold text-gray-600 text-center">Status Kelulusan</th>
                  <th className="py-3 px-4 font-bold text-gray-600">Waktu Pengerjaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {student.quizAttempts.map((att: any) => (
                  <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {att.resource?.title || "Quiz Tidak Diketahui"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-lg font-black ${att.passed ? 'text-green-600' : 'text-red-500'}`}>
                        {att.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {att.passed ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Lulus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                          <XCircle className="w-4 h-4" /> Mengulang
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-medium">
                      {format(addHours(att.createdAt, 7), "dd MMM yyyy, HH:mm", { locale: localeId })} WIB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Riwayat Absensi */}
      <div className="card-soft p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <History className="w-6 h-6 text-[var(--theme-primary,var(--color-primary))]" />
          Riwayat Kehadiran Terakhir
        </h2>
        
        {student.attendances.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            Belum ada riwayat absensi.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {student.attendances.map((att) => (
              <div key={att.id} className="flex justify-between items-center p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-12 rounded-full ${
                    att.status === 'Hadir' ? 'bg-green-400' :
                    att.status === 'Izin' ? 'bg-yellow-400' : 'bg-red-400'
                  } group-hover:scale-y-110 transition-transform`}></div>
                  <div>
                    {(() => {
                      const wibTime = addHours(att.timestamp, 7);
                      return (
                        <>
                          <p className="font-bold text-gray-900">{format(wibTime, "EEEE, dd MMMM yyyy", { locale: localeId })}</p>
                          <p className="text-sm font-medium text-gray-500">{format(wibTime, "HH:mm 'WIB'", { locale: localeId })}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider ${
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
