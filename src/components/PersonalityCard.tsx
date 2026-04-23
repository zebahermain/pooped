import { useEffect, useState } from "react";
import { Lock, Share2 } from "lucide-react";
import {
  PERSONALITY_UNLOCK_THRESHOLD,
  getPersonality,
  type Personality,
} from "@/lib/personality";
import { toast } from "@/hooks/use-toast";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "2d ago" style relative time for the Updated footer. */
const formatRelative = (ts: number) => {
  const days = Math.floor((Date.now() - ts) / MS_PER_DAY);
  if (days <= 0) return "just now";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

export const PersonalityCard = () => {
  const [state, setState] = useState<{
    personality: Personality;
    computedAt: number;
    isLocked: boolean;
    logCount: number;
  } | null>(null);

  useEffect(() => {
    setState(getPersonality());
  }, []);

  if (!state) return null;
  const { personality, computedAt, isLocked, logCount } = state;

  // -------- Locked preview --------
  if (isLocked) {
    const progress = Math.min(
      100,
      Math.round((logCount / PERSONALITY_UNLOCK_THRESHOLD) * 100)
    );
    return (
      <section
        className="rounded-3xl border border-border bg-card p-6 text-center shadow-card"
        data-testid="personality-locked"
      >
        <div className="text-5xl opacity-40">🗺️</div>
        <h3 className="mt-3 inline-flex items-center gap-1.5 text-lg font-bold">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Log {PERSONALITY_UNLOCK_THRESHOLD} days to unlock your Gut Personality
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {logCount} / {PERSONALITY_UNLOCK_THRESHOLD} logs
        </p>
        <div className="mx-auto mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
          <div
            className="h-full gradient-warm transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>
    );
  }

  const shareText = `${personality.name} ${personality.emoji} — ${personality.description} Track your gut on Pooped 💩 https://gutpooped.com`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `My Gut Personality: ${personality.name}`,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied!", description: "Share it anywhere 🎉" });
      }
    } catch {
      // user cancelled or clipboard blocked — silent
    }
  };

  return (
    <section
      className="rounded-3xl border border-primary/20 bg-card p-6 text-center shadow-card"
      data-testid="personality-card"
    >
      <div className="text-5xl" data-testid="personality-emoji">
        {personality.emoji}
      </div>
      <h3 className="mt-3 text-xl font-bold text-primary">
        {personality.name}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        {personality.description}
      </p>
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        Updated {formatRelative(computedAt)}
      </p>
      <button
        onClick={share}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition-bounce hover:scale-[1.03]"
        data-testid="personality-share"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <p className="mt-3 text-[10px] text-muted-foreground/70">
        Updates monthly based on your logs
      </p>
    </section>
  );
};
