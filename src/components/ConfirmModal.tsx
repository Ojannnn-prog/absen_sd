"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-500/15 text-red-600 border border-red-500/20 shadow-inner",
          icon: <Trash2 className="w-7 h-7" />,
          btn: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/30",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/15 text-amber-600 border border-amber-500/20 shadow-inner",
          icon: <AlertTriangle className="w-7 h-7" />,
          btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30",
        };
      case "info":
        return {
          iconBg: "bg-indigo-500/15 text-indigo-600 border border-indigo-500/20 shadow-inner",
          icon: <AlertCircle className="w-7 h-7" />,
          btn: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative p-6 text-center flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Badge */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${styles.iconBg}`}>
          {styles.icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
          {title}
        </h3>

        {/* Message */}
        <div className="text-gray-600 text-sm mb-6 leading-relaxed">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 font-bold rounded-xl transition-all cursor-pointer border border-gray-200/50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${styles.btn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
