"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Megaphone } from "lucide-react";
import StudentForm from "./StudentForm";
import EditAdminModal from "@/components/EditAdminModal";
import ManageAnnouncementsModal from "@/components/ManageAnnouncementsModal";

export default function AdminHeader({ admin, announcements = [] }: { admin: any, announcements?: any[] }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-text-header">Dashboard Admin</h1>
          <div className="flex gap-1">
            <button 
              onClick={() => setIsEditOpen(true)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-colors"
              title="Pengaturan Admin"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsAnnouncementOpen(true)}
              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
              title="Kelola Pengumuman"
            >
              <Megaphone className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-text-body text-sm mt-1">Halo, {admin?.name || admin?.username || 'Admin'}</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <StudentForm />
        <Link href="/admin/scanner" className="btn-primary bg-gray-800 hover:bg-gray-900">
          Buka Scanner
        </Link>
      </div>

      {isEditOpen && admin && (
        <EditAdminModal admin={admin} onClose={() => setIsEditOpen(false)} />
      )}

      {isAnnouncementOpen && (
        <ManageAnnouncementsModal announcements={announcements} onClose={() => setIsAnnouncementOpen(false)} />
      )}
    </div>
  );
}
