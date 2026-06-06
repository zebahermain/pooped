import { useMemo } from "react";
import { getStreakData, getLogs } from "@/lib/storage";
import { Flame, Trophy } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");
const dateToStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const StreakCard = () => {
  const { currentStreak, longestStreak, paused } = getStreakData();
  const logs = getLogs();

  const today = new Date();
  const todayStr = dateToStr(today);

  const weekDays = useMemo(() => {
    // Anchor to Monday of the current ISO week
    const startOfWeek = new Date(today);
    const dow = today.getDay(); // 0=Sun, 1=Mon…
    const diff = dow === 0 ? -6 : 1 - dow;
    startOfWeek.setDate(today.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const shortLabels = ["M", "T", "W", "T", "F", "S", "S"];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const ds = dateToStr(d);

      const dayLogs = logs.filter(
        (l) => dateToStr(new Date(l.timestamp)) === ds
      );
      const hasLogs = dayLogs.length > 0;
      // No-movement day: logged but every entry is a no-movement entry
      const isNoMovement = hasLogs && dayLogs.every((l) => l.noMovement === true);
      const isLogged = hasLogs && !isNoMovement;
      const isToday = ds === todayStr;
      const isFuture = ds > todayStr;

      return { date: ds, label: shortLabels[i], isLogged, isNoMovement, isToday, isFuture };
    });
  }, [logs, todayStr]);

  // Headline + subtitle
  let headline: string;
  let subtitle: string;
  let headlineIcon: React.ReactNode;

  if (paused) {
    headline = "Streak paused";
    subtitle = "Log a movement to get back on track.";
    headlineIcon = <span className="text-base leading-none">⏸</span>;
  } else if (currentStreak > 0) {
    headline = `${currentStreak} day${currentStreak !== 1 ? "s" : ""} in a row`;
    subtitle =
      currentStreak >= 7
        ? "You're on fire! Keep the momentum going."
        : "Keep it up — log today to extend your streak.";
    headlineIcon = <Flame className="size-5 text-primary" fill="currentColor" />;
  } else {
    headline = "Start your streak";
    subtitle = "Log your first poop to begin.";
    headlineIcon = <span className="text-base leading-none">🚀</span>;
  }

  return (
    <section
      className="mt-8 rounded-[32px] border border-border bg-card p-6 relative overflow-hidden shadow-sm"
      data-testid="streak-card"
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-16 -right-16 size-48 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--gradient-primary)" }}
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            {headlineIcon}
            <span className="text-xl font-black tracking-tight">{headline}</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-1 leading-snug">
            {subtitle}
          </p>
        </div>

        {/* Best streak chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-[10px] font-black uppercase tracking-wider text-foreground shrink-0">
          <Trophy className="size-3.5 text-primary" />
          Best {longestStreak > 0 ? longestStreak : "—"}
        </div>
      </div>

      {/* 7-day Mon–Sun strip */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          const base =
            "size-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all";

          let dotClass = "";
          let dotStyle: React.CSSProperties | undefined;
          let content: React.ReactNode = null;

          if (d.isLogged) {
            dotClass = "text-white";
            dotStyle = {
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-glow)",
            };
            content = "✓";
          } else if (d.isNoMovement) {
            dotClass =
              "bg-amber-500/15 text-amber-500 border border-amber-500/40";
            content = "—";
          } else if (d.isFuture) {
            dotClass =
              "border border-dashed border-border/50 text-muted-foreground/20";
          } else if (d.isToday) {
            // Today, not yet logged
            dotClass = "text-muted-foreground/60";
          } else {
            // Past, no log
            dotClass =
              "border border-dashed border-border/40 text-muted-foreground/20";
          }

          // Today always gets a ring regardless of log state
          const ringClass = d.isToday
            ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
            : "";

          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[9px] font-black uppercase tracking-wider ${
                  d.isToday ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                {d.label}
              </span>
              <div
                className={`${base} ${dotClass} ${ringClass}`}
                style={dotStyle}
              >
                {content}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
