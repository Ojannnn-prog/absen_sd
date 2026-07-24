"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Props {
  student: any;
  totalScore: number;
  levelInfo: any;
}

export default function StudentReportButton({ student, totalScore, levelInfo }: Props) {
  const [loading, setLoading] = useState(false);

  const generatePDF = () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text("RAPOR DIGITAL SISWA", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text("Sistem Absensi & Pembelajaran Terpadu", 105, 27, { align: "center" });
      
      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 32, 196, 32);

      // Student Info
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Nama Lengkap   : ${student.name}`, 14, 42);
      doc.text(`Nomor Induk    : ${student.studentCode}`, 14, 49);
      doc.text(`Username Game  : @${student.username}`, 14, 56);
      
      doc.text(`Total Poin     : ${totalScore} Poin`, 120, 42);
      doc.text(`Level Pangkat  : ${levelInfo.level} (${levelInfo.title})`, 120, 49);
      doc.text(`Gelar Saat Ini : ${student.activeTitle || "Belum ada"}`, 120, 56);

      // Attendance Stats
      const presentCount = student.attendances.filter((a: any) => a.status === 'Hadir').length;
      const sickCount = student.attendances.filter((a: any) => a.status === 'Sakit').length;
      const permissionCount = student.attendances.filter((a: any) => a.status === 'Izin').length;
      
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text("Ringkasan Kehadiran", 14, 70);

      autoTable(doc, {
        startY: 75,
        head: [['Hadir', 'Sakit', 'Izin', 'Total Catatan']],
        body: [[
          `${presentCount} Hari`, 
          `${sickCount} Hari`, 
          `${permissionCount} Hari`, 
          `${student.attendances.length} Hari`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Quiz Stats
      const finalY = (doc as any).lastAutoTable.finalY || 95;
      doc.text("Riwayat Nilai Kuis", 14, finalY + 15);

      if (student.quizAttempts && student.quizAttempts.length > 0) {
        const quizData = student.quizAttempts.map((q: any) => [
          q.resource?.title || "Kuis",
          `${q.score}`,
          q.passed ? "Lulus" : "Belum Lulus",
          format(new Date(q.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })
        ]);

        autoTable(doc, {
          startY: finalY + 20,
          head: [['Nama Kuis', 'Nilai', 'Status', 'Tanggal Selesai']],
          body: quizData,
          theme: 'striped',
          headStyles: { fillColor: [39, 174, 96] },
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("Belum ada riwayat pengerjaan kuis.", 14, finalY + 22);
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: localeId })}`, 105, pageHeight - 10, { align: "center" });

      doc.save(`Rapor_${student.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Gagal men-generate PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={generatePDF}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl transition-colors border border-indigo-200 shadow-sm disabled:opacity-70"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
      Cetak Rapor (PDF)
    </button>
  );
}
