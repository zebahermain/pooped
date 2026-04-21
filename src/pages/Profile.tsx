import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { pushProfileToCloud } from "@/lib/profileSync";
import { hasHonestLoggerBadge } from "@/lib/honesty";
import {
  getAverageScore,
  getLogs,
  getProfile,
  getStreakData,
  saveProfile,
  type AvatarEmoji,
  type FrequencyPref,
  type Goal,
  type Profile,
} from "@/lib/storage";

const avatars: AvatarEmoji[] = ["💩", "🦠", "🌿", "🏋️", "💊", "🧘"];
const goals: { id: Goal; label: string }[] = [
  { id: "digestion", label: "Improve digestion" },
  { id: "ibs", label: "Track IBS / IBD" },
  { id: "weight", label: "Lose weight & gut health" },
  { id: "curious", label: "Just curious" },
];
const freqs: { id: FrequencyPref; label: string }[] = [
  { id: "once", label: "Once a day" },
  { id: "two_three", label: "2–3 times a day" },
  { id: "less", label: "Less than once a day" },
  { id: "irregular", label: "Irregularly" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);

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

      <section className="flex flex-col items-center rounded-3xl bg-card p-6 shadow-card border border-border">
        <div className="text-6xl">{profile.avatar}</div>
        <h2 className="mt-3 text-xl font-bold">{profile.name}</h2>
        <p className="text-xs text-muted-foreground">Member since {created}</p>
      </section>

      {/* Stats */}
      <section className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Total logs" value={totalLogs} />
        <Stat label="Streak" value={`${streak.currentStreak}🔥`} />
        <Stat label="Avg score" value={avg} />
      </section>

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
                {avatars.map((a) => (
                  <button
                    key={a}
                    onClick={() => setProfile({ ...profile, avatar: a })}
                    className={`flex aspect-square items-center justify-center rounded-xl border-2 text-2xl transition-bounce ${
                      profile.avatar === a
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    }`}
                  >
                    {a}
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
        {user ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              You're using Pooped as a guest. Create an account to sync across devices and never lose your data.
            </p>
            <Button variant="hero" className="w-full" onClick={() => navigate("/auth")}>
              Create free account →
            </Button>
          </div>
        )}
      </section>
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
