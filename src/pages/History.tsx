import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TagCorrelations } from "@/components/TagCorrelations";
import {
  BRISTOL_META,
  COLOR_META,
  getLogs,
  getTagMeta,
  type PoopLog,
} from "@/lib/storage";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const scoreColor = (s: number) =>
  s >= 70 ? "text-success" : s >= 40 ? "text-warning" : "text-danger";

type Tab = "logs" | "insights";

const History = () => {
  const [logs, setLogs] = useState<PoopLog[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("logs");

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  return (
    <AppShell>
      <header className="mb-4 pr-14">
        <p className="text-sm text-muted-foreground">Your journey</p>
        <h1 className="text-2xl font-bold">History</h1>
      </header>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-2xl bg-muted p-1">
        {(["logs", "insights"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-bounce ${
              tab === t
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground"
            }`}
          >
            {t === "logs" ? "📋 Logs" : "✨ Insights"}
          </button>
        ))}
      </div>

      {tab === "insights" ? (
        <TagCorrelations logs={logs} />
      ) : logs.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <span className="text-6xl">📭</span>
          <h2 className="mt-4 text-lg font-semibold">No logs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap "Log" to record your first one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => {
            const open = openId === log.id;
            const meta = COLOR_META[log.color];
            const bristol = BRISTOL_META[log.bristolType];
            return (
              <button
                key={log.id}
                onClick={() => setOpenId(open ? null : log.id)}
                className="rounded-2xl bg-card p-4 text-left shadow-card border border-border transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: meta.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{formatDate(log.timestamp)}</span>
                      <span className={`text-lg font-bold ${scoreColor(log.gutScore)}`}>
                        {log.gutScore}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">
                        Type {log.bristolType}
                      </span>
                      <span>•</span>
                      <span>{meta.short}</span>
                      <span>•</span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                    {log.tags && log.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {log.tags.slice(0, 4).map((id) => {
                          const t = getTagMeta(id);
                          if (!t) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                            >
                              <span>{t.emoji}</span>
                              <span>{t.label}</span>
                            </span>
                          );
                        })}
                        {log.tags.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{log.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {open && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                    <Row label="Bristol">
                      Type {log.bristolType} — {bristol.label}
                    </Row>
                    <Row label="Color">{meta.label}</Row>
                    <Row label="Frequency">#{log.frequency} of the day</Row>
                    {log.tags && log.tags.length > 0 && (
                      <Row label="Tags">
                        {log.tags
                          .map((id) => getTagMeta(id)?.label)
                          .filter(Boolean)
                          .join(", ")}
                      </Row>
                    )}
                    {log.notes && <Row label="Notes">{log.notes}</Row>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{children}</span>
  </div>
);

export default History;
