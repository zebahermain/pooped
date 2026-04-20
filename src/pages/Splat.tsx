import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchSplat, getDeliveryStyleMeta, type Splat } from "@/lib/splats";

const Splat = () => {
  const { id } = useParams<{ id: string }>();
  const [splat, setSplat] = useState<Splat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"fly" | "land">("fly");

  useEffect(() => {
    if (!id) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchSplat(id)
      .then((s) => {
        if (cancelled) return;
        if (!s) setError("This splat doesn't exist (or was deleted).");
        else {
          setSplat(s);
          document.title = `You got shat on by ${s.sender_name || "someone"} 💩`;
        }
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? "Couldn't load this splat.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Trigger landing phase after the arc finishes
  useEffect(() => {
    if (!splat) return;
    const t = setTimeout(() => setPhase("land"), 1800);
    return () => clearTimeout(t);
  }, [splat]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <div className="text-5xl animate-bounce">💩</div>
        <p className="mt-4 text-sm text-muted-foreground">Loading your splat…</p>
      </div>
    );
  }

  if (error || !splat) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl">🚽</div>
        <h1 className="mt-4 text-2xl font-bold">Nothing here</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "This splat doesn't exist."}
        </p>
        <Link to="/" className="mt-6">
          <Button variant="hero" size="lg">Visit Pooped</Button>
        </Link>
      </div>
    );
  }

  const styleMeta = getDeliveryStyleMeta(splat.style);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background px-6 py-10">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Animation stage */}
      <div className={`relative mt-6 h-72 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-amber-900/20 ${phase === "land" ? "animate-screen-shake" : ""}`}>
        {/* Generic avatar (the recipient) */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-4xl shadow-warm">
              😀
            </div>
            {phase === "land" && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-5xl animate-splat-pop">
                💩
              </div>
            )}
          </div>
          <div className="mt-2 rounded-full bg-card px-3 py-1 text-xs font-bold shadow-card border border-border">
            {splat.recipient_name}
          </div>
        </div>

        {/* Flying poo */}
        {phase === "fly" && (
          <span
            className="pointer-events-none absolute text-5xl"
            style={{
              left: 0,
              top: "50%",
              animation: "splat-arc 1800ms cubic-bezier(0.4, 0, 0.6, 1) forwards",
            }}
          >
            💩
          </span>
        )}

        {/* SPLAT label after landing */}
        {phase === "land" && (
          <div className="pointer-events-none absolute inset-x-0 top-6 text-center">
            <div className="text-5xl font-black text-amber-600 drop-shadow-md animate-splat-pop">
              SPLAT
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center animate-fade-in">
        <p className="text-sm text-muted-foreground">You just got shat on by</p>
        <h1 className="mt-1 text-3xl font-extrabold">
          {splat.sender_avatar} {splat.sender_name || "Someone"} 💩
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
          {styleMeta?.emoji} {splat.units} units · {styleMeta?.label}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-10">
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Download Pooped to retaliate →
        </p>
        <Link to="/onboarding">
          <Button variant="hero" size="xl" className="w-full">
            Get Pooped 💩
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="lg" className="w-full">
            Already have an account? Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Splat;
