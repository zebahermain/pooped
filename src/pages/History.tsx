import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getLogs, type PoopLog } from "@/lib/storage";

const colorHex: Record<string, string> = {
  brown: "#7B4A1E",
  yellow: "#D4A53A",
  green: "#5C8A3A",
  black: "#2A1F1A",
  red: "#A23B2C",
  pale: "#C9BBA8",
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const scoreColor = (s: number) =>
  s >= 70 ? "text-success" : s >= 40 ? "text-warning" : "text-danger";

const History = () => {
  const [logs, setLogs] = useState<PoopLog[]>([]);

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  return (
    <AppShell>
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">Your journey</p>
        <h1 className="text-2xl font-bold">History</h1>
      </header>

      {logs.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <span className="text-6xl">📭</span>
          <h2 className="mt-4 text-lg font-semibold">No logs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap "Log" to record your first one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card"
            >
              <div
                className="h-12 w-12 shrink-0 rounded-full shadow-soft"
                style={{ backgroundColor: colorHex[log.color] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{formatDate(log.timestamp)}</span>
                  <span className={`text-lg font-bold ${scoreColor(log.score)}`}>
                    {log.score}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Type {log.bristolType}</span>
                  <span>•</span>
                  <span className="capitalize">{log.color}</span>
                  <span>•</span>
                  <span>{formatTime(log.timestamp)}</span>
                </div>
                {log.notes && (
                  <p className="mt-2 truncate text-xs italic text-muted-foreground">
                    "{log.notes}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default History;
