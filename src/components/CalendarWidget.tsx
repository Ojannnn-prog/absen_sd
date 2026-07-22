"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";

export default function CalendarWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div className="card-soft-sm p-6 h-32 animate-pulse bg-gray-100"></div>;
  }

  return (
    <div className="card-soft-sm p-6 flex flex-col gap-4 bg-gradient-to-br from-white to-blue-50/30">
      <h2 className="text-lg font-bold text-text-header flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        Waktu Sekarang
      </h2>
      
      <div className="flex flex-col gap-1">
        <div className="text-3xl font-extrabold text-primary tracking-tight flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary/70" />
          {format(time, "HH:mm:ss", { locale: id })}
        </div>
        <div className="text-sm font-medium text-text-body mt-1 uppercase tracking-wide">
          {format(time, "EEEE, dd MMMM yyyy", { locale: id })}
        </div>
      </div>
    </div>
  );
}
