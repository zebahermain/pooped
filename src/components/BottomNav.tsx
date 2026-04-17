import { Home, PlusCircle, ListOrdered, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/log", label: "Log", icon: PlusCircle },
  { to: "/history", label: "History", icon: ListOrdered },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/onboarding") || location.pathname.startsWith("/result")) {
    return null;
  }
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/90 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-bounce",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn("transition-bounce", isActive ? "h-6 w-6" : "h-5 w-5")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
