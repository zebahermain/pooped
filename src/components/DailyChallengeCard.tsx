import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getChallengeForDate,
  getCompletionForDate,
} from "@/lib/challenges";

interface Props {
  refreshToken?: number;
}

export const DailyChallengeCard = ({ refreshToken = 0 }: Props) => {
  const navigate = useNavigate();
  const challenge = useMemo(() => getChallengeForDate(), []);
  const [completion, setCompletion] = useState(() => getCompletionForDate());

  useEffect(() => {
    setCompletion(getCompletionForDate());
  }, [refreshToken]);

  const done = !!completion;

  return (
    <button
      onClick={() => navigate("/reservoir")}
      className="mt-6 flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 text-left transition-all active:scale-[0.98]"
      data-testid="daily-challenge-card"
    >
      <div className="text-3xl shrink-0">💩</div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold tracking-tight text-white">
          {done 
            ? `+${completion!.bonusUnits} units added to your reservoir`
            : challenge.text}
        </p>
        
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-[#D97706] transition-all duration-700"
            style={{ width: done ? "100%" : "30%" }}
          />
        </div>
        
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {done ? "Tap to see your reservoir" : `Reward: +${challenge.bonusUnits} units`}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-[#D97706] shrink-0" />
    </button>
  );
};
