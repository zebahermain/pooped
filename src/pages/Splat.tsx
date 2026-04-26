import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Copy, TrendingUp } from "lucide-react";
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
  const splatUrl = buildSplatUrl(splat.id);
  const sender = splat.sender_name || "Someone";
  
  const headlines: Record<string, string> = {
    cannon: `💥 ${sender} just CANNON BLASTED you`,
    monsoon: `🌧️ ${sender} is raining on your parade`,
    stealth: `🤫 ${sender} silently dropped on you`,
    gentle: `🎁 ${sender} left you a... gift`,
  };
  const headline = headlines[splat.style] || `${sender} just launched at you`;

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
                {splat.units} units of {grade} 💩
              </div>
              {styleMeta && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <span>{styleMeta.emoji}</span>
                  <span>{styleMeta.label}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Link to="/onboarding">
              <Button
                variant="hero"
                size="xl"
                className="w-full h-16 text-lg font-black"
                data-testid="retaliate-cta"
              >
                Retaliate 💩 →
              </Button>
            </Link>
            <p className="mt-4 text-center text-sm font-bold text-white/80">
              Join {sender} on Pooped and hit back
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Share this hit</p>
              <div className="flex items-center gap-4">
                <a
                  href={buildWhatsAppLink(`Check out this splat: ${splatUrl}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                  aria-label="Share on WhatsApp"
                  data-testid="splat-share-whatsapp"
                >
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <button
                  onClick={copyLink}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 active:scale-95"
                  aria-label="Copy link"
                  data-testid="splat-copy-link"
                >
                  <Copy className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplatPage;
