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

  // Re-evaluate the reservoir notification dot on every route change so it
  // appears immediately after a log fills past the threshold and disappears
  // after the user opens the Reservoir tab.
  useEffect(() => {
    const state = getReservoirState();
    setShowDot(state.units >= LAUNCH_THRESHOLD && !hasSeenLaunchDot());
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
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/90 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-bounce",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {Icon ? (
                    <Icon
                      className={cn("transition-bounce", isActive ? "h-6 w-6" : "h-5 w-5")}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  ) : (
                    <span
                      className={cn(
                        "leading-none transition-bounce",
                        isActive ? "text-2xl" : "text-xl"
                      )}
                      aria-hidden
                    >
                      {emoji}
                    </span>
                  )}
                  <span>{label}</span>
                  {isReservoir && showDot && (
                    <span className="absolute right-3 top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-card" />
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
