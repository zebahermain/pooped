import { useEffect, useRef } from "react";
import { getGrade } from "@/lib/reservoir";

interface Props {
  units: number;
  onComplete: () => void;
}

/**
 * Full-screen 3-second launch takeover:
 *   0.0s – 💩 launches from bottom of screen, parabolic arc to top
 *   1.0s – synthetic "flush" whoosh (Web Audio)
 *   1.2s – brown flash frame
 *   1.4s – "LAUNCHED 💩" pop + unit count below
 *   3.0s – auto-dismiss via onComplete()
 *
 * Uses the Web Audio API to synthesise the flush sound so we don't
 * need to ship a binary asset. If the browser blocks AudioContext
 * (e.g. Safari without a user gesture), it silently falls back.
 */
export const LaunchAnimation = ({ units, onComplete }: Props) => {
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Toilet-flush whoosh — filtered white noise burst
    const playFlush = () => {
      try {
        const Ctx = (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        const bufferSize = ctx.sampleRate * 1.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.0);
        filter.Q.value = 4;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start();
        src.stop(ctx.currentTime + 1.0);
        src.onended = () => ctx.close().catch(() => {});
      } catch {
        // audio blocked — silent fail
      }
    };

    const t1 = window.setTimeout(playFlush, 300);
    const t2 = window.setTimeout(() => {
      if (flashRef.current) {
        flashRef.current.style.opacity = "1";
        window.setTimeout(() => {
          if (flashRef.current) flashRef.current.style.opacity = "0";
        }, 80);
      }
    }, 1200);
    const t3 = window.setTimeout(onComplete, 3000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onComplete]);

  const grade = getGrade(units);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
      role="dialog"
      aria-label="Launching"
      data-testid="launch-animation"
    >
      {/* Brown flash frame */}
      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0 transition-opacity duration-100"
        style={{ backgroundColor: "rgba(101, 67, 33, 0.6)", opacity: 0 }}
      />

      {/* Flying poo — arcs from bottom-center off-screen to top */}
      <span
        className="pointer-events-none absolute text-[96px] leading-none"
        style={{
          left: "50%",
          bottom: "-80px",
          animation: "launch-arc 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      >
        💩
      </span>

      {/* LAUNCHED text — appears at 1.4s */}
      <div
        className="flex flex-col items-center text-center opacity-0"
        style={{ animation: "launched-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.4s forwards" }}
      >
        <div className="text-6xl font-black tracking-tight text-amber-500 drop-shadow-[0_0_40px_hsl(28_88%_52%/0.9)]">
          LAUNCHED 💩
        </div>
        <div className="mt-4 text-lg font-semibold text-white/90">
          {units} units of <span className="text-amber-400">{grade}</span> grade
        </div>
      </div>
    </div>
  );
};
