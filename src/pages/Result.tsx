import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GutScoreRing } from "@/components/GutScoreRing";
import { toast } from "@/hooks/use-toast";

const Result = () => {
  const { score: scoreParam } = useParams();
  const navigate = useNavigate();
  const score = Math.max(0, Math.min(100, parseInt(scoreParam || "0", 10)));
  const [message, setMessage] = useState({ title: "", tip: "" });

  useEffect(() => {
    if (score > 70) {
      setMessage({
        title: "Looking good! Your gut is happy today 🟢",
        tip: "Keep doing what you're doing — hydrate and stay consistent.",
      });
    } else if (score >= 40) {
      setMessage({
        title: "Room to improve 💧",
        tip: "Try drinking more water and adding fiber-rich foods like oats and berries.",
      });
    } else {
      setMessage({
        title: "Rough day. Be gentle with yourself 🔴",
        tip: "Stay hydrated, avoid heavy/processed food, and rest. If symptoms persist, check with a doctor.",
      });
    }
  }, [score]);

  const share = async () => {
    const text = `My Gut Score today: ${score}/100 — tracked with Pooped 💩`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Score copied to clipboard." });
    } catch {
      toast({ title: "Couldn't copy", description: text });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-10 animate-fade-in">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Today's score
        </p>
        <h1 className="mt-2 text-3xl font-bold">Here's how you did</h1>
      </div>

      <div className="mt-8 flex justify-center">
        <GutScoreRing score={score} />
      </div>

      <div className="mt-8 rounded-3xl bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">{message.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {message.tip}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button variant="hero" size="xl" className="w-full" onClick={share}>
          Share my score 📤
        </Button>
        <Button
          variant="soft"
          size="xl"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Back to home
        </Button>
      </div>
    </div>
  );
};

export default Result;
