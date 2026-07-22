"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, UserCheck } from "lucide-react";
import QRScanner from "@/components/QRScanner";

type ScannedStudent = {
  id: string;
  name: string;
  studentCode: string;
  gender: string;
};

type RecentScan = {
  id: string;
  student: ScannedStudent;
  timestamp: Date;
  isNew: boolean;
};

export default function ScannerPage() {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  const handleScanSuccess = (data: { student: ScannedStudent, timestamp: Date, isNew: boolean }) => {
    // Add to the top of the list, keep only the latest 10
    setRecentScans(prev => {
      const newScan = {
        id: Math.random().toString(36).substr(2, 9),
        ...data
      };
      return [newScan, ...prev].slice(0, 10);
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-text-header tracking-tight">Kamera Pemindai</h1>
            <p className="text-text-body text-sm mt-1">Arahkan QR Code siswa ke kamera untuk mencatat kehadiran otomatis.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Scanner Section */}
        <div className="lg:col-span-3 flex flex-col items-center">
          <QRScanner onScanSuccess={handleScanSuccess} />
        </div>

        {/* Recent Scans Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full max-h-[600px] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-gray-900">Riwayat Terkini</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
              {recentScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                  <UserCheck className="w-12 h-12 mb-3 text-gray-200" />
                  <p className="text-sm">Belum ada pindaian.</p>
                </div>
              ) : (
                recentScans.map((scan) => (
                  <div 
                    key={scan.id} 
                    className="p-4 rounded-xl border animate-in slide-in-from-right-4 duration-300 flex justify-between items-center gap-2
                      ${scan.isNew ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}
                    "
                    style={{
                      backgroundColor: scan.isNew ? '#f0fdf4' : '#fff7ed',
                      borderColor: scan.isNew ? '#dcfce7' : '#ffedd5'
                    }}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-gray-900 truncate">{scan.student.name}</span>
                      <span className="text-xs text-gray-500">{scan.student.studentCode}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        scan.isNew ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {scan.isNew ? 'Hadir' : 'Sudah Absen'}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-1 font-medium">
                        {new Date(scan.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
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
