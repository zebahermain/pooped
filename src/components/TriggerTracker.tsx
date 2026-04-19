import { TrendingDown } from "lucide-react";
import { getFoodTriggers, type PoopLog } from "@/lib/storage";

export const TriggerTracker = ({ logs }: { logs: PoopLog[] }) => {
  const triggers = getFoodTriggers(logs);
  if (triggers.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl bg-card p-4 shadow-card border border-border">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-danger/15 p-1.5">
          <TrendingDown className="h-4 w-4 text-danger" />
        </div>
        <h3 className="text-sm font-bold">Your possible triggers</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {triggers.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 text-sm font-semibold text-foreground"
          >
            <span className="text-base leading-none">{t.emoji}</span>
            <span>{t.label}</span>
            <span className="inline-flex items-center text-xs font-bold text-danger">
              <TrendingDown className="h-3 w-3" />
              {t.avgDrop}pts
            </span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Based on your last 30 logs. Not a diagnosis — talk to your doctor.
      </p>
    </div>
  );
};
