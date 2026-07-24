import { getAvatarUrl } from "@/lib/avatar";
import { getLevelInfo } from "@/lib/leveling";

interface Props {
  student: {
    name: string;
    profileImage: string | null;
    avatarConfig: string | null;
    gender: string | null;
  };
  totalScore: number;
  className?: string; // Additional classes for sizing
}

export default function AvatarFrame({ student, totalScore, className = "w-14 h-14" }: Props) {
  const avatarUrl = getAvatarUrl(
    student.avatarConfig,
    student.profileImage,
    student.name,
    student.gender
  );
  
  const levelInfo = getLevelInfo(totalScore);

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      <div className={`w-full h-full rounded-2xl overflow-hidden border-[3px] bg-white shadow-sm flex items-center justify-center ${levelInfo.borderColor}`}>
        <img 
          src={avatarUrl} 
          alt={student.name} 
          className="w-full h-full object-cover" 
        />
      </div>
      
      {/* Level Badge */}
      <div className={`absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border border-white/50 z-10 ${levelInfo.badgeColor}`}>
        Lv.{levelInfo.level}
      </div>
    </div>
  );
}
