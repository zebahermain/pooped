import { Lightbulb } from "lucide-react";
import {
  GENERIC_IBS_TIP,
  IBS_TIPS,
  getLogs,
  getProfile,
  getTopFoodTagThisWeek,
} from "@/lib/storage";

export const IBSWeeklyTip = () => {
  const profile = getProfile();
  if (!profile || profile.goal !== "ibs") return null;

  const top = getTopFoodTagThisWeek(getLogs());
  const tip = (top && IBS_TIPS[top]) || GENERIC_IBS_TIP;

  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary-glow/5 p-4">
      <div className="flex items-center gap-2">
        <div className="rounded-xl gradient-warm p-1.5">
          <Lightbulb className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-sm font-bold">IBS tip of the week</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{tip}</p>
    </div>
  );
};
