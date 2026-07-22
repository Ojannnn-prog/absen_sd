"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

type ChartData = {
  date: string;
  fullDate: string;
  hadir: number;
};

export default function AttendanceChart({ data }: { data: ChartData[] }) {
  // Jika tidak ada data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
        <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Belum ada data kehadiran bulan ini.</p>
      </div>
    );
  }

  // Hitung total hadir bulan ini
  const totalHadir = data.reduce((acc, curr) => acc + curr.hadir, 0);

  // Kustomisasi Tooltip saat mouse diarahkan ke grafik
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-1">{payload[0].payload.fullDate}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <p className="text-sm font-medium text-gray-600">
              Hadir: <span className="text-primary font-bold">{payload[0].value}</span> Siswa
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-text-header">Grafik Kehadiran</h2>
          <p className="text-sm text-gray-500 mt-1">Total kehadiran siswa sepanjang bulan ini.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-2xl text-right">
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Bulan Ini</p>
          <p className="text-2xl font-black text-primary leading-none mt-1">{totalHadir}</p>
        </div>
      </div>

      <div className="w-full h-[350px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="hadir" 
              stroke="#4F46E5" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHadir)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#4F46E5' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
