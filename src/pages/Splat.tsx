import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

const BUTTON_COPY = [
  { t: 0, text: "Fill up to fire back →" },
  { t: 5000, text: "Hit back before they think you're scared →" },
  { t: 10000, text: "ARE YOU GONNA TAKE THAT?? →" },
];

const TAUNTS = [
  "Still just standing there? 😂",
  "They are laughing at you rn",
  "Your move. Or stay scared.",
  "ARE YOU GONNA TAKE THAT??",
];

type Phase = "black" | "incoming" | "drop" | "impact" | "face-in" | "face-hit" | "face-dizzy" | "face-out" | "settled";

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
  const [splatsToday, setSplatsToday] = useState<number | null>(null);

  const [phase, setPhase] = useState<Phase>("black");
  const [elapsed, setElapsed] = useState(0);
  const [tauntIdx, setTauntIdx] = useState(0);
  const [showTaunt, setShowTaunt] = useState(false);
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    if (!id) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    fetchSplat(id)
      .then((s) => {
        if (!s) setError("This splat doesn't exist (or was deleted).");
        else {
          setSplat(s);
          const sender = s.sender_name || "Friend";
          const title = `${sender} just hit you with ${s.units} units 💩`;
          updateMetaTags(title, "Open to see the damage and retaliate", "/og/cannon.png");
          
          // Start animation sequence after data is loaded
          setVariant(Math.random() < 0.5 ? "A" : "B");
          const sequence = [
            { p: "incoming", t: 50 },
            { p: "drop", t: 550 },
            { p: "impact", t: 1100 },
            { p: "face-in", t: 1400 },
            { p: "face-hit", t: 1750 },
            { p: "face-dizzy", t: 2000 },
            { p: "face-out", t: 3000 },
            { p: "settled", t: 3400 },
          ];
          sequence.forEach(({ p, t }) => setTimeout(() => setPhase(p as Phase), t));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Couldn't load this splat.");
        setLoading(false);
      });
    fetchSplatsToday().then(setSplatsToday);
  }, [id]);

  useEffect(() => {
    if (phase !== "settled") return;
    const start = Date.now();
    const i = setInterval(() => setElapsed(Date.now() - start), 250);
    const show = setTimeout(() => setShowTaunt(true), 8000);
    const rotate = setInterval(() => setTauntIdx((prev) => (prev + 1) % TAUNTS.length), 5000);
    return () => {
      clearInterval(i);
      clearTimeout(show);
      clearInterval(rotate);
    };
  }, [phase]);

  const buttonText = useMemo(() => {
    if (!isRegistered || viewerUnits >= LAUNCH_THRESHOLD) {
      const base = isRegistered ? "Retaliate 💩 →" : "Retaliate 💩 →";
      const angry = [...BUTTON_COPY].reverse().find((b) => elapsed >= b.t)?.text;
      return angry || base;
    }
    return "Fill up to fire back →";
  }, [isRegistered, viewerUnits, elapsed]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-black px-6">
        <div className="animate-bounce text-5xl">💩</div>
        <p className="mt-4 text-sm text-white/60 font-medium">Loading your splat…</p>
      </div>
    );
  }

  if (error || !splat) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-black px-6 text-center text-white">
        <div className="text-6xl">🤷</div>
        <h1 className="mt-4 text-2xl font-bold">Nothing here</h1>
        <p className="mt-2 text-sm text-white/60">{error ?? "This splat doesn't exist."}</p>
        <Link to="/" className="mt-6">
          <Button variant="hero" size="lg">Visit Pooped</Button>
        </Link>
      </div>
    );
  }

  const styleMeta = getDeliveryStyleMeta(splat.style);
  const grade = getGrade(splat.units);
  const sender = splat.sender_name || "Friend";
  const headline = `💥 ${sender} just CANNON BLASTED you`;

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-black text-white">
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <AnimatePresence>
        {phase === "incoming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.h1
              initial={{ scale: 0.6 }}
              animate={{ scale: [0.6, 1.15, 1] }}
              transition={{ duration: 0.4 }}
              className="text-5xl font-black tracking-tight text-red-500 sm:text-7xl"
              style={{ textShadow: "0 0 30px rgba(239,68,68,0.8)" }}
            >
              INCOMING 💩
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "drop" && (
          <motion.div
            initial={{ y: "-100vh" }}
            animate={{ y: "30vh" }}
            transition={{ duration: 0.55, ease: [0.4, 0, 1, 1] }}
            className="fixed left-1/2 top-0 z-40 -translate-x-1/2 text-9xl"
          >
            💩
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === "impact" || phase === "settled") && (
          <motion.div
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none fixed left-1/2 top-1/2 z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(120,72,40,0.9) 0%, rgba(80,45,20,0.6) 40%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(["face-in", "face-hit", "face-dizzy", "face-out"] as Phase[]).includes(phase) && (
          <motion.div
            key="cartoon-face-stage"
            initial={{ y: 0, opacity: 1 }}
            animate={phase === "face-out" ? { y: "-120vh", opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className={`fixed inset-x-0 top-0 z-30 flex items-center pt-24 ${variant === "B" ? "justify-end pr-8" : "justify-center"}`}
          >
            <div className="relative">
              <motion.svg
                viewBox="0 0 200 200"
                width={180}
                height={180}
                initial={{ scale: 0, rotate: variant === "B" ? 15 : -20 }}
                animate={{ scale: 1, rotate: phase === "face-hit" ? (variant === "B" ? [0, 18, -14, 8, 0] : [0, -15, 12, -8, 0]) : 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 14 }}
              >
                <circle cx="100" cy="100" r="90" fill="#FCD34D" stroke="#1f2937" strokeWidth="4" />
                {phase === "face-dizzy" || phase === "face-out" ? (
                  <>
                    <g stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round">
                      <path d="M65 80 q-8 -8 0 -14 q12 -6 14 6 q2 14 -14 14 q-18 0 -14 -20" />
                      <path d="M135 80 q-8 -8 0 -14 q12 -6 14 6 q2 14 -14 14 q-18 0 -14 -20" />
                    </g>
                    <path d="M70 140 q10 -10 20 0 q10 10 20 0 q10 -10 20 0" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <circle cx="72" cy="85" r="7" fill="#1f2937" />
                    <circle cx="128" cy="85" r="7" fill="#1f2937" />
                    <line x1="78" y1="138" x2="122" y2="138" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
                  </>
                )}
                {(phase === "face-dizzy" || phase === "face-out") && (
                  <g fill="#6b3a1a">
                    <motion.ellipse cx="60" cy="115" rx="14" ry="10" initial={{ scale: 0 }} animate={{ scale: 1 }} />
                    <motion.path d="M55 120 q-3 18 2 32 q3 8 8 0 q4 -14 1 -28 z" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "55px 120px" }} />
                    <motion.ellipse cx="135" cy="105" rx="12" ry="9" initial={{ scale: 0 }} animate={{ scale: 1 }} />
                    <motion.path d="M132 110 q-2 22 4 38 q3 7 7 -1 q3 -16 0 -32 z" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ transformOrigin: "132px 110px" }} />
                    <motion.ellipse cx="100" cy="60" rx="22" ry="14" initial={{ scale: 0 }} animate={{ scale: 1 }} />
                  </g>
                )}
              </motion.svg>
              <AnimatePresence>
                {phase === "face-in" && (
                  <motion.div
                    initial={{ x: variant === "B" ? -500 : 400, y: variant === "B" ? 0 : -20, rotate: 0, scale: variant === "B" ? 1.2 : 1 }}
                    animate={{ x: 0, y: 0, rotate: variant === "B" ? -360 : 540, scale: variant === "B" ? 1.3 : 1.1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.5, 0, 0.9, 0.5] }}
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
                  >💩</motion.div>
                )}
                {phase === "face-hit" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="text-4xl font-black text-amber-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
                      {variant === "B" ? "SPLOOSH!" : "SPLAT!"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={phase === "impact" ? { x: [0, -12, 10, -8, 6, -4, 0], y: [0, 6, -8, 4, -3, 2, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-20 mx-auto flex min-h-screen max-w-md flex-col px-4 pt-6"
      >
        <AnimatePresence>
          {phase === "settled" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
              <div className="rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-xs font-black tracking-wide text-orange-300 uppercase">
                • 📈 {splatsToday ?? "..."} SPLATS LAUNCHED TODAY
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "settled" && (
            <motion.div
              initial={{ y: "100vh", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.05 }}
              className="mt-8 rounded-[32px] bg-neutral-900/90 p-8 text-center shadow-2xl ring-1 ring-white/5 backdrop-blur-xl"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -8, 8, 0] }} transition={{ type: "spring", stiffness: 220, delay: 0.15 }} className="mx-auto text-7xl">💩</motion.div>
              <h1 className="mt-4 text-3xl font-black tracking-tight leading-tight uppercase">{headline}</h1>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-900/40 px-5 py-2.5 text-base font-black text-amber-400">
                {splat.units} {grade} units 💩
              </div>
              {styleMeta && (
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-300">
                    {styleMeta.emoji} {styleMeta.label}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "settled" && (
            <div className="flex flex-col flex-1 pb-10">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <p className="mt-8 text-center text-base font-black text-white/90">
                  Hello Friend…
                </p>
                <p className="mt-1 text-center text-sm font-bold text-neutral-400">
                  You have <span className="text-orange-400">{viewerUnits}</span> units ready to fire back 💩
                </p>
              </motion.div>

              <motion.div initial={{ scale: 0, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, delay: 0.7 }}>
                <button
                  onClick={() => {
                    const target = encodeURIComponent(sender);
                    if (isRegistered) {
                      if (viewerUnits >= LAUNCH_THRESHOLD) navigate(`/reservoir?target=${target}&send=1`);
                      else {
                        toast({ title: `Need ${LAUNCH_THRESHOLD} units to launch`, description: `Log a visit to fill up, then come back and fire at ${sender} 💩` });
                        navigate(`/reservoir?target=${target}`);
                      }
                    } else {
                      try { localStorage.setItem("pooped_pending_retaliate_target", sender); } catch {}
                      navigate("/auth");
                    }
                  }}
                  className="mt-6 w-full rounded-full py-5 text-lg font-black text-black shadow-[0_0_40px_rgba(251,146,60,0.4)] transition-transform active:scale-95"
                  style={{ background: "linear-gradient(90deg, #fb923c 0%, #fbbf24 100%)" }}
                >
                  <motion.span animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="block">
                    {buttonText}
                  </motion.span>
                </button>
              </motion.div>

              <div className="mt-6 flex h-6 items-center justify-center">
                <AnimatePresence mode="wait">
                  {showTaunt && (
                    <motion.p key={tauntIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-center text-xs font-black uppercase tracking-wider text-neutral-500">
                      {TAUNTS[tauntIdx]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-auto flex flex-col items-center gap-3 pt-12">
                <div className="flex -space-x-2">
                  {[
                    "linear-gradient(135deg,#f87171,#fbbf24)",
                    "linear-gradient(135deg,#34d399,#60a5fa)",
                    "linear-gradient(135deg,#a78bfa,#f472b6)",
                  ].map((bg, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-black" style={{ background: bg }} />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Join <span className="text-neutral-300">847 others</span> who hit back today
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SplatPage;
