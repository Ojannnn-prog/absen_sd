"use client";

import { useEffect, useState } from "react";
import { Crown, Trophy } from "lucide-react";

interface LeaderboardStudent {
  id: string;
  name: string;
  profileImage: string | null;
  activeTitle: string | null;
  avatarConfig: string | null;
  totalScore: number;
}

export default function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-2xl w-full"></div>;
  }

  return (
    <div className="card-soft p-6 md:p-8 bg-white border-2 border-yellow-400/20 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 opacity-5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Top Global Server</h2>
      </div>

      <div className="flex flex-col gap-3">
        {leaderboard.map((student, index) => {
          const isTop3 = index < 3;
          
          let rankColor = "text-gray-500";
          let bgClass = "bg-white border-gray-100";
          let crownColor = "";
          let rankLabel = "";
          
          if (index === 0) {
            rankColor = "text-yellow-500";
            bgClass = "bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-sm";
            crownColor = "text-yellow-500";
            rankLabel = "Peringkat #1";
          } else if (index === 1) {
            rankColor = "text-slate-400";
            bgClass = "bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-sm";
            crownColor = "text-slate-400";
            rankLabel = "Peringkat #2";
          } else if (index === 2) {
            rankColor = "text-amber-600";
            bgClass = "bg-gradient-to-r from-amber-50 to-white border-amber-200 shadow-sm";
            crownColor = "text-amber-600";
            rankLabel = "Peringkat #3";
          }

          // Avatar Logic
          const encodedName = encodeURIComponent(student.name);
          let avatarUrl = student.profileImage || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodedName}&backgroundColor=e0f2fe`;

          // Custom Avatar Config
          if (student.avatarConfig) {
             avatarUrl = student.avatarConfig;
          }

          return (
            <div key={student.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${bgClass}`}>
              <div className={`font-black text-xl w-8 text-center ${isTop3 ? rankColor + " text-3xl" : "text-gray-400"}`}>
                #{index + 1}
              </div>
              
              <div className="relative shrink-0">
                <img src={avatarUrl} alt={student.name} className={`w-14 h-14 rounded-2xl object-cover ${isTop3 ? 'border-2 border-current ' + rankColor : 'border border-gray-200'}`} />
                {isTop3 && (
                  <div className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-sm">
                    <Crown className={`w-5 h-5 ${crownColor}`} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-bold truncate ${isTop3 ? 'text-gray-900 text-lg' : 'text-gray-700'}`}>
                    {student.name}
                  </h3>
                  {isTop3 && <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${rankColor} bg-white shrink-0`}>{rankLabel}</span>}
                </div>
                {student.activeTitle && (
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5 truncate">
                    {student.activeTitle}
                  </div>
                )}
              </div>
              
              <div className="text-right shrink-0">
                <div className="font-black text-2xl text-gray-900 leading-none">{student.totalScore}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Poin</div>
              </div>
            </div>
          );
        })}
        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-500 font-medium">Belum ada data peringkat.</div>
        )}
      </div>
    </div>
  );
}
