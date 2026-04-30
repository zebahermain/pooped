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

const goals: { id: Goal; label: string }[] = [
  { id: "ibs", label: "Track patterns" },
  { id: "weight", label: "Lose weight" },
  { id: "digestion", label: "Improve health" },
  { id: "curious", label: "Curious" },
];
const freqs: { id: FrequencyPref; label: string }[] = [
  { id: "once", label: "Once a day" },
  { id: "two_three", label: "2–3 times" },
  { id: "less", label: "Less than once" },
  { id: "irregular", label: "Varies" },
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const save = () => {
    saveProfile(profile);
    setEditing(false);
    if (user) pushProfileToCloud(user.id).catch(console.error);
    toast({ title: "Profile saved" });
  };

  return (
    <AppShell>
      <header className="mb-6 pr-14">
        <p className="text-sm text-muted-foreground">Your account</p>
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      <section className="flex items-center gap-4 py-4">
        <AvatarDisplay avatar={profile.avatar} size={40} />
        <div className="flex flex-col">
          <h2 className="text-[18px] font-bold leading-tight">{profile.name}</h2>
          <p className="text-[11px] text-muted-foreground">Member since {created}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Total logs" value={totalLogs} />
        <Stat label="Streak" value={`${streak.currentStreak}🔥`} />
        <Stat label="Avg score" value={avg} />
      </section>
      <p className="mt-2 text-center text-[12px] text-muted-foreground">
        🏆 Personal best: {streak.longestStreak} day streak
      </p>

      {hasHonestLoggerBadge() && (
        <section className="mt-4 flex items-start gap-3 rounded-3xl border border-success/30 bg-success/10 p-4">
          <div className="text-3xl">🏅</div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">Honest logger</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your data is clean — that makes your insights more accurate.
            </p>
          </div>
        </section>
      )}

      <section className="mt-6">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          This month
        </p>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Streak calendar</h3>
          <span className="text-xs text-muted-foreground">Tap a day to see its score</span>
        </div>
        <StreakMonthCalendar />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center">
          <h3 className="font-bold">Your Gut Personality</h3>
        </div>
        <PersonalityCard />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center">
          <h3 className="font-bold">Last Month's Report Card</h3>
        </div>
        <ReportCard />
      </section>

      {/* Account settings divider */}
      <div className="mt-8 mb-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Account settings
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Edit */}
      <section className="mt-6 rounded-3xl bg-card p-5 shadow-card border border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Preferences</h3>
          <button
            onClick={() => (editing ? save() : setEditing(true))}
            className="text-sm font-semibold text-primary"
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="mt-4 space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="mt-1 h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avatar
              </label>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setProfile({ ...profile, avatar: a.key })}
                    className={`flex aspect-square items-center justify-center rounded-xl border-2 transition-bounce ${
                      profile.avatar === a.key
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    }`}
                    aria-label={a.label}
                  >
                    <AvatarDisplay avatar={a.key} size={36} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Goal
              </label>
              <div className="mt-2 flex flex-col gap-2">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setProfile({ ...profile, goal: g.id })}
                    className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition-bounce ${
                      profile.goal === g.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Frequency
              </label>
              <div className="mt-2 flex flex-col gap-2">
                {freqs.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setProfile({ ...profile, frequencyPref: f.id })}
                    className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition-bounce ${
                      profile.frequencyPref === f.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={save}>
              Save changes
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Goal" value={goals.find((g) => g.id === profile.goal)?.label || "—"} />
            <Row
              label="Frequency"
              value={freqs.find((f) => f.id === profile.frequencyPref)?.label || "—"}
            />
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl bg-card p-5 shadow-card border border-border">
        <h3 className="font-bold">Account</h3>
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <Button variant="outline" className="w-full" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
        <h3 className="font-bold text-destructive">Danger zone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          variant="outline"
          className="mt-3 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => {
            setConfirmEmail("");
            setDeleteError(null);
            setShowDelete(true);
          }}
        >
          Delete account
        </Button>
      </section>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              <span className="block text-sm">This will permanently delete:</span>
              <ul className="ml-4 list-disc space-y-1 text-sm">
                <li>All your logs</li>
                <li>Your streaks</li>
                <li>Your reservoir</li>
                <li>Your account data</li>
              </ul>
              <span className="block text-sm font-medium text-destructive">
                This cannot be undone. Type your email to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            type="email"
            placeholder={user?.email ?? "you@example.com"}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className="h-11 rounded-xl"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleting ||
                !confirmEmail.trim() ||
                confirmEmail.trim().toLowerCase() !== (user?.email ?? "").toLowerCase()
              }
              onClick={async () => {
                setDeleting(true);
                setDeleteError(null);
                try {
                  await deleteAccount(confirmEmail.trim());
                  setShowDelete(false);
                  toast({
                    title: "Account deleted. We'll miss you 👋",
                  });
                  navigate("/auth", { replace: true });
                } catch (e) {
                  setDeleteError((e as Error).message ?? "Could not delete account");
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete forever"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col items-center rounded-2xl bg-card p-4 shadow-card border border-border">
    <span className="text-2xl font-bold text-primary">{value}</span>
    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

export default ProfilePage;
