"use client";

import { useState } from "react";
import { Calendar, FileText, Download, X, Loader2, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import toast from "react-hot-toast";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

interface Props {
  students?: any[];
  role?: "admin" | "teacher";
  classGroupLabel?: string;
  buttonClassName?: string;
  buttonLabel?: string;
  onFetchStudents?: () => Promise<any[]>;
}

export default function MonthlyReportModal({
  students = [],
  role = "admin",
  classGroupLabel = "Semua Kelas",
  buttonClassName,
  buttonLabel = "Report Bulanan (PDF)",
  onFetchStudents,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [localStudents, setLocalStudents] = useState<any[]>(students);

  // Jika modal dibuka dan kita perlu fetch dari server (misal di halaman yang belum punya full attendances)
  const handleOpen = async () => {
    setIsOpen(true);
    if (onFetchStudents) {
      setLoading(true);
      try {
        const fetched = await onFetchStudents();
        setLocalStudents(fetched || []);
      } catch (err) {
        toast.error("Gagal memuat data absensi");
      } finally {
        setLoading(false);
      }
    } else {
      setLocalStudents(students);
    }
  };

  // Kalkulasi statistik langsung untuk bulan & tahun yang dipilih
  const getStudentStatsInMonth = (s: any) => {
    const attInMonth = (s.attendances || []).filter((a: any) => {
      const d = new Date(a.timestamp);
      // Gunakan waktu lokal Jakarta (WIB)
      const jakartaDate = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      return jakartaDate.getMonth() === selectedMonth && jakartaDate.getFullYear() === selectedYear;
    });

    let hadir = 0;
    let izin = 0;
    let alpha = 0;

    attInMonth.forEach((a: any) => {
      if (a.status === "Hadir") hadir++;
      else if (a.status === "Izin") izin++;
      else alpha++;
    });

    const total = hadir + izin + alpha;
    const percentNum = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const percentStr = total > 0 ? `${percentNum}%` : "-";

    return { hadir, izin, alpha, total, percentNum, percentStr };
  };

  const calculateTotalSummary = () => {
    let totalHadirAll = 0;
    let totalIzinAll = 0;
    let totalAlphaAll = 0;

    localStudents.forEach((s) => {
      const { hadir, izin, alpha } = getStudentStatsInMonth(s);
      totalHadirAll += hadir;
      totalIzinAll += izin;
      totalAlphaAll += alpha;
    });

    const totalAttAll = totalHadirAll + totalIzinAll + totalAlphaAll;
    const avgAttPercent = totalAttAll > 0 ? Math.round((totalHadirAll / totalAttAll) * 100) : 0;

    return { totalHadirAll, totalIzinAll, totalAlphaAll, totalAttAll, avgAttPercent };
  };

  const summary = calculateTotalSummary();

  const handleGeneratePDF = () => {
    if (!localStudents || localStudents.length === 0) {
      toast.error("Tidak ada data siswa untuk dicetak");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Menyiapkan Laporan PDF Bulanan...");

    try {
      const doc = new jsPDF("landscape");

      // Header Judul
      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text("LAPORAN BULANAN REKAP ABSENSI SISWA - SDN 231 SUKAASIH", 148, 18, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text(
        `PERIODE: ${MONTH_NAMES[selectedMonth].toUpperCase()} ${selectedYear} | KELAS: ${classGroupLabel.toUpperCase()}`,
        148,
        26,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Total Siswa: ${localStudents.length} Siswa | Total Catatan Bulan Ini: ${summary.totalAttAll} Absensi`,
        148,
        33,
        { align: "center" }
      );

      // Garis Pembatas
      doc.setDrawColor(229, 231, 235);
      doc.line(14, 37, 283, 37);

      // Ringkasan Kehadiran
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(
        `Ringkasan Bulan Ini:   ${summary.totalHadirAll} Hadir (H)   |   ${summary.totalIzinAll} Izin (I)   |   ${summary.totalAlphaAll} Alpha (A)   |   Rata-rata Kehadiran: ${summary.avgAttPercent}%`,
        14,
        44
      );

      // Siapkan baris tabel
      const rows = localStudents.map((s, index) => {
        const { hadir, izin, alpha, percentStr } = getStudentStatsInMonth(s);
        return [
          (index + 1).toString(),
          s.name,
          s.studentCode || "-",
          s.classGroup ? `6${s.classGroup}` : "6A",
          hadir.toString(),
          izin.toString(),
          alpha.toString(),
          `${hadir}H / ${izin}I / ${alpha}A`,
          percentStr,
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [
          [
            "No",
            "Nama Siswa",
            "NIS / Username",
            "Kelas",
            "Hadir (H)",
            "Izin (I)",
            "Alpha (A)",
            "Rekap (H/I/A)",
            "Kehadiran (%)",
          ],
        ],
        body: rows,
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 55 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 22, halign: "center" },
          5: { cellWidth: 22, halign: "center" },
          6: { cellWidth: 22, halign: "center" },
          7: { cellWidth: 40, halign: "center" },
          8: { cellWidth: 25, halign: "center" },
        },
      });

      // Bagian Tanda Tangan Formal
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      const signY = Math.min(finalY + 16, doc.internal.pageSize.height - 40);

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text(`Bandung, ${format(new Date(), "dd MMMM yyyy", { locale: localeId })}`, 225, signY);
      doc.text("Mengetahui,", 225, signY + 6);
      doc.text(role === "admin" ? "Administrator Sekolah" : "Wali Kelas", 225, signY + 26);
      doc.setFont("helvetica", "bold");
      doc.text("SDN 231 Sukaasih", 225, signY + 32);

      const filename = `Laporan_Absensi_Bulanan_${MONTH_NAMES[selectedMonth]}_${selectedYear}_${classGroupLabel.replace(/\s+/g, "_")}.pdf`;
      doc.save(filename);

      toast.success("Laporan PDF bulanan berhasil diunduh!", { id: toastId });
      setIsOpen(false);
    } catch (err) {
      console.error("Gagal mencetak PDF Bulanan:", err);
      toast.error("Gagal mencetak laporan PDF bulanan", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          buttonClassName ||
          "btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        }
      >
        <Calendar className="w-4 h-4" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Cetak Report Bulanan (PDF)</h3>
                  <p className="text-xs text-indigo-100 font-medium">
                    Laporan absensi siswa SDN 231 Sukaasih tiap bulannya
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Filter Bulan & Tahun */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Pilih Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, index) => (
                      <option key={name} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Pilih Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info Kelas Target */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900">Target Laporan</p>
                    <p className="text-sm font-black text-indigo-700">{classGroupLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-extrabold text-indigo-700 shadow-sm border border-indigo-100">
                    {localStudents.length} Siswa
                  </span>
                </div>
              </div>

              {/* Live Preview Statistik Bulan Terpilih */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rekap {MONTH_NAMES[selectedMonth]} {selectedYear}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                    <p className="text-[10px] font-extrabold text-green-600 uppercase">Hadir (H)</p>
                    <p className="text-lg font-black text-green-700">{summary.totalHadirAll}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <p className="text-[10px] font-extrabold text-amber-600 uppercase">Izin (I)</p>
                    <p className="text-lg font-black text-amber-700">{summary.totalIzinAll}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                    <p className="text-[10px] font-extrabold text-red-600 uppercase">Alpha (A)</p>
                    <p className="text-lg font-black text-red-700">{summary.totalAlphaAll}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                    <p className="text-[10px] font-extrabold text-indigo-600 uppercase">Rata-rata</p>
                    <p className="text-lg font-black text-indigo-700">{summary.avgAttPercent}%</p>
                  </div>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-2">
                <span className="text-indigo-600 font-bold">ℹ</span>
                <span>
                  Laporan akan diunduh dalam format <strong>PDF Landscape (9 Kolom)</strong> lengkap dengan perincian Hadir,
                  Izin, Alpha, persentase kehadiran tiap siswa, dan kolom tanda tangan resmi.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={loading || localStudents.length === 0}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Cetak Laporan Bulanan (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
