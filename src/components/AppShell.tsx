import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

export const AppShell = ({
  children,
  showThemeToggle = true,
}: {
  children: ReactNode;
  showThemeToggle?: boolean;
}) => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      {showThemeToggle && (
        <div className="absolute right-4 top-4 z-30">
          <ThemeToggle />
        </div>
      )}
      <main className="flex-1 px-5 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
};
