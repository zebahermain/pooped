interface WeeklyChartProps {
  data: { day: string; score: number }[];
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => {
  const max = 100;
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Last 7 days</h3>
        <span className="text-xs text-muted-foreground">Gut score</span>
      </div>
      <div className="flex h-32 items-end justify-between gap-2">
        {data.map((d, i) => {
          const h = d.score > 0 ? Math.max(8, (d.score / max) * 100) : 4;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className={
                    d.score > 0
                      ? "w-full rounded-t-lg gradient-warm transition-all"
                      : "w-full rounded-t-lg bg-muted transition-all"
                  }
                  style={{ height: `${h}%` }}
                />
                {d.score > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground">
                    {d.score}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
