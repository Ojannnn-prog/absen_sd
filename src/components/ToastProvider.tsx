"use client";

import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";

export default function ToastProvider() {
  return (
    <Toaster 
      position="top-center" 
      toastOptions={{
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
        }
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              {t.type !== 'loading' && (
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
