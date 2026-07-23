"use client";

import { useState } from "react";
import { Upload, X, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { importStudentsBulk } from "@/app/admin/actions";

export default function ImportStudentsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownloadTemplate = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    // Headers matching our expected format
    const wsData = [
      ["Nama Siswa", "Tempat Lahir", "Tanggal Lahir", "Jenis Kelamin (L/P)"],
      ["Budi Santoso", "Jakarta", "2015-08-17", "L"],
      ["Siti Aminah", "Bandung", "2016-01-20", "P"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths for better readability
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    
    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa_SDN231.xlsx");
    toast.success("Template Excel berhasil diunduh");
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
        
        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and filter out empty rows
        const rows = jsonData.slice(1).filter((row: any) => row.length > 0 && row[0]);
        
        if (rows.length === 0) {
          throw new Error("File Excel kosong atau format tidak sesuai");
        }

        // Helper function to safely parse Excel dates or string dates
        const parseExcelDate = (dateValue: any) => {
          if (!dateValue) return null;
          
          // Jika dateValue adalah angka (Excel Serial Date)
          if (typeof dateValue === 'number') {
            // Excel counts days since Dec 30, 1899
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            return date.toISOString();
          }
          
          // Jika dateValue adalah string
          if (typeof dateValue === 'string') {
            const str = dateValue.trim();
            // Cek format DD/MM/YYYY atau DD-MM-YYYY
            const parts = str.split(/[\/\-]/);
            if (parts.length === 3) {
              // Jika tahun di depan (YYYY-MM-DD)
              if (parts[0].length === 4) {
                const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
                if (!isNaN(d.getTime())) return d.toISOString();
              } 
              // Jika hari di depan (DD-MM-YYYY)
              else if (parts[2].length === 4) {
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(d.getTime())) return d.toISOString();
              }
            }
            // Fallback JS date parser
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

        const result = await importStudentsBulk(studentsToImport);
        
        if (result.success) {
          toast.success(`${result.count} data siswa berhasil diimpor! Password default: 231Sukaasih`, { duration: 5000 });
          setIsOpen(false);
        }
      } catch (error: any) {
        toast.error("Gagal mengimpor data: " + error.message);
      } finally {
        setIsUploading(false);
        // Reset file input
        e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Upload className="w-5 h-5" />
        <span className="hidden sm:inline">Import Data</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                Import Data Siswa
              </h3>
              <button 
                onClick={() => !isUploading && setIsOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-red-50"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <h4 className="font-semibold text-blue-900 mb-2">Langkah-langkah:</h4>
                <ol className="list-decimal list-inside text-sm text-blue-800/80 space-y-2">
                  <li>Unduh template Excel yang telah disediakan.</li>
                  <li>Isi data siswa pada file Excel tersebut.</li>
                  <li>Unggah kembali file Excel yang sudah diisi ke sini.</li>
                </ol>
                <button 
                  onClick={handleDownloadTemplate}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Format Excel
                </button>
              </div>

              <div className="relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors
                  ${isUploading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-gray-50 group-hover:border-primary group-hover:bg-blue-50/30'}`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                      <p className="text-sm font-semibold text-gray-900">Memproses Data...</p>
                      <p className="text-xs text-gray-500 mt-1">Mohon jangan tutup halaman ini</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mb-3 group-hover:text-primary transition-colors" />
                      <p className="text-sm font-semibold text-gray-900">Klik atau seret file Excel ke sini</p>
                      <p className="text-xs text-gray-500 mt-1">Mendukung file .xlsx atau .csv</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2">
                <p className="text-xs text-yellow-800">
                  <span className="font-bold">Info:</span> Semua siswa yang diimpor akan mendapatkan password bawaan: <code className="font-mono font-bold bg-yellow-100 px-1 rounded">231Sukaasih</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
