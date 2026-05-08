import { useEffect, useMemo, useState, useRef } from "react";
import { Copy, Share2, ArrowLeft, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import {
  buildSplatUrl,
  buildWhatsAppLink,
  createSplat,
  drainReservoir,
  getGrade,
  type DeliveryStyle,
  type ShareMethod,
  type Splat,
} from "@/lib/splats";
import { getRandomShareText } from "@/lib/shareMessages";
import { getProfile } from "@/lib/storage";
import { getCompletionForDate, acknowledgeCompletion } from "@/lib/challenges";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservoirUnits: number;
  onSent: () => void;
  prefillRecipient?: string;
}

type Stage = "pick" | "share";

type Stop = { pct: number; emoji: string; label: string; vibe: string; style: DeliveryStyle };

const MIN_UNITS = 20;

// The 5 visual intensity levels
const ALL_STOPS: Stop[] = [
  { pct: 0, emoji: "💧", label: "Drip", vibe: "just a tickle", style: "drip" },
  { pct: 0.25, emoji: "💨", label: "Puff", vibe: "warming up", style: "puff" },
  { pct: 0.5, emoji: "🌋", label: "Eruption", vibe: "this is gonna hurt", style: "eruption" },
  { pct: 0.75, emoji: "⚡", label: "Overload", vibe: "full carnage", style: "overload" },
  { pct: 1, emoji: "☠️", label: "Apocalypse", vibe: "they're done", style: "apocalypse" },
];

