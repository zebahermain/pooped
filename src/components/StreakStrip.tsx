import { useMemo } from "react";
import { getStreakData, getLogs } from "@/lib/storage";
import { Flame, Trophy } from "lucide-react";

const toDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StreakStrip = () => {
  const streak = getStreakData().currentStreak;
  const logs = getLogs();
  const today = new Date();
  const todayStr = toDateStr(today);

  const weekData = useMemo(() => {
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - (day === 0 ? 6 : day - 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const ds = toDateStr(d);
      const dayLogs = logs.filter(l => toDateStr(new Date(l.timestamp)) === ds);
      
      days.push({
        date: ds,
        label: labels[i],
        hasLog: dayLogs.length > 0,
        isToday: ds === todayStr,
        isFuture: ds > todayStr,
      });
    }
    return days;
  }, [logs, todayStr]);

  const loggedDaysThisWeek = weekData.filter(d => d.hasLog).length;
  const progressPct = Math.min(100, (loggedDaysThisWeek / 7) * 100);

  return (
    <section className="mt-8 rounded-[32px] border border-border bg-card p-6 relative overflow-hidden shadow-sm">
      <div
        className="absolute -top-16 -right-16 size-48 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--gradient-primary)" }}
      />
      
      <div className="relative flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-primary" fill="currentColor" />
            <span className="text-xl font-black tracking-tight">
              {streak} day streak
            </span>
          </div>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            Keep the fire burning
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-[10px] font-black uppercase tracking-wider text-foreground">
          <Trophy className="size-3.5 text-primary" />
          7 days
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekData.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${d.isToday ? "text-primary" : "text-muted-foreground/60"}`}>
              {d.label}
            </span>
            <div
              className={`size-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                d.hasLog
                  ? "bg-emerald-500 text-white"
                  : d.isToday
                    ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "border border-dashed border-border text-muted-foreground/20"
              }`}
              style={
                d.isToday && !d.hasLog
                  ? { background: "var(--gradient-primary)" }
                  : undefined
              }
            >
              {d.hasLog ? "✓" : d.isToday ? "•" : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          />
        </div>
        <div className="flex items-center gap-1 text-sm font-black text-primary whitespace-nowrap">
          💩 +100
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-0.5">
            units
          </span>
        </div>
      </div>
    </section>
  );
};
