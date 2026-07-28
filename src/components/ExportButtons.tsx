"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getExportData } from "@/app/admin/exportActions";
import toast from "react-hot-toast";

export default function ExportButtons() {
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);
  const [selectedClass, setSelectedClass] = useState("ALL");

  const exportExcel = async () => {
    setLoading("excel");
    try {
      const data = await getExportData(selectedClass);
      if (!data || data.length === 0) {
        toast.error("Tidak ada data siswa untuk diekspor.");
        return;
      }

      // Convert to worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kehadiran");

      // Download file
      XLSX.writeFile(wb, `Laporan_Kehadiran_SDN231_Kelas_${selectedClass}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`);
      toast.success("Laporan Excel berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh Excel.");
    } finally {
      setLoading(null);
    }
  };

  const exportPDF = async () => {
    setLoading("pdf");
    try {
      const data = await getExportData(selectedClass);
      if (!data || data.length === 0) {
        toast.error("Tidak ada data siswa untuk diekspor.");
        return;
      }

      const doc = new jsPDF("landscape");
      
      // Header
      doc.setFontSize(18);
      doc.text(`Laporan Kehadiran Siswa SDN 231 Sukaasih (${selectedClass === "ALL" ? "Semua Kelas" : `Kelas 6${selectedClass}`})`, 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

      // Extract columns and rows
      const columns = Object.keys(data[0]);
      const rows = data.map(item => Object.values(item));

      // Generate Table
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 36,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Primary color (Indigo 600)
        styles: { fontSize: 9, cellPadding: 3 },
      });

      // Save PDF
      doc.save(`Laporan_Kehadiran_SDN231_Kelas_${selectedClass}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);
      toast.success("Laporan PDF berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="ALL">Semua Kelas</option>
        <option value="A">Kelas 6A</option>
        <option value="B">Kelas 6B</option>
        <option value="C">Kelas 6C</option>
      </select>

      <button 
        onClick={exportExcel}
        disabled={loading !== null}
        className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold px-4 py-2.5 rounded-xl transition-colors border border-green-200"
      >
        {loading === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        <span className="text-sm">Excel</span>
      </button>

      <button 
        onClick={exportPDF}
        disabled={loading !== null}
        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-4 py-2.5 rounded-xl transition-colors border border-red-200"
      >
        {loading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        <span className="text-sm">PDF</span>
      </button>
    </div>
  );
}