export const SendSheet = ({
  open,
  onOpenChange,
  reservoirUnits,
  onSent,
}: Props) => {
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [stage, setStage] = useState<Stage>("pick");
  const [units, setUnits] = useState<number>(Math.max(MIN_UNITS, Math.round(reservoirUnits * 0.4)));
  const [launching, setLaunching] = useState(false);
  const [resultSplat, setResultSplat] = useState<Splat | null>(null);
  const [sharing, setSharing] = useState(false);

  const displayPct = useMemo(() => {
    const range = reservoirUnits - MIN_UNITS;
    return range > 0 ? (units - MIN_UNITS) / range : 0;
  }, [units, reservoirUnits]);

  const currentStop = useMemo(() => {
    return [...ALL_STOPS].reverse().find((s) => displayPct >= s.pct - 0.01) ?? ALL_STOPS[0];
  }, [displayPct]);

  useEffect(() => {
    if (!open) {
      setStage("pick");
      setUnits(Math.max(MIN_UNITS, Math.round(reservoirUnits * 0.4)));
      setLaunching(false);
      setResultSplat(null);
      setSharing(false);
    }
  }, [open, reservoirUnits]);

  const profile = useMemo(() => getProfile(), []);
  const resolvedSenderName = profile?.name || "Friend";

  const handleLaunch = async () => {
    if (launching) return;
    setLaunching(true);
    try {
      const splat = await createSplat({
        recipient_name: "Friend",
        units: units,
        style: currentStop.style,
      });
      await drainReservoir(units);
      setResultSplat(splat);

      const completion = getCompletionForDate();
      if (completion && !completion.acknowledged) {
        await acknowledgeCompletion(completion.date);
      }

      setStage("share");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send your splat.";
      toast({ title: "Launch failed", description: msg, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  const handleSharePick = async (method: ShareMethod) => {
    if (!resultSplat || sharing) return;
    setSharing(true);

    const fullUrl = buildSplatUrl(resultSplat.id);
    const shortId = resultSplat.id.substring(0, 8);
    const shortUrl = `${window.location.origin}/splat/${shortId}`;
    const grade = getGrade(resultSplat.units);
    
    const text = getRandomShareText({
      sender: resolvedSenderName,
      units: resultSplat.units,
      grade,
      splatUrl: shortUrl,
    });

    if (method === "copy") {
      await navigator.clipboard?.writeText(fullUrl).catch(() => {});
      toast({ title: "Link copied!", description: "Paste it anywhere 😈" });
    } else if (method === "whatsapp") {
      window.open(buildWhatsAppLink(text), "_blank", "noopener,noreferrer");
    } else if (method === "share") {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Pooped!", text, url: fullUrl });
        } catch (err) {}
      } else {
        await navigator.clipboard?.writeText(fullUrl).catch(() => {});
        toast({ title: "Link copied!", description: "Sharing not supported, link copied instead." });
      }
    }

    onSent();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-[32px] border-border bg-background p-0"
        data-testid="send-sheet"
      >
        <div className="mx-auto max-w-md px-5 pt-8 pb-10">
          {stage === "pick" ? (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground">How much? 💩</h1>
                  <p className="text-sm text-muted-foreground mt-1.5 font-medium">
                    Stock <span className="text-foreground font-black">{reservoirUnits}</span> · {getGrade(reservoirUnits)} grade
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="size-10 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:bg-accent/40 transition-colors"
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </button>
              </header>

              <ScalePicker 
                units={units} 
                setUnits={setUnits} 
                stock={reservoirUnits} 
                currentStop={currentStop}
                displayPct={displayPct}
              />

              <div className="mt-4">
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="w-full rounded-2xl py-4 font-black text-lg text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {launching ? "Launching..." : `🚀 Launch ${units} units`}
                </button>
                <p className="text-center text-xs font-bold text-muted-foreground mt-3">
                  They won't know what hit them 💩
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStage("pick");
                    setResultSplat(null);
                  }}
                  className="rounded-full bg-muted/50 p-1.5 text-foreground"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Splat ready 💥
                </h2>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                The link is generated. Send it now.
              </p>

              <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Send via
              </div>

              <div className="mt-4 flex justify-between gap-6 px-2">
                <button onClick={() => handleSharePick("whatsapp")} disabled={sharing} className="group flex flex-col items-center gap-3 transition-transform active:scale-90 disabled:opacity-50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all group-hover:scale-110">
                    <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </div>
                  <span className="text-[11px] font-bold text-foreground">WhatsApp</span>
                </button>
                <button onClick={() => handleSharePick("copy")} disabled={sharing} className="group flex flex-col items-center gap-3 transition-transform active:scale-90 disabled:opacity-50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 text-foreground shadow-md transition-all group-hover:scale-110 group-hover:bg-muted/60">
                    <Copy className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">Copy link</span>
                </button>
                <button onClick={() => handleSharePick("share")} disabled={sharing} className="group flex flex-col items-center gap-3 transition-transform active:scale-90 disabled:opacity-50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all group-hover:scale-110">
                    <Share2 className="h-7 w-7" strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">Share</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function ScalePicker({
  units,
  setUnits,
  stock,
  currentStop,
  displayPct,
}: {
  units: number;
  setUnits: (u: number) => void;
  stock: number;
  currentStop: Stop;
  displayPct: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const padding = 20; // Enough padding to keep thumb from being cut off
    const innerWidth = r.width - padding * 2;
    const relativeX = clientX - r.left - padding;
    const ratio = Math.max(0, Math.min(1, relativeX / innerWidth));
    
    const val = MIN_UNITS + ratio * (stock - MIN_UNITS);
    setUnits(Math.round(val));
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const chipValues = useMemo(() => {
    if (stock >= 500) return [MIN_UNITS, 100, 250, stock];
    if (stock >= 200) return [MIN_UNITS, 50, 150, stock];
    const step = (stock - MIN_UNITS) / 3;
    return [MIN_UNITS, Math.round(MIN_UNITS + step), Math.round(MIN_UNITS + step * 2), stock];
  }, [stock]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-border bg-card p-6 text-center relative overflow-hidden shadow-sm">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative">
          <div
            className="text-6xl mb-2 transition-transform duration-200"
            style={{ transform: `scale(${0.9 + displayPct * 0.4})` }}
          >
            {currentStop.emoji}
          </div>
          <div className="text-5xl font-black tabular-nums tracking-tight text-foreground">{units}</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
            units · {Math.round((units/stock) * 100)}% of stock
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
            {currentStop.label} — {currentStop.vibe}
          </div>
        </div>
      </div>

      <div className="select-none">
        <div
          ref={trackRef}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setDragging(true);
            setFromClientX(e.clientX);
          }}
          className="relative h-16 rounded-2xl bg-muted/50 cursor-pointer touch-none overflow-hidden"
        >
          {/* Fill width now accounts for the full track when displayPct is 1 */}
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-75"
            style={{
              width: displayPct === 1 ? '100%' : `calc(20px + ${displayPct} * (100% - 40px))`,
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          />
          
          {/* Positions markers slightly away from the absolute edges so they stay visible */}
          <div className="absolute inset-0 px-6 flex justify-between items-center pointer-events-none">
            {ALL_STOPS.map((s) => (
              <div
                key={s.label}
                className={`text-base leading-none transition-opacity duration-200 ${displayPct >= s.pct - 0.01 ? "opacity-100" : "opacity-30"}`}
              >
                {s.emoji}
              </div>
            ))}
          </div>

          <div
            className="absolute top-1/2 size-10 rounded-full bg-background border-4 border-primary shadow-xl flex items-center justify-center transition-transform pointer-events-none"
            style={{
              left: `calc(20px + ${displayPct} * (100% - 40px))`,
              transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
            }}
          >
            <div className="size-2 rounded-full bg-primary" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-3 px-1">
          <span>DRIP</span>
          <span>APOCALYPSE</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {chipValues.map((n, i) => (
          <button
            key={n}
            onClick={() => setUnits(n)}
            className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
              units === n
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {i === 0 ? "MIN" : i === chipValues.length - 1 ? "MAX" : n}
          </button>
        ))}
      </div>
    </div>
  );
}
