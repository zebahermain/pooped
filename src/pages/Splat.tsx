import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TrendingUp, RefreshCcw } from "lucide-react";
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

type Phase = "black" | "incoming" | "drop" | "impact" | "aftermath" | "settled";

interface TierConfig {
  count: number;
  speed: number;
  text: string;
  vibe: string;
  shake: number;
  flash: boolean;
  vignette: string;
  faceStart: "smile" | "open";
  faceEnd: "blink" | "annoyed" | "hurt" | "dizzy" | "skull";
  aftermathLinger: number;
  scale: number;
  slowMo?: boolean;
}

const TIER_MAP: Record<string, TierConfig> = {
  drip: {
    count: 1,
    speed: 0.9,
    text: "plip.",
    vibe: "barely a tickle",
    shake: 0,
    flash: false,
    vignette: "none",
    faceStart: "smile",
    faceEnd: "blink",
    aftermathLinger: 1000,
    scale: 0.5,
  },
  puff: { // Now Splash in UI, puff in code
    count: 2,
    speed: 0.4,
    text: "pfft",
    vibe: "a cheeky nudge",
    shake: 2,
    flash: false,
    vignette: "rgba(0,0,0,0.2)",
    faceStart: "smile",
    faceEnd: "annoyed",
    aftermathLinger: 2000,
    scale: 0.7,
  },
  eruption: {
    count: 5,
    speed: 0.3,
    text: "INCOMING!!",
    vibe: "they'll feel that",
    shake: 6,
    flash: true,
    vignette: "rgba(0,0,0,0.4)",
    faceStart: "open",
    faceEnd: "hurt",
    aftermathLinger: 3000,
    scale: 1,
  },
  overload: {
    count: 8,
    speed: 0.25,
    text: "⚡ OVERLOAD ⚡",
    vibe: "danger zone",
    shake: 12,
    flash: true,
    vignette: "rgba(120,72,40,0.3)",
    faceStart: "open",
    faceEnd: "dizzy",
    aftermathLinger: 4000,
    scale: 1.3,
    slowMo: true,
  },
  apocalypse: {
    count: 15,
    speed: 0.2,
    text: "☢️ APOCALYPSE ☢️",
    vibe: "leave no survivors",
    shake: 20,
    flash: true,
    vignette: "rgba(0,0,0,0.8)",
    faceStart: "open",
    faceEnd: "skull",
    aftermathLinger: 6000,
    scale: 1.8,
    slowMo: true,
  },
};

const TAUNTS = [
  "Still just standing there? 😂",
  "They are laughing at you rn",
  "Your move. Or stay scared.",
  "ARE YOU GONNA TAKE THAT??",
];

const SplatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const isRegistered = !!session && !authLoading;
  const viewerUnits = useMemo(() => (isRegistered ? getReservoirState().units : 0), [isRegistered]);

  const [splat, setSplat] = useState<Splat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [splatsToday, setSplatsToday] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("black");
  const [elapsed, setElapsed] = useState(0);
  const [tauntIdx, setTauntIdx] = useState(0);
  const [showTaunt, setShowTaunt] = useState(false);
  const [variant] = useState(() => Math.random() < 0.5 ? "A" : "B");
  const [replayKey, setReplayKey] = useState(0);

  const config = useMemo(() => {
    if (!splat) return TIER_MAP.eruption;
    // Map style to config, fallback to eruption
    const styleKey = splat.style === "puff" ? "puff" : splat.style;
    return TIER_MAP[styleKey] || TIER_MAP.eruption;
  }, [splat]);

  useEffect(() => {
    if (!id) { setError("Invalid link"); setLoading(false); return; }
    fetchSplat(id).then((s) => {
      if (!s) setError("Splat not found");
      else {
        setSplat(s);
        setPhase("incoming");
      }
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
    fetchSplatsToday().then(setSplatsToday);
  }, [id, replayKey]);

  useEffect(() => {
    if (phase === "incoming") {
      const t = setTimeout(() => setPhase("drop"), config.text === "plip." ? 1000 : 800);
      return () => clearTimeout(t);
    }
    if (phase === "drop") {
      const t = setTimeout(() => setPhase("impact"), config.speed * 1000 + 200);
      return () => clearTimeout(t);
    }
    if (phase === "impact") {
      const t = setTimeout(() => setPhase("aftermath"), 400);
      return () => clearTimeout(t);
    }
    if (phase === "aftermath") {
      const t = setTimeout(() => setPhase("settled"), config.aftermathLinger);
      return () => clearTimeout(t);
    }
  }, [phase, config]);

  useEffect(() => {
    if (phase !== "settled") return;
    const start = Date.now();
    const i = setInterval(() => setElapsed(Date.now() - start), 250);
    const show = setTimeout(() => setShowTaunt(true), 8000);
    const rotate = setInterval(() => setTauntIdx((p) => (p + 1) % TAUNTS.length), 5000);
    return () => { clearInterval(i); clearTimeout(show); clearInterval(rotate); };
  }, [phase]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white text-5xl animate-bounce">💩</div>;
  if (error || !splat) return <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-6 text-center">
    <div className="text-6xl mb-4">🤷</div>
    <h1 className="text-2xl font-bold">Nothing here</h1>
    <Link to="/" className="mt-6"><Button variant="hero" size="lg">Visit Pooped</Button></Link>
  </div>;

  const styleMeta = getDeliveryStyleMeta(splat.style);
  const grade = getGrade(splat.units);
  const sender = splat.sender_name || "Friend";

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-black text-white">
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        {phase === "settled" && (
          <button onClick={() => setReplayKey(k => k + 1)} className="p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors">
            <RefreshCcw className="size-4" />
          </button>
        )}
        <ThemeToggle />
      </div>

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-1000" 
           style={{ boxShadow: phase !== "black" ? `inset 0 0 150px ${config.vignette}` : 'none', opacity: phase === "settled" ? 0.3 : 1 }} />

      {/* Flash */}
      <AnimatePresence>
        {phase === "impact" && config.flash && (
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-[100] bg-white/30 pointer-events-none" />
        )}
      </AnimatePresence>

      {/* Incoming Text */}
      <AnimatePresence>
        {phase === "incoming" && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <motion.h1 
              initial={{ filter: "blur(10px)" }}
              animate={{ filter: "blur(0px)" }}
              className={cn(
                "text-5xl font-black tracking-tight text-center uppercase px-6",
                config.text === "plip." ? "text-neutral-400 lowercase" : "text-red-500 italic"
              )}
            >
              {config.text}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Falling Poo(s) */}
      <AnimatePresence>
        {phase === "drop" && (
          <div className="fixed inset-0 z-30 pointer-events-none">
            {Array.from({ length: config.count }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "-20vh", x: `calc(50% + ${(i - (config.count-1)/2) * 40}px)`, opacity: 0 }}
                animate={{ y: "35vh", opacity: 1 }}
                transition={{ 
                  duration: config.speed, 
                  delay: i * (config.slowMo ? 0.2 : 0.05),
                  ease: config.text === "plip." ? "easeInOut" : [0.4, 0, 1, 1] 
                }}
                className="absolute text-7xl"
                style={{ fontSize: `${64 * config.scale}px` }}
              >
                💩
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Impact Splatter */}
      <AnimatePresence>
        {(phase === "impact" || phase === "aftermath") && (
          <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center pt-[10vh]">
             {Array.from({ length: config.count * 3 }).map((_, i) => (
               <motion.div
                 key={i}
                 initial={{ scale: 0, x: 0, y: 0 }}
                 animate={{ 
                   scale: [0, 1.5, 1], 
                   x: (Math.random() - 0.5) * 200 * config.scale,
                   y: (Math.random() - 0.5) * 150 * config.scale + (phase === "aftermath" ? 100 : 0)
                 }}
                 transition={{ duration: 0.6, delay: Math.random() * 0.2 }}
                 className="absolute text-4xl"
               >
                 💩
               </motion.div>
             ))}
          </div>
        )}
      </AnimatePresence>

      {/* Smiley Face Container */}
      <motion.div
        animate={phase === "impact" ? { 
          x: [0, -config.shake, config.shake, -config.shake, 0],
          rotate: [0, -2, 2, 0]
        } : { x: 0 }}
        className={cn(
          "fixed inset-x-0 top-0 z-20 flex flex-col items-center pt-24 transition-transform duration-1000",
          config.faceEnd === "skull" && phase === "settled" ? "translate-y-[120vh] rotate-[720deg]" : "translate-y-0"
        )}
      >
        <div className="relative">
          {/* Base Face */}
          <motion.svg viewBox="0 0 200 200" width={180 * config.scale} height={180 * config.scale}>
             <circle cx="100" cy="100" r="90" fill="#FCD34D" stroke="#1f2937" strokeWidth="4" />
             {/* Expressions */}
             <AnimatePresence mode="wait">
               {phase === "aftermath" || phase === "settled" ? (
                 <motion.g key="hurt-face" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   {config.faceEnd === "annoyed" && (
                     <>
                        <path d="M60 85 q20 -5 40 0" stroke="#1f2937" strokeWidth="4" fill="none" />
                        <path d="M100 85 q20 -5 40 0" stroke="#1f2937" strokeWidth="4" fill="none" />
                        <path d="M75 145 q25 -10 50 0" stroke="#1f2937" strokeWidth="5" fill="none" />
                     </>
                   )}
                   {config.faceEnd === "hurt" && (
                     <>
                        <path d="M65 75 l15 15 m0 -15 l-15 15" stroke="#1f2937" strokeWidth="4" />
                        <path d="M120 75 l15 15 m0 -15 l-15 15" stroke="#1f2937" strokeWidth="4" />
                        <motion.path d="M70 150 q30 -40 60 0" stroke="#1f2937" strokeWidth="6" fill="none" animate={{ scaleY: [1, 1.2, 1] }} transition={{ repeat: Infinity }} />
                     </>
                   )}
                   {config.faceEnd === "dizzy" && (
                     <>
                       <g stroke="#1f2937" strokeWidth="3" fill="none">
                         <path d="M65 80 q-8 -8 0 -14 q12 -6 14 6 q2 14 -14 14 q-18 0 -14 -20" />
                         <path d="M135 80 q-8 -8 0 -14 q12 -6 14 6 q2 14 -14 14 q-18 0 -14 -20" />
                       </g>
                       <path d="M70 140 q10 -10 20 0 q10 10 20 0 q10 -10 20 0" stroke="#1f2937" strokeWidth="4" fill="none" />
                     </>
                   )}
                   {config.faceEnd === "skull" && (
                     <text x="100" y="140" fontSize="120" textAnchor="middle">💀</text>
                   )}
                   {config.faceEnd === "blink" && (
                     <>
                       <line x1="60" y1="85" x2="85" y2="85" stroke="#1f2937" strokeWidth="4" />
                       <line x1="115" y1="85" x2="140" y2="85" stroke="#1f2937" strokeWidth="4" />
                       <path d="M80 140 q20 5 40 0" stroke="#1f2937" strokeWidth="4" fill="none" />
                     </>
                   )}
                 </motion.g>
               ) : (
                 <motion.g key="start-face">
                   <circle cx="72" cy="85" r="8" fill="#1f2937" />
                   <circle cx="128" cy="85" r="8" fill="#1f2937" />
                   {config.faceStart === "open" ? (
                     <circle cx="100" cy="140" r="15" fill="#1f2937" />
                   ) : (
                     <path d="M70 135 q30 20 60 0" stroke="#1f2937" strokeWidth="6" fill="none" strokeLinecap="round" />
                   )}
                 </motion.g>
               )}
             </AnimatePresence>
          </motion.svg>

          {/* Impact Marks */}
          <AnimatePresence>
            {(phase === "aftermath" || phase === "settled") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: config.count }).map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ delay: i * 0.05 }}
                        className="text-4xl"
                        style={{ filter: phase === "aftermath" ? "none" : "blur(2px)", opacity: phase === "aftermath" ? 1 : 0.6 }}
                      >💩</motion.div>
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Settled UI */}
      <AnimatePresence>
        {phase === "settled" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-50 mx-auto flex min-h-screen max-w-md flex-col px-6 pt-6 pb-12">
            <div className="flex justify-center mb-8">
              <div className="rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-[10px] font-black tracking-widest text-orange-400 uppercase">
                • 📈 {splatsToday ?? "..."} SPLATS LAUNCHED TODAY
              </div>
            </div>

            <div className="rounded-[40px] bg-neutral-900/90 p-8 text-center shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
              <div className="text-7xl mb-6">💩</div>
              <h1 className="text-3xl font-black tracking-tight leading-tight uppercase mb-4">💥 {sender} just CANNON BLASTED you</h1>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-900/40 px-5 py-2.5 text-base font-black text-amber-400">
                {splat.units} {grade} units 💩
              </div>
              
              {splat.style === 'apocalypse' && (
                <div className="mt-6 flex justify-center">
                   <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transform -rotate-2">
                     Legendary Achievement
                   </div>
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 mt-8">
              <p className="text-center text-base font-black text-white/90">Hello Friend…</p>
              <p className="mt-1 text-center text-sm font-bold text-neutral-400">
                You have <span className="text-orange-400">{viewerUnits}</span> units ready to fire back 💩
              </p>

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
                className="mt-6 w-full rounded-full py-5 text-lg font-black text-black shadow-[0_0_40px_rgba(251,146,60,0.4)] active:scale-95 transition-all"
                style={{ background: "linear-gradient(90deg, #fb923c 0%, #fbbf24 100%)" }}
              >
                <motion.span animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  {buttonText}
                </motion.span>
              </button>

              <div className="mt-6 h-6 flex justify-center">
                <AnimatePresence mode="wait">
                  {showTaunt && (
                    <motion.p key={tauntIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {TAUNTS[tauntIdx]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto flex flex-col items-center gap-3 pt-8">
                <div className="flex -space-x-2">
                  {["#f87171","#34d399","#a78bfa"].map((c, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-black" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Join <span className="text-neutral-300">847 others</span> who hit back today
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplatPage;
