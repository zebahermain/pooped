import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import { StreakMonthCalendar } from "@/components/StreakMonthCalendar";
import { PersonalityCard } from "@/components/PersonalityCard";
import { ReportCard } from "@/components/ReportCard";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { pushProfileToCloud } from "@/lib/profileSync";
import { hasHonestLoggerBadge } from "@/lib/honesty";
import { deleteAccount } from "@/lib/deleteAccount";
import { AVATAR_OPTIONS, AvatarDisplay } from "@/lib/avatars";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  getAverageScore,
  getLogs,
  getProfile,
  getStreakData,
  saveProfile,
  type FrequencyPref,
  type Goal,
  type Profile,
} from "@/lib/storage";

const goals: { id: Goal; label: string; emoji: string }[] = [
  { id: "track_patterns", label: "Track patterns", emoji: "📊" },
  { id: "understand_gut", label: "Understand my gut", emoji: "💩" },
  { id: "improve_health", label: "Improve gut health", emoji: "🌱" },
  { id: "manage_weight", label: "Manage my weight", emoji: "⚖️" },
  { id: "manage_condition", label: "Managing IBS/condition", emoji: "🤒" },
  { id: "curious", label: "Just curious", emoji: "👀" },
];

const freqs: { id: FrequencyPref; label: string }[] = [
  { id: "once", label: "Once a day" },
  { id: "two_three", label: "2-3 times a day" },
  { id: "alternate", label: "Every alternate day" },
  { id: "varies", label: "Varies a lot" },
  { id: "irregular", label: "Varies" }, // Legacy
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (!p) {
      navigate("/onboarding", { replace: true });
      return;
    }
    setProfile(p);
  }, [navigate]);

  if (!profile) return null;

  const totalLogs = getLogs().length;
  const streak = getStreakData();
  const avg = getAverageScore();
  const created = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "long", day: "numeric", year: "numeric",
  });

  const save = () => {
    saveProfile(profile);
    setEditing(false);
    if (user) pushProfileToCloud(user.id).catch(console.error);
    toast({ title: "Profile saved" });
  };

  const toggleGoal = (id: Goal) => {
    const current = profile.goals || [];
    const next = current.includes(id) ? current.filter(g => g !== id) : [...current, id];
    setProfile({ ...profile, goals: next });
  };

  return (
    <AppShell showThemeToggle={false}>
      <section className="flex items-center gap-4 py-6">
        <div className="size-20 rounded-[24px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20 flex items-center justify-center text-4xl">
          <AvatarDisplay avatar={profile.avatar} size={48} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-foreground">{profile.name}</h1>
          <p className="text-sm font-medium text-muted-foreground">Member since {created}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-2 grid grid-cols-3 gap-3">
        <Stat label="Total logs" value={totalLogs} />
        <Stat label="Streak" value={`${streak.currentStreak}🔥`} />
        <Stat label="Avg score" value={avg} />
      </section>
      <p className="mt-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
        🏆 Personal best: {streak.longestStreak} day streak
      </p>

      {hasHonestLoggerBadge() && (
        <section className="mt-6 flex items-start gap-4 rounded-3xl border border-success/20 bg-success/5 p-5">
          <div className="text-3xl">🏅</div>
          <div className="flex-1">
            <h3 className="font-black text-foreground">Honest logger</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground leading-relaxed">
              Your data is clean — that makes your insights more accurate.
            </p>
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Your Progress</p>
            <h3 className="text-xl font-black tracking-tight">Streak calendar</h3>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Tap a day</span>
        </div>
        <div className="rounded-3xl border border-border bg-card/50 p-1 shadow-sm">
          <StreakMonthCalendar />
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Identity</p>
          <h3 className="text-xl font-black tracking-tight">Your Gut Personality</h3>
        </div>
        <PersonalityCard />
      </section>

      <section className="mt-10">
        <div className="mb-4 px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Insights</p>
          <h3 className="text-xl font-black tracking-tight">Last Month's Report</h3>
        </div>
        <ReportCard />
      </section>

      <div className="mt-12 mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Settings</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>

      <section className="rounded-[32px] bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">Preferences</h3>
          <button onClick={() => (editing ? save() : setEditing(true))} className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
            {editing ? "Save" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="mt-6 space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-2 h-12 rounded-2xl bg-muted/30 border-none font-bold" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avatar</label>
              <div className="mt-3 grid grid-cols-5 gap-3">
                {AVATAR_OPTIONS.map((a) => (
                  <button key={a.key} onClick={() => setProfile({ ...profile, avatar: a.key })} className={`flex aspect-square items-center justify-center rounded-2xl border-2 transition-all ${profile.avatar === a.key ? "border-primary bg-primary/10 scale-105" : "border-transparent bg-muted/30"}`}>
                    <AvatarDisplay avatar={a.key} size={32} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goals</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {goals.map((g) => (
                  <button key={g.id} onClick={() => toggleGoal(g.id)} className={`rounded-full px-4 py-2 text-xs font-bold border transition-all ${(profile.goals || []).includes(g.id) ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground"}`}>
                    {g.emoji} {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequency</label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {freqs.map((f) => (
                  <button key={f.id} onClick={() => setProfile({ ...profile, frequencyPref: f.id })} className={`rounded-xl border-2 p-3 text-left text-xs font-bold transition-all ${profile.frequencyPref === f.id ? "border-primary bg-primary/10" : "border-transparent bg-muted/30"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="hero" size="lg" className="w-full h-14 rounded-2xl font-black text-lg" onClick={save}>Save changes</Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <Row label="Goals" value={(profile.goals || []).map(gid => goals.find(g => g.id === gid)?.label).filter(Boolean).join(", ") || goals.find(g => g.id === profile.goal)?.label || "—"} />
            <Row label="Frequency" value={freqs.find((f) => f.id === profile.frequencyPref)?.label || "—"} />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-[32px] bg-card p-6 shadow-sm border border-border">
        <h3 className="text-lg font-black tracking-tight">Account</h3>
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Signed in as <span className="font-black text-foreground">{user?.email}</span></p>
          <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-border/60" onClick={() => signOut()}>Sign out</Button>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-destructive/20 bg-destructive/5 p-6 mb-20">
        <h3 className="text-lg font-black tracking-tight text-destructive">Danger zone</h3>
        <p className="mt-2 text-sm font-medium text-muted-foreground leading-relaxed">Permanently delete your account and all associated data. This cannot be undone.</p>
        <Button variant="outline" className="mt-4 w-full h-12 rounded-2xl font-bold border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => { setConfirmEmail(""); setDeleteError(null); setShowDelete(true); }}>Delete account</Button>
      </section>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-[32px] border-none bg-background p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight"><AlertTriangle className="h-6 w-6 text-destructive" />Wait!</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2 text-left">
              <span className="block text-base font-bold text-foreground">This will permanently delete:</span>
              <ul className="ml-4 list-disc space-y-2 text-sm font-medium text-muted-foreground"><li>All your logs</li><li>Your streaks</li><li>Your reservoir</li><li>Your account data</li></ul>
              <span className="block text-sm font-black uppercase tracking-wider text-destructive">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="email" placeholder={user?.email ?? "Type email to confirm"} value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="h-12 rounded-2xl bg-muted/40 border-none font-bold" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} />
          {deleteError && <p className="text-sm font-bold text-destructive px-1">{deleteError}</p>}
          <AlertDialogFooter className="mt-4 gap-3 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting} className="h-12 rounded-2xl font-bold border-border/60">Cancel</Button>
            <Button variant="destructive" disabled={deleting || !confirmEmail.trim() || confirmEmail.trim().toLowerCase() !== (user?.email ?? "").toLowerCase()} onClick={async () => { setDeleting(true); setDeleteError(null); try { await deleteAccount(confirmEmail.trim()); setShowDelete(false); toast({ title: "Account deleted. We'll miss you 👋" }); navigate("/auth", { replace: true }); } catch (e) { setDeleteError((e as Error).message ?? "Could not delete account"); } finally { setDeleting(false); } }} className="h-12 rounded-2xl font-black">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete forever"}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col items-center rounded-3xl bg-card p-4 shadow-sm border border-border">
    <span className="text-2xl font-black tracking-tight text-primary leading-none">{value}</span>
    <span className="mt-2 text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center gap-3">
    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-black text-foreground text-right">{value}</span>
  </div>
);

export default ProfilePage;
