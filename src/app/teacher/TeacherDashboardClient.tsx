"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Users, QrCode, Sparkles, User, ShieldCheck, CheckCircle2, Clock, AlertCircle, Award, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import TeacherAvatarMaker from "@/components/TeacherAvatarMaker";
import TeacherProfileEditor from "@/components/TeacherProfileEditor";
import { getAvatarUrl } from "@/lib/avatar";

interface Props {
  teacher: any;
  students: any[];
  stats: {
    totalStudents: number;
    presentToday: number;
    izinToday: number;
    absenToday: number;
  };
  announcements: any[];
}

export default function TeacherDashboardClient({ teacher, students, stats, announcements }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "avatar" | "profile">("overview");

  const classGroup = teacher.classGroup || "A";
  const avatarUrl = getAvatarUrl(teacher.avatarConfig, teacher.profileImage, teacher.name, "P");

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      <Navbar role="teacher" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Header Banner */}
        <div className="card-soft p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-20 top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 p-1 border-2 border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                <img src={avatarUrl} alt={teacher.name} className="w-full h-full object-cover rounded-xl" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 font-extrabold text-xs flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    Wali Kelas 6{classGroup}
                  </span>
                  {teacher.activeTitle && (
                    <span className="px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-bold text-xs">
                      {teacher.activeTitle}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                  Halo, {teacher.name || "Guru"}
                </h1>
                <p className="text-indigo-200 text-sm mt-1">
                  Selamat datang di Dasbor Guru Kelas 6{classGroup}. Kelola absensi dan perkembangan belajar siswa dengan mudah.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Link 
                href="/teacher/scanner"
                className="flex-1 md:flex-initial btn bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all"
              >
                <QrCode className="w-5 h-5" />
                <span>Buka Scanner Kelas 6{classGroup}</span>
              </Link>
              <Link 
                href="/teacher/student"
                className="flex-1 md:flex-initial btn bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-all"
              >
                <Users className="w-5 h-5" />
                <span>Kelola Siswa (6{classGroup})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Ikhtisar Kelas 6{classGroup}
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`pb-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "avatar"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Avatar Maker (Guru)
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            Pengaturan Akun & Profil
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Siswa 6{classGroup}</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.totalStudents}</h3>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">Siswa Terdaftar</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hadir Hari Ini</p>
                  <h3 className="text-3xl font-black text-green-600 mt-1">{stats.presentToday}</h3>
                  <p className="text-xs text-green-700 font-semibold mt-1">Siswa Hadir</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Izin Hari Ini</p>
                  <h3 className="text-3xl font-black text-amber-600 mt-1">{stats.izinToday}</h3>
                  <p className="text-xs text-amber-700 font-semibold mt-1">Siswa Izin</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Belum Absen / Alpha</p>
                  <h3 className="text-3xl font-black text-red-600 mt-1">{stats.absenToday}</h3>
                  <p className="text-xs text-red-700 font-semibold mt-1">Siswa Absen</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Recent Students Preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Daftar Siswa Kelas 6{classGroup}
                </h3>
                <Link 
                  href="/teacher/student"
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Kelola Semua <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">NIS</th>
                      <th className="py-3 px-4">L/P</th>
                      <th className="py-3 px-4">Total Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {students.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-900">{s.name}</td>
                        <td className="py-3 px-4 font-semibold text-gray-600">{s.studentCode}</td>
                        <td className="py-3 px-4 font-semibold text-gray-600">{s.gender}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            {s.attendances?.length || 0} Kali
                          </span>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                          Belum ada siswa terdaftar di Kelas 6{classGroup}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "avatar" && (
          <div className="animate-in fade-in duration-300">
            <TeacherAvatarMaker initialConfig={teacher.avatarConfig} teacherName={teacher.name || "Guru"} />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="animate-in fade-in duration-300">
            <TeacherProfileEditor teacher={teacher} />
          </div>
        )}
      </main>
    </div>
  );
}
