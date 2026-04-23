import { useEffect, useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  computeReportCard,
  fetchExistingReportCard,
  persistReportCard,
  previousMonthAnchor,
  requestAiComment,
  type MonthlyReportCard,
} from "@/lib/reportCard";
import { getPersonality } from "@/lib/personality";
import { supabase } from "@/integrations/supabase/client";

/**
 * Last Month's Report Card — Feature 4.
 *
 * School-report-card aesthetic. Free tier sees grades + a blurred
 * "Teacher's Comment" preview. Pro tier gets the real Claude-generated
 * 3-sentence comment, fetched once per month and cached server-side.
 */

const gradeColor = (g: string): string => {
  if (g === "A+" || g === "A") return "text-success";
  if (g === "B") return "text-primary";
  if (g === "C") return "text-warning";
  return "text-destructive";
};

export const ReportCard = () => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [card, setCard] = useState<MonthlyReportCard | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const monthAnchor = useMemo(() => previousMonthAnchor(), []);

  useEffect(() => {
    const local = computeReportCard(monthAnchor);
    setCard(local);

    // Fetch Pro flag + any cached AI comment for signed-in users.
    if (user) {
      (async () => {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("is_pro")
            .eq("id", user.id)
            .maybeSingle();
          setIsPro(!!prof?.is_pro);
          await persistReportCard(user.id, local);
          const existing = await fetchExistingReportCard(user.id, local.month);
          if (existing?.ai_comment) {
            setCard({ ...local, aiComment: existing.ai_comment });
          }
        } catch (e) {
          console.warn("ReportCard sync error:", e);
        }
      })();
    }
  }, [user, monthAnchor]);

  if (!card) return null;

  const loadAiComment = async () => {
    if (!user || !isPro || commentLoading) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const personality = getPersonality().personality.name;
      const comment = await requestAiComment(card, personality);
      if (comment) {
        setCard({ ...card, aiComment: comment });
      } else {
        setCommentError("Couldn't generate your comment — try again later.");
      }
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <section
      className="rounded-3xl border-2 border-border bg-card p-5 shadow-card"
      data-testid="report-card"
    >
      <header className="text-center">
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Gut Health Report Card
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{card.monthLabel}</p>
      </header>

      <div className="mt-4 h-px bg-border" />

      <div className="mt-4 space-y-2 text-sm">
        <GradeRow label="Consistency" grade={card.consistencyGrade} />
        <GradeRow label="Color Health" grade={card.colorHealthGrade} />
        <GradeRow label="Frequency" grade={card.frequencyGrade} />
        <GradeRow label="Streak" grade={card.streakGrade} />
      </div>

      <div className="mt-4 h-px bg-border" />

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-base font-bold">Overall GPA</span>
        <span className="text-xl font-extrabold text-primary">
          {card.overallGPA.toFixed(2)} / 4.0
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Days attended: {card.daysLogged} / {card.daysInMonth}
      </p>

      {/* Teacher's comment */}
      <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Teacher's Comment
        </div>

        {card.aiComment ? (
          <p
            className="mt-2 text-sm leading-relaxed text-foreground"
            data-testid="teacher-comment"
          >
            {card.aiComment}
          </p>
        ) : isPro && user ? (
          <div className="mt-2">
            <button
              onClick={loadAiComment}
              disabled={commentLoading}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary disabled:opacity-60"
              data-testid="load-teacher-comment"
            >
              {commentLoading ? "Writing your comment…" : "Generate my comment →"}
            </button>
            {commentError && (
              <p className="mt-2 text-xs text-destructive">{commentError}</p>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <p className="select-none text-sm leading-relaxed text-muted-foreground blur-sm">
              Your consistency is genuinely impressive this month — logging on
              {" "}{card.daysLogged} days out of {card.daysInMonth} is no small
              feat. Keep an eye on the…
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>
                Unlock with Pro to read your personalised gut analysis →
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const GradeRow = ({ label, grade }: { label: string; grade: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-foreground">{label}</span>
    <span className={`text-base font-extrabold ${gradeColor(grade)}`}>
      {grade}
    </span>
  </div>
);
