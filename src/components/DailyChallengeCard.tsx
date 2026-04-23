import { useEffect, useMemo, useState } from "react";
import { Zap, Check } from "lucide-react";
import {
  getChallengeForDate,
  getCompletionForDate,
} from "@/lib/challenges";

interface Props {
  /**
   * Bumped by the parent whenever it saves a new log so the card
   * re-checks for completion (the actual evaluation happens inside
   * LogEntry via evaluateAndMarkCompletion, this just triggers a re-read).
   */
  refreshToken?: number;
}

export const DailyChallengeCard = ({ refreshToken = 0 }: Props) => {
  const challenge = useMemo(() => getChallengeForDate(), []);
  const [completion, setCompletion] = useState(() => getCompletionForDate());

  useEffect(() => {
    setCompletion(getCompletionForDate());
  }, [refreshToken]);

  const done = !!completion;

  return (
    <div
      className={`mt-6 flex items-center gap-4 rounded-3xl border p-4 shadow-card transition-colors ${
        done
          ? "border-success/40 bg-success/5"
          : "border-border bg-card"
      }`}
      data-testid="daily-challenge-card"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-success/20" : "bg-primary/15"
        }`}
      >
        <Zap
          className={`h-5 w-5 ${done ? "text-success" : "text-primary"}`}
          strokeWidth={2.5}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Today's Challenge
        </p>
        <p className="mt-0.5 text-[15px] font-bold leading-snug text-foreground">
          {done
            ? `${challenge.text} Complete! +${completion!.bonusUnits} units added 🎉`
            : challenge.text}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Reward: +{challenge.bonusUnits} reservoir units
        </p>
      </div>
      {/* Circular progress ring — filled amber with check when done, empty otherwise */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done ? "border-success bg-success text-white" : "border-muted-foreground/40"
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
      </div>
    </div>
  );
};
