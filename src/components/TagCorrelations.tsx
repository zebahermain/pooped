import { TrendingDown, TrendingUp } from "lucide-react";
import { getTagCorrelations, type PoopLog } from "@/lib/storage";

export const TagCorrelations = ({ logs }: { logs: PoopLog[] }) => {
  const correlations = getTagCorrelations(logs);
  const significant = correlations.filter((c) => Math.abs(c.delta) >= 3);

  if (logs.length < 3) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center">
        <span className="text-2xl">📊</span>
        <p className="mt-2 text-sm font-semibold">Insights coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Log at least 3 entries with tags to unlock pattern insights.
        </p>
      </div>
    );
  }

  if (significant.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center">
        <span className="text-2xl">🔍</span>
        <p className="mt-2 text-sm font-semibold">No clear patterns yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Keep tagging your logs to spot what affects your gut.
        </p>
      </div>
    );
  }

  const positive = significant.filter((c) => c.delta > 0).slice(0, 4);
  const negative = significant.filter((c) => c.delta < 0).slice(0, 4);

  return (
    <div className="space-y-4">
      {positive.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-card border border-border">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-success/15 p-1.5">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <h3 className="text-sm font-bold">Your gut loves</h3>
          </div>
          <div className="mt-3 space-y-2">
            {positive.map((c) => (
              <CorrelationRow key={c.tagId} c={c} positive />
            ))}
          </div>
        </div>
      )}
      {negative.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-card border border-border">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-danger/15 p-1.5">
              <TrendingDown className="h-4 w-4 text-danger" />
            </div>
            <h3 className="text-sm font-bold">Watch out for</h3>
          </div>
          <div className="mt-3 space-y-2">
            {negative.map((c) => (
              <CorrelationRow key={c.tagId} c={c} positive={false} />
            ))}
          </div>
        </div>
      )}
      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        Patterns from your own logs — not medical advice.
      </p>
    </div>
  );
};

const CorrelationRow = ({
  c,
  positive,
}: {
  c: ReturnType<typeof getTagCorrelations>[number];
  positive: boolean;
}) => (
  <div className="flex items-center gap-3">
    <span className="text-xl">{c.emoji}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{c.label}</span>
        <span
          className={`text-sm font-bold ${
            positive ? "text-success" : "text-danger"
          }`}
        >
          {c.delta > 0 ? "+" : ""}
          {c.delta} pts
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        avg {c.avgWithTag} when tagged · {c.count} {c.count === 1 ? "log" : "logs"}
      </div>
    </div>
  </div>
);
