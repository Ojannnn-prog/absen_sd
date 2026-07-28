"use client";

import { useState } from "react";
import { Upload, X, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { importTeacherStudentsBulk } from "@/app/teacher/student/actions";

interface Props {
  classGroup: string;
  onImportSuccess?: () => void;
}

export default function TeacherImportStudentsModal({ classGroup, onImportSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Nama Siswa", "Tempat Lahir", "Tanggal Lahir", "Jenis Kelamin (L/P)", "Kelas (A/B/C)"],
      ["Budi Santoso", "Bandung", "2015-08-17", "L", classGroup],
      ["Siti Aminah", "Jakarta", "2016-01-20", "P", classGroup],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(wb, ws, `Template_Kelas_6${classGroup}`);
    XLSX.writeFile(wb, `Template_Import_Siswa_Kelas_6${classGroup}.xlsx`);
    toast.success(`Template Excel Kelas 6${classGroup} berhasil diunduh`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const rows = jsonData.slice(1).filter((row: any) => row.length > 0 && row[0]);
        
        if (rows.length === 0) {
          throw new Error("File Excel kosong atau format tidak sesuai");
        }

        const parseExcelDate = (dateValue: any) => {
          if (!dateValue) return null;
          if (typeof dateValue === 'number') {
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            return date.toISOString();
          }
          if (typeof dateValue === 'string') {
            const str = dateValue.trim();
            const parts = str.split(/[\/\-]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                if (!isNaN(d.getTime())) return d.toISOString();
              } else if (parts[2].length === 4) {
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(d.getTime())) return d.toISOString();
              }
            }
            const d = new Date(str);
            if (!isNaN(d.getTime())) return d.toISOString();
          }
          return null;
        };

        const studentsToImport = rows.map((row: any) => ({
          name: String(row[0] || "").trim(),
          birthPlace: row[1] ? String(row[1]).trim() : "",
          birthDate: parseExcelDate(row[2]),
          gender: String(row[3] || "L").trim().toUpperCase(),
        }));

        const result = await importTeacherStudentsBulk(studentsToImport, classGroup);
        
        if (result.success) {
          toast.success(`${result.count} siswa berhasil diimpor ke Kelas 6${classGroup}! Password default: 231Sukaasih`, { duration: 5000 });
          setIsOpen(false);
          if (onImportSuccess) onImportSuccess();
        } else {
          toast.error(result.message || "Gagal mengimpor data");
        }
      } catch (error: any) {
        toast.error("Gagal mengimpor data: " + error.message);
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-sm transition-all flex items-center gap-2 border border-emerald-200"
      >
        <Upload className="w-4 h-4" />
        <span>Import (6{classGroup})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Import Siswa Kelas 6{classGroup} (Excel)</h3>
                  <p className="text-sm text-gray-500">Unggah data siswa khusus kelas Anda sekaligus</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm">
                  <span className="font-bold text-amber-900 block">1. Unduh Template Resmi</span>
                  <span className="text-amber-700">Pastikan urutan kolom sesuai standar Kelas 6{classGroup}.</span>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Template Excel
                </button>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-gray-900 text-sm block">2. Unggah File Excel (.xlsx)</span>
                <label className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50/50 hover:bg-emerald-50/20 transition-all group">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <span className="text-sm font-semibold text-gray-600">Memproses data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-white shadow-sm rounded-full text-gray-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-gray-700 block">Klik untuk memilih file excel</span>
                        <span className="text-xs text-gray-400">Atau seret dan lepas file .xlsx di sini</span>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                <strong>Catatan:</strong> Seluruh siswa yang diimpor melalui menu ini akan otomatis ditempatkan ke <strong>Kelas 6{classGroup}</strong>. Password default siswa: <strong>231Sukaasih</strong>.
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
