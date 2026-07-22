"use client";

import { useState } from "react";
import StudentCard from "./StudentCard";
import { Search } from "lucide-react";

export default function StudentList({ initialStudents }: { initialStudents: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = initialStudents.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.studentCode.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Cari nama atau nomor absen siswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
        />
      </div>

      {/* Grid Siswa */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          {searchQuery ? (
            <span>Siswa dengan kata kunci <b>"{searchQuery}"</b> tidak ditemukan.</span>
          ) : (
            <span>Belum ada data siswa.</span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
