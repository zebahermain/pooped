import { useMemo } from "react";
import { getStreakData, getLogs, type PoopLog } from "@/lib/storage";
import { Check, Trophy } from "lucide-react";

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

const getDayColor = (avgScore: number | null) => {
  if (avgScore === null) return null;
  if (avgScore >= 70) return { bg: "bg-[#14532D]", text: "text-[#86EFAC]" };
  if (avgScore >= 40) return { bg: "bg-[#78350F]", text: "text-[#FCD34D]" };
  return { bg: "bg-[#451A03]", text: "text-[#FDE68A]" };
};

export const StreakStrip = () => {
  const streak = getStreakData().currentStreak;
  const logs = getLogs();
  const today = new Date();
  const todayStr = toDateStr(today);

  const weekData = useMemo(() => {
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const ds = toDateStr(d);
      const dayLogs = logs.filter(l => toDateStr(new Date(l.timestamp)) === ds);
      const avgScore = dayLogs.length 
        ? Math.round(dayLogs.reduce((s, l) => s + l.gutScore, 0) / dayLogs.length) 
        : null;
      
      days.push({
        date: ds,
        label: labels[i],
        avgScore,
        isToday: ds === todayStr,
        isFuture: ds > todayStr,
        isSunday: i === 6
      });
    }
    return days;
  }, [logs, todayStr]);

  const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : 30;
  const milestoneIcon = nextMilestone === 7 ? "🏆" : nextMilestone === 14 ? "💎" : "👑";
  
  const subtitle = streak === 0 ? "Start today 💪" : streak < 7 ? "Keep it going!" : "You're on fire 🔥";

  const loggedDaysThisWeek = weekData.filter(d => !d.isFuture && d.avgScore !== null).length;
  const isRewardEarned = weekData[6].avgScore !== null;
  
  const isFridayOrSaturday = today.getDay() === 5 || today.getDay() === 6;
  const showUrgency = isFridayOrSaturday && !isRewardEarned;

  return (
    <div className="mt-8 w-full space-y-4" data-testid="streak-redesign">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-foreground">🔥 {streak} day streak</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-full bg-muted/50 px-3 py-1 text-xs font-bold text-foreground flex items-center gap-1">
          {nextMilestone} days {milestoneIcon}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekData.map((d) => {
          const color = getDayColor(d.avgScore);
          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span className={`text-[9px] ${d.isToday ? "font-bold text-amber-500" : "text-muted-foreground"}`}>
                {d.label}
              </span>
              <div 
                className={`relative aspect-square w-full rounded-[10px] flex items-center justify-center
                  ${d.isFuture ? "bg-[#1A1A1A]" : ""}
                  ${!d.isFuture && d.avgScore === null && !d.isToday ? "bg-[#1A1A1A]" : ""}
                  ${d.isToday && d.avgScore === null ? "bg-transparent border-dashed border-[#D97706] border-2 animate-pulse" : ""}
                  ${color ? color.bg : ""}
                `}
              >
                {d.isToday && d.avgScore === null && (
                  <span className="text-sm">💩</span>
                )}
                {color && (
                  <Check className={`h-4 w-4 ${color.text}`} strokeWidth={3} />
                )}
                {d.isSunday && d.avgScore === null && !d.isFuture && !d.isToday && (
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#1C1400] border-dashed border-[#78350F] border">
                    <span className="text-sm">🎁</span>
                  </div>
                )}
                {d.isSunday && color && (
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#14532D]">
                    <Trophy className="h-4 w-4 text-[#86EFAC]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isRewardEarned ? (
        <div className="rounded-xl border border-[#15803D] bg-[#052E16] p-3 flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <p className="text-sm font-medium text-white">
            Weekly reward unlocked! +100 💩 units added
          </p>
        </div>
      ) : (
        <div className={`flex items-center gap-2 ${showUrgency ? "rounded-xl border border-[#D97706] p-1" : ""}`}>
          <div className="flex flex-1 gap-1">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={`h-[5px] flex-1 rounded-full ${i < loggedDaysThisWeek ? "bg-[#D97706]" : "bg-[#1F1208]"}`} 
              />
            ))}
          </div>
          <div className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#78350F] border border-dashed border-amber-500/50 animate-pulse">
            <span className="text-[12px]">🎁</span>
          </div>
          <div className="ml-2 text-right">
            <div className="text-[16px] font-bold text-amber-500 leading-none">+100</div>
            <div className="text-[9px] text-muted-foreground leading-none">💩 units</div>
          </div>
        </div>
      )}
    </div>
  );
};
