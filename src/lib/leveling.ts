export interface LevelInfo {
  level: number;
  title: string;
  borderColor: string;
  badgeColor: string;
}

export function getLevelInfo(totalScore: number): LevelInfo {
  const level = Math.floor(totalScore / 5) + 1;
  
  if (level === 1) {
    return {
      level,
      title: "Bronze",
      borderColor: "border-amber-700",
      badgeColor: "bg-amber-700 text-white"
    };
  } else if (level === 2) {
    return {
      level,
      title: "Silver",
      borderColor: "border-slate-400",
      badgeColor: "bg-slate-400 text-white"
    };
  } else if (level === 3) {
    return {
      level,
      title: "Gold",
      borderColor: "border-yellow-400",
      badgeColor: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    };
  } else if (level === 4) {
    return {
      level,
      title: "Platinum",
      borderColor: "border-cyan-400",
      badgeColor: "bg-gradient-to-r from-cyan-400 to-blue-500 text-white"
    };
  } else if (level === 5) {
    return {
      level,
      title: "Diamond",
      borderColor: "border-purple-500",
      badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
    };
  } else {
    return {
      level,
      title: "Mythic",
      borderColor: "border-red-500",
      badgeColor: "bg-gradient-to-r from-red-500 to-orange-500 text-white"
    };
  }
}
