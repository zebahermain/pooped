interface WeeklyChartProps {
  data: { day: string; score: number }[];
}

const barColor = (score: number) => {
  if (score === 0) return "bg-muted";
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  if (score >= 40) return "bg-accent";
  return "bg-danger";
};

export const WeeklyChart = ({ data }: WeeklyChartProps) => {
  const max = 100;
  const scored = data.filter((d) => d.score > 0);
  const avg =
    scored.length > 0
      ? Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length)
      : 0;
  const todayIdx = data.length - 1;

  return (
    <div className="rounded-3xl bg-card p-5 shadow-card border border-border/50">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Last 7 days</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {scored.length > 0 ? `${scored.length}/7 days tracked` : "Start logging to see trends"}
          </p>
        </div>
        {avg > 0 && (
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Avg
            </div>
            <div className="text-xl font-bold leading-none text-foreground">
              {avg}
              <span className="text-xs font-medium text-muted-foreground">/100</span>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Average line */}
        {avg > 0 && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10 border-t border-dashed border-foreground/25"
            style={{ bottom: `${(avg / max) * 100}%` }}
          >
            <span className="absolute -top-2 right-0 rounded-full bg-foreground/80 px-1.5 py-0.5 text-[9px] font-bold text-background">
              avg
            </span>
          </div>
        )}

        <div className="flex h-36 items-end justify-between gap-2">
          {data.map((d, i) => {
            const h = d.score > 0 ? Math.max(6, (d.score / max) * 100) : 4;
            const isToday = i === todayIdx;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${barColor(d.score)} ${
                      d.score > 0 ? "shadow-sm" : ""
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  {d.score > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground">
                      {d.score}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    isToday
                      ? "rounded-full bg-primary px-2 py-0.5 text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {isToday ? "Today" : d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 border-t border-border/50 pt-3 text-[10px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-success" /> 80+
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-warning" /> 60+
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" /> 40+
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-danger" /> &lt;40
        </span>
      </div>
    </div>
  );
};
