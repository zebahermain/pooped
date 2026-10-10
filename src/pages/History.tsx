import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getLogs, type PoopLog } from "@/lib/storage";

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

const History = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<PoopLog[]>([]);

  useEffect(() => {
    setLogs(getLogs().filter((l) => !l.noMovement));
  }, []);

  return (
    <AppShell>
      <header className="mb-6 pr-14">
        <button
          onClick={() => navigate("/profile")}
          className="mb-2 -ml-1 flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Profile
        </button>
        <p className="text-sm text-muted-foreground">Your journey</p>
        <h1 className="text-2xl font-bold">History</h1>
      </header>

      {logs.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <span className="text-6xl">📭</span>
          <h2 className="mt-4 text-lg font-semibold">No logs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap "I pooped today" on Home to log your first one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card border border-border"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
                💩
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{formatDate(log.timestamp)}</span>
                <div className="mt-1 text-xs text-muted-foreground">
                  Pooped • {formatTime(log.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default History;
