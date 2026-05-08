import { Home, PlusCircle, ListOrdered, User } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LAUNCH_THRESHOLD,
  getReservoirState,
  hasSeenLaunchDot,
} from "@/lib/reservoir";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/log", label: "Log", icon: PlusCircle },
  { to: "/reservoir", label: "Reservoir", emoji: "💩" },
  { to: "/history", label: "History", icon: ListOrdered },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export const BottomNav = () => {
  const location = useLocation();
  const [showDot, setShowDot] = useState(false);

  useEffect(() => {
    try {
      const state = getReservoirState();
      setShowDot(state.units >= LAUNCH_THRESHOLD && !hasSeenLaunchDot());
    } catch (e) {}
  }, [location.pathname]);

  if (
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/result") ||
    location.pathname.startsWith("/send") ||
    location.pathname.startsWith("/splat") ||
    location.pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-xl ring-1 ring-black/5">
      <div className="flex items-center justify-around px-2 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {tabs.map((tab) => {
          const { to, label } = tab;
          const Icon = "icon" in tab ? tab.icon : null;
          const emoji = "emoji" in tab ? tab.emoji : null;
          const isReservoir = to === "/reservoir";
          return (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-1 flex-col items-center gap-1.5 rounded-xl py-1 text-[10px] font-bold uppercase tracking-tight transition-all active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {Icon ? (
                    <Icon
                      className={cn("transition-transform", isActive ? "h-6 w-6 scale-110" : "h-5 w-5")}
                      strokeWidth={isActive ? 3 : 2}
                    />
                  ) : (
                    <span
                      className={cn(
                        "leading-none transition-transform",
                        isActive ? "text-2xl scale-110" : "text-xl"
                      )}
                      aria-hidden
                    >
                      {emoji}
                    </span>
                  )}
                  <span className="leading-none">{label}</span>
                  {isReservoir && showDot && (
                    <span className="absolute right-1/4 top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
