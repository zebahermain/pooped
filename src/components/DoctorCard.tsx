import { Button } from "@/components/ui/button";
import { BRISTOL_META, COLOR_META, getLogs, isAlertColor, type PoopLog } from "@/lib/storage";

const needsAttention = (logs: PoopLog[]) => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last5 = logs.filter((l) => now - l.timestamp <= 5 * day);
  const last3 = logs.filter((l) => now - l.timestamp <= 3 * day);
  const avg5 =
    last5.length > 0 ? last5.reduce((s, l) => s + l.gutScore, 0) / last5.length : 100;
  const hasAlert = last3.some((l) => isAlertColor(l.color));
  return avg5 < 55 || hasAlert;
};

const buildExport = (logs: PoopLog[]) => {
  const recent = logs.slice(0, 30);
  const lines = [
    "Pooped — Gut log export",
    `Generated: ${new Date().toLocaleString()}`,
    `Entries: ${recent.length}`,
    "",
    "─".repeat(40),
    "",
  ];
  for (const l of recent) {
    const d = new Date(l.timestamp).toLocaleString();
    const b = BRISTOL_META[l.bristolType];
    const c = COLOR_META[l.color];
    lines.push(`Date:      ${d}`);
    lines.push(`Bristol:   Type ${l.bristolType} — ${b?.label ?? ""}`);
    lines.push(`Color:     ${c?.short ?? l.color}`);
    lines.push(`Gut Score: ${l.gutScore}/100`);
    lines.push(`#Today:    ${l.frequency}`);
    if (l.tags?.length) lines.push(`Tags:      ${l.tags.join(", ")}`);
    if (l.notes) lines.push(`Notes:     ${l.notes}`);
    lines.push("");
  }
  return lines.join("\n");
};

export const DoctorCard = () => {
  const logs = getLogs();
  const concern = needsAttention(logs);

  const handleExport = () => {
    const text = buildExport(logs);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pooped-log.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`mt-6 rounded-3xl border p-5 shadow-card ${
        concern
          ? "border-warning/40 bg-warning/5"
          : "border-success/30 bg-success/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none">🩺</div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            Talk to a gut specialist
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {concern
              ? "Your recent logs suggest it might be worth a check-up"
              : "Your gut looks healthy — keep the streak going 💚"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="soft"
          size="sm"
          asChild
          className="rounded-xl"
        >
          <a
            href="https://www.google.com/maps/search/gastroenterologist+near+me"
            target="_blank"
            rel="noopener noreferrer"
          >
            Find a doctor near me
          </a>
        </Button>
        <Button
          variant="soft"
          size="sm"
          onClick={handleExport}
          className="rounded-xl"
          disabled={logs.length === 0}
        >
          Export my logs for a doctor
        </Button>
      </div>
    </div>
  );
};
