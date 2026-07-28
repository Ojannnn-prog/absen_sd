"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Props {
  students: any[];
}

export default function AdminReportButton({ students }: Props) {
  const [loading, setLoading] = useState(false);

  const generatePDF = () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text("LAPORAN REKAP DATA SISWA", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text("Sistem Absensi & Pembelajaran Terpadu", 105, 27, { align: "center" });
      
      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 32, 196, 32);

      // Info
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Total Siswa Terdaftar : ${students.length} Siswa`, 14, 42);

      // Table Data
      const tableData = students.map((s, index) => {
        // Calculate points
        const presentCount = s.attendances?.filter((a:any) => a.status === 'Hadir').length || 0;
        const attendancePoints = (s.attendances?.length || 0) * 2;
        const progressPoints = (s.studentProgress?.length || 0) * 5;
        const passedQuizzes = s.quizAttempts?.filter((q:any) => q.passed).length || 0;
        const quizPoints = passedQuizzes * 10;
        const totalScore = attendancePoints + progressPoints + quizPoints;
        
        // Calculate attendance %
        const attPercent = s.attendances && s.attendances.length > 0 
          ? Math.round((presentCount / s.attendances.length) * 100) 
          : 0;

        // Calculate average quiz
        const quizTotalScore = s.quizAttempts?.reduce((sum: number, q: any) => sum + q.score, 0) || 0;
        const avgQuiz = s.quizAttempts && s.quizAttempts.length > 0
          ? Math.round(quizTotalScore / s.quizAttempts.length)
          : 0;

        return [
          (index + 1).toString(),
          s.name,
          s.studentCode,
          `6${s.classGroup || "A"}`,
          `${totalScore} Poin`,
          `${attPercent}%`,
          avgQuiz.toString()
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [['No', 'Nama Siswa', 'NIS', 'Kelas', 'Total Poin', 'Kehadiran (%)', 'Rata-rata Kuis']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: localeId })}`, 105, pageHeight - 10, { align: "center" });

      doc.save(`Rekap_Siswa_${format(new Date(), "dd-MM-yyyy")}.pdf`);
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
      className="w-full md:w-auto justify-center inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-70 flex-shrink-0"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
      <span className="hidden sm:inline">Cetak Rekap (PDF)</span>
    </button>
  );
}
