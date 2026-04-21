import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import {
  buildShareText,
  buildSplatUrl,
  buildWhatsAppLink,
  fetchSplat,
  fetchSplatsToday,
  getDeliveryStyleMeta,
  getGrade,
  type Splat,
} from "@/lib/splats";

/**
 * /splat/:id — the viral money screen.
 *
 * Phase 1 (0–2.5s): automatic hit animation
 *   • Hey [name]… text settles in
 *   • vibrate at 0.8s
 *   • 💩 rain cascades from the top (20–30 emojis, staggered)
 *   • at 1.5s: huge "SPLAT 💥" pops
 *   • brown overlay flashes briefly
 *
 * Phase 2 (settle): splat card reveals
 * Phase 3 (always): Retaliate CTA + forward icons + live "splats today" counter
 */

const RAIN_COUNT = 26;

const Splat = () => {
  const { id } = useParams<{ id: string }>();
  const [splat, setSplat] = useState<Splat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"hit" | "reveal">("hit");
  const [flashOn, setFlashOn] = useState(false);
  const [splatsToday, setSplatsToday] = useState<number | null>(null);

  // Pre-compute rain drops once so positions don't change between renders.
  const rainDrops = useMemo(
    () =>
      Array.from({ length: RAIN_COUNT }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 1.6 + Math.random() * 1.4,
        size: 24 + Math.floor(Math.random() * 24),
      })),
    []
  );

  useEffect(() => {
    if (!id) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchSplat(id)
      .then((s) => {
        if (cancelled) return;
        if (!s) setError("This splat doesn't exist (or was deleted).");
        else {
          setSplat(s);
          document.title = `${s.recipient_name} just got hit 💩 — Pooped`;
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Couldn't load this splat.");
        setLoading(false);
      });
    fetchSplatsToday().then((n) => !cancelled && setSplatsToday(n));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Phase 1 choreography.
  useEffect(() => {
    if (!splat) return;
    // 0.8s — haptic
    const vibrateT = window.setTimeout(() => {
      try {
        navigator.vibrate?.([200, 100, 300]);
      } catch {
        /* noop */
      }
    }, 800);
    // 1.5s — brown flash
    const flashOnT = window.setTimeout(() => setFlashOn(true), 1500);
    const flashOffT = window.setTimeout(() => setFlashOn(false), 1700);
    // 2.5s — transition to reveal
    const revealT = window.setTimeout(() => setPhase("reveal"), 2500);
    return () => {
      window.clearTimeout(vibrateT);
      window.clearTimeout(flashOnT);
      window.clearTimeout(flashOffT);
      window.clearTimeout(revealT);
    };
  }, [splat]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[#0f0f0f] px-6">
        <div className="animate-bounce text-5xl">💩</div>
        <p className="mt-4 text-sm text-white/60">Loading your splat…</p>
      </div>
    );
  }

  if (error || !splat) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[#0f0f0f] px-6 text-center text-white">
        <div className="text-6xl">🚽</div>
        <h1 className="mt-4 text-2xl font-bold">Nothing here</h1>
        <p className="mt-2 text-sm text-white/60">
          {error ?? "This splat doesn't exist."}
        </p>
        <Link to="/" className="mt-6">
          <Button variant="hero" size="lg">
            Visit Pooped
          </Button>
        </Link>
      </div>
    );
  }

  const styleMeta = getDeliveryStyleMeta(splat.style);
  const grade = getGrade(splat.units);
  const splatUrl = buildSplatUrl(splat.id);
  const shareText = buildShareText({
    recipient: splat.recipient_name,
    sender: splat.sender_name || "Someone",
    units: splat.units,
    grade,
    splatUrl,
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(splatUrl);
      toast({ title: "Link copied!" });
    } catch {
      toast({ title: splatUrl });
    }
  };

  return (
    <div
      className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#0f0f0f] px-6 py-10 text-white"
      data-testid="splat-page"
    >
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Brown flash overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[5] transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(101, 67, 33, 0.6)",
          opacity: flashOn ? 1 : 0,
        }}
      />

      {/* HIT PHASE: rain + name + SPLAT text */}
      {phase === "hit" && (
        <>
          {/* 💩 rain */}
          <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
            {rainDrops.map((d, i) => (
              <span
                key={i}
                className="absolute leading-none"
                style={{
                  left: `${d.left}%`,
                  top: "-10vh",
                  fontSize: `${d.size}px`,
                  animation: `emoji-rain ${d.duration}s ${d.delay}s linear forwards`,
                }}
              >
                💩
              </span>
            ))}
          </div>

          {/* Recipient callout */}
          <div className="relative z-[7] mt-24 text-center animate-fade-in">
            <p className="text-4xl font-extrabold tracking-tight text-white">
              Hey {splat.recipient_name}…
            </p>
          </div>

          {/* SPLAT pop at 1.5s */}
          <div
            className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center opacity-0"
            style={{
              animation:
                "launched-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards",
            }}
          >
            <div className="text-7xl font-black text-amber-500 drop-shadow-[0_0_40px_hsl(28_88%_52%/0.9)]">
              SPLAT 💥
            </div>
          </div>
        </>
      )}

      {/* REVEAL PHASE: clean splat card */}
      {phase === "reveal" && (
        <div className="relative z-10 mt-16 animate-fade-in">
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col items-center text-center">
              <div
                className="relative text-[96px] leading-none"
                style={{
                  transform: "rotate(-15deg)",
                  filter:
                    "drop-shadow(6px 10px 0 rgba(101, 67, 33, 0.45)) drop-shadow(12px 18px 0 rgba(101, 67, 33, 0.2))",
                }}
                aria-hidden="true"
              >
                💩
              </div>
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/50">
                {splat.sender_name || "Someone"} just launched at you
              </p>
              <div className="mt-3 inline-flex items-center rounded-full bg-amber-500/20 px-4 py-2 text-base font-extrabold text-amber-400">
                {splat.units} units of {grade} 💩
              </div>
              {styleMeta && (
                <div className="mt-2 text-xs font-semibold text-white/60">
                  via {styleMeta.label} {styleMeta.emoji}
                </div>
              )}
            </div>
          </div>

          {/* CTA block */}
          <div className="mt-6">
            <Link to="/onboarding">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                data-testid="retaliate-cta"
              >
                Retaliate on Pooped 💩 →
              </Button>
            </Link>
            <p className="mt-3 text-center text-xs text-white/60">
              Free · Takes 30 seconds to set up · Your reservoir starts filling immediately
            </p>

            <div className="mt-5 flex items-center justify-center gap-3 text-xs text-white/50">
              <span>or share this hit</span>
              <a
                href={buildWhatsAppLink(shareText)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 p-2 transition hover:bg-white/10"
                aria-label="Share on WhatsApp"
                data-testid="splat-share-whatsapp"
              >
                <MessageCircle className="h-4 w-4 text-[hsl(142,70%,50%)]" />
              </a>
              <button
                onClick={copyLink}
                className="rounded-full bg-white/5 p-2 transition hover:bg-white/10"
                aria-label="Copy link"
                data-testid="splat-copy-link"
              >
                <Copy className="h-4 w-4 text-white/80" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live counter — always visible at the bottom */}
      <div className="mt-auto pt-10 text-center text-[11px] text-white/40">
        💩 {splatsToday ?? "…"} splats launched today
      </div>
    </div>
  );
};

export default Splat;
