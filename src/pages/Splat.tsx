import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LAUNCH_THRESHOLD, getReservoirState } from "@/lib/reservoir";
import {
  fetchSplat,
  fetchSplatsToday,
  getDeliveryStyleMeta,
  getGrade,
  type Splat,
} from "@/lib/splats";

const RAIN_COUNT = 26;

const updateMetaTags = (title: string, description: string, image: string) => {
  document.title = title;
  
  const setMeta = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('og:image', `${window.location.origin}${image}`);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', `${window.location.origin}${image}`);
};

const SplatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const isRegistered = !!session && !authLoading;
  const viewerUnits = useMemo(
    () => (isRegistered ? getReservoirState().units : 0),
    [isRegistered]
  );
  const [splat, setSplat] = useState<Splat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"hit" | "reveal">("hit");
  const [flashOn, setFlashOn] = useState(false);
  const [splatsToday, setSplatsToday] = useState<number | null>(null);

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
          const grade = getGrade(s.units);
          const sender = s.sender_name || "Someone";
          const title = `${sender} just hit ${s.recipient_name} with ${s.units} units 💩`;
          const description = "Open to see the damage and retaliate";
          
          const ogImages: Record<string, string> = {
            cannon: "/og/cannon.png",
            monsoon: "/og/monsoon.png",
            stealth: "/og/stealth.png",
            gentle: "/og/gift.png",
          };
          const image = ogImages[s.style] || "/og/cannon.png";
          
          updateMetaTags(title, description, image);
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

  useEffect(() => {
    if (!splat) return;
    const vibrateT = window.setTimeout(() => {
      try {
        navigator.vibrate?.([200, 100, 300]);
      } catch {
        /* noop */
      }
    }, 800);
    const flashOnT = window.setTimeout(() => setFlashOn(true), 1500);
    const flashOffT = window.setTimeout(() => setFlashOn(false), 1700);
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
        <div className="text-6xl">🤷</div>
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
  const sender = splat.sender_name || "Someone";
  
  const headlines: Record<string, string> = {
    cannon: `💥 ${sender} just CANNON BLASTED you`,
    monsoon: `🌧️ ${sender} is raining on your parade`,
    stealth: `🤫 ${sender} silently dropped on you`,
    gentle: `🎁 ${sender} left you a... gift`,
  };
  const headline = headlines[splat.style] || `${sender} just launched at you`;

  return (
    <div
      className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-[#0f0f0f] px-6 py-10 text-white"
      data-testid="splat-page"
    >
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[5] transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(101, 67, 33, 0.6)",
          opacity: flashOn ? 1 : 0,
        }}
      />

      {phase === "hit" && (
        <>
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

          <div className="relative z-[7] mt-24 text-center animate-fade-in">
            <p className="text-4xl font-extrabold tracking-tight text-white">
              Hey {splat.recipient_name}…
            </p>
          </div>

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

      {phase === "reveal" && (
        <div className="relative z-10 flex flex-col flex-1 animate-fade-in">
          <div className="mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary shadow-[0_0_15px_rgba(217,119,6,0.2)]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <TrendingUp className="h-3 w-3" />
              {splatsToday ?? "..."} SPLATS LAUNCHED TODAY
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-center text-center">
              <div
                className="relative text-[96px] leading-none mb-4"
                style={{
                  transform: "rotate(-15deg)",
                  filter:
                    "drop-shadow(6px 10px 0 rgba(101, 67, 33, 0.45)) drop-shadow(12px 18px 0 rgba(101, 67, 33, 0.2))",
                }}
                aria-hidden="true"
              >
                💩
              </div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">
                {headline}
              </h1>
              <div className="mt-4 inline-flex items-center rounded-full bg-amber-500/20 px-4 py-1.5 text-base font-black text-amber-400">
                {splat.units} {grade} units 💩
              </div>
              {styleMeta && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <span>{styleMeta.emoji}</span>
                  <span>{styleMeta.label}</span>
                </div>
              )}
            </div>
          </div>

          {isRegistered && (
            <p
              className="mt-6 text-center text-base font-bold text-white/90"
              data-testid="splat-viewer-reservoir"
            >
              You have <span className="text-amber-400">{viewerUnits}</span> units ready to fire back 💩
            </p>
          )}

          <div className="mt-8">
            <Button
              variant="hero"
              size="xl"
              className="w-full h-16 text-lg font-black"
              data-testid="retaliate-cta"
              onClick={() => {
                const target = encodeURIComponent(sender);
                if (isRegistered) {
                  // Only auto-open SendSheet when viewer can actually launch.
                  // Otherwise drop them on /reservoir so they can fill up first.
                  const canLaunch = viewerUnits >= LAUNCH_THRESHOLD;
                  if (canLaunch) {
                    navigate(`/reservoir?target=${target}&send=1`);
                  } else {
                    toast({
                      title: `Need ${LAUNCH_THRESHOLD} units to launch`,
                      description: `Log a poop to fill your reservoir, then come back and fire at ${sender} 💩`,
                    });
                    navigate(`/reservoir?target=${target}`);
                  }
                } else {
                  // Stash the target so we can resume after sign-up + onboarding.
                  try {
                    localStorage.setItem("pooped_pending_retaliate_target", sender);
                  } catch {}
                  navigate("/auth");
                }
              }}
            >
              {isRegistered && viewerUnits < LAUNCH_THRESHOLD
                ? "Fill up to fire back →"
                : "Retaliate 💩 →"}
            </Button>

            {!isRegistered && (
              <p className="mt-6 text-center text-xl font-black tracking-tight text-white">
                Join {sender} on Pooped and hit back
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SplatPage;
