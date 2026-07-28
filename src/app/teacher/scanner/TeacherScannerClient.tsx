"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, UserCheck, ShieldCheck, Crown } from "lucide-react";
import TeacherQRScanner from "@/components/TeacherQRScanner";

type ScannedStudent = {
  id: string;
  name: string;
  studentCode: string;
  gender: string;
  classGroup?: string;
};

type RecentScan = {
  id: string;
  student: ScannedStudent;
  timestamp: Date;
  isNew: boolean;
};

export default function TeacherScannerClient({ teacher }: { teacher: any }) {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const classGroup = teacher.classGroup || "A";

  const handleScanSuccess = (data: { student: ScannedStudent, timestamp: Date, isNew: boolean }) => {
    setRecentScans(prev => {
      const newScan = {
        id: Math.random().toString(36).substr(2, 9),
        ...data
      };
      return [newScan, ...prev].slice(0, 10);
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/teacher" className="p-2.5 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                Wali Kelas 6{classGroup}
              </span>
              <span className="text-xs font-extrabold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Isolasi Kelas Aktif
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Scanner Absensi Guru (Kelas 6{classGroup})</h1>
            <p className="text-gray-500 text-sm mt-1">
              Arahkan QR Code siswa ke kamera. Sistem secara otomatis menolak siswa dari kelas lain.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Scanner Section */}
        <div className="lg:col-span-3 flex flex-col items-center">
          <TeacherQRScanner teacherClassGroup={classGroup} onScanSuccess={handleScanSuccess} />
        </div>

        {/* Recent Scans Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-4">
              <History className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Riwayat Scan Terbaru (6{classGroup})</h3>
            </div>

            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Belum ada absensi tercatat</p>
                  <p className="text-xs">Hasil scan siswa Kelas 6{classGroup} akan muncul di sini.</p>
                </div>
              ) : (
                recentScans.map(scan => (
                  <div 
                    key={scan.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      scan.isNew 
                        ? "bg-green-50/50 border-green-200 text-green-900" 
                        : "bg-amber-50/50 border-amber-200 text-amber-900"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">{scan.student.name}</h4>
                      <p className="text-xs opacity-75">{scan.student.studentCode} • Kelas 6{classGroup}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                        scan.isNew ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {scan.isNew ? "Berhasil" : "Sudah Absen"}
                      </span>
                      <p className="text-[10px] opacity-60 mt-1">
                        {scan.timestamp.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
