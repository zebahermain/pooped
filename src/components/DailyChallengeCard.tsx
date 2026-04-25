import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getChallengeForDate,
  getCompletionForDate,
  acknowledgeCompletion,
} from "@/lib/challenges";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  refreshToken?: number;
}

export const DailyChallengeCard = ({ refreshToken = 0 }: Props) => {
  const navigate = useNavigate();
  const challenge = useMemo(() => getChallengeForDate(), []);
  const [completion, setCompletion] = useState(() => getCompletionForDate());
  const [remoteAcknowledged, setRemoteAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCompletion(getCompletionForDate());
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("reservoir_notified").eq("id", user.id).single()
          .then(({ data }) => {
            if (data) setRemoteAcknowledged(data.reservoir_notified);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, [refreshToken]);

  const done = !!completion;
  const localAcknowledged = completion?.acknowledged ?? false;
  const isHandled = localAcknowledged || remoteAcknowledged;

  const handleClick = async () => {
    if (done && !isHandled) {
      await acknowledgeCompletion(completion!.date);
      navigate("/reservoir", { state: { animateBonus: completion!.bonusUnits } });
    } else {
      navigate("/reservoir");
    }
  };

  if (loading) return null;
  if (done && isHandled) return null;

  return (
    <button
      onClick={handleClick}
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
            className={`h-full bg-[#D97706] transition-all duration-1000 ${done ? "w-full" : "w-1/3"}`}
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
