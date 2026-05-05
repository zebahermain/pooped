import { useEffect, useMemo, useState } from "react";
import { Copy, Share2, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  buildSplatUrl,
  buildWhatsAppLink,
  createSplat,
  drainReservoir,
  getGrade,
  type DeliveryStyle,
  type ShareMethod,
  type Splat,
} from "@/lib/splats";
import { getRandomShareText } from "@/lib/shareMessages";
import { getProfile } from "@/lib/storage";
import { getCompletionForDate, acknowledgeCompletion } from "@/lib/challenges";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservoirUnits: number;
  onSent: () => void;
  prefillRecipient?: string;
}

interface IntensityTier {
  id: string;
  label: string;
  emoji: string;
  units: number;
  style: DeliveryStyle;
  description: string;
  glowFrom: string;
  glowTo: string;
}

// 6 intensity tiers mapped onto the existing 4 delivery_style enum values
// so we don't need a DB migration. Units are the cost drained from the
// reservoir for each tier (>= LAUNCH_THRESHOLD = 20).
const INTENSITY_TIERS: IntensityTier[] = [
  {
    id: "drip",
    label: "Drip",
    emoji: "💧",
    units: 20,
    style: "stealth",
    description: "Just a tease",
    glowFrom: "from-sky-400/20",
    glowTo: "to-sky-300/0",
  },
  {
    id: "puff",
    label: "Puff",
    emoji: "💨",
    units: 50,
    style: "gentle",
    description: "Soft & cheeky",
    glowFrom: "from-amber-400/20",
    glowTo: "to-amber-300/0",
  },
  {
    id: "blaze",
    label: "Blaze",
    emoji: "🔥",
    units: 100,
    style: "cannon",
    description: "Bring the heat",
    glowFrom: "from-orange-500/25",
    glowTo: "to-rose-400/0",
  },
  {
    id: "eruption",
    label: "Eruption",
    emoji: "🌋",
    units: 200,
    style: "cannon",
    description: "Volcanic",
    glowFrom: "from-red-500/25",
    glowTo: "to-orange-500/0",
  },
  {
    id: "overload",
    label: "Overload",
    emoji: "⚡",
    units: 350,
    style: "monsoon",
    description: "Total chaos",
    glowFrom: "from-fuchsia-500/25",
    glowTo: "to-violet-500/0",
  },
  {
    id: "apocalypse",
    label: "Apocalypse",
    emoji: "☠️",
    units: 500,
    style: "monsoon",
    description: "Total annihilation",
    glowFrom: "from-purple-600/30",
    glowTo: "to-pink-500/0",
  },
];

const RECIPIENT_PLACEHOLDERS = [
  "Name your victim 😈",
  "Who's getting hit? 💩",
  "Who deserves the splat?",
];

type Stage = "pick" | "share";

export const SendSheet = ({
  open,
  onOpenChange,
  reservoirUnits,
  onSent,
  prefillRecipient,
}: Props) => {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("pick");
  const [recipient, setRecipient] = useState("");
  const [senderNameGuest, setSenderNameGuest] = useState("");
  const [shareMethod, setShareMethod] = useState<ShareMethod | null>(null);
  const [launching, setLaunching] = useState(false);
  const [resultSplat, setResultSplat] = useState<Splat | null>(null);
  const [sharing, setSharing] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState(
    RECIPIENT_PLACEHOLDERS[0],
  );

  useEffect(() => {
    if (!open) {
      setStage("pick");
      setRecipient("");
      setSenderNameGuest("");
      setShareMethod(null);
      setLaunching(false);
      setResultSplat(null);
      setSharing(false);
    } else {
      const idx = Math.floor(Math.random() * RECIPIENT_PLACEHOLDERS.length);
      setInputPlaceholder(RECIPIENT_PLACEHOLDERS[idx]);
      if (prefillRecipient) setRecipient(prefillRecipient);
    }
  }, [open, prefillRecipient]);

  const profile = useMemo(() => getProfile(), []);
  const resolvedSenderName =
    (user ? profile?.name : senderNameGuest)?.trim() || "Someone";

  const recipientLocked = Boolean(prefillRecipient);
  const recipientReady = recipient.trim().length > 0;
  const senderReady = user || senderNameGuest.trim().length > 0;

  const handlePickIntensity = async (tier: IntensityTier) => {
    if (launching) return;
    if (!recipientReady) {
      toast({
        title: "Who gets it?",
        description: "Add a recipient name first.",
      });
      return;
    }
    if (!senderReady) {
      toast({
        title: "Add your name",
        description: "Tell them who launched this.",
      });
      return;
    }
    if (reservoirUnits < tier.units) {
      toast({
        title: "Not enough fuel",
        description: `You need ${tier.units} units for ${tier.label}.`,
      });
      return;
    }

    setLaunching(true);
    try {
      const splat = await createSplat({
        recipient_name: recipient.trim(),
        sender_name_override: user ? undefined : senderNameGuest.trim(),
        units: tier.units,
        style: tier.style,
      });
      await drainReservoir(tier.units);
      setResultSplat(splat);

      const completion = getCompletionForDate();
      if (completion && !completion.acknowledged) {
        await acknowledgeCompletion(completion.date);
      }

      setStage("share");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send your splat.";
      toast({ title: "Launch failed", description: msg, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  const handleSharePick = async (method: ShareMethod) => {
    if (!resultSplat || sharing) return;
    setShareMethod(method);
    setSharing(true);

    const fullUrl = buildSplatUrl(resultSplat.id);
    const shortId = resultSplat.id.substring(0, 8);
    const shortUrl = `${window.location.origin}/splat/${shortId}`;
    const grade = getGrade(resultSplat.units);
    const text = getRandomShareText({
      recipient: resultSplat.recipient_name,
      sender: resolvedSenderName,
      units: resultSplat.units,
      grade,
      splatUrl: shortUrl,
    });

    if (method === "copy") {
      await navigator.clipboard?.writeText(fullUrl).catch(() => {});
      toast({ title: "Link copied!", description: "Paste it anywhere 😈" });
    } else if (method === "whatsapp") {
      window.open(buildWhatsAppLink(text), "_blank", "noopener,noreferrer");
    } else if (method === "share") {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Pooped!", text, url: fullUrl });
        } catch (err) {
          /* user cancelled */
        }
      } else {
        await navigator.clipboard?.writeText(fullUrl).catch(() => {});
        toast({
          title: "Link copied!",
          description: "Sharing not supported, link copied instead.",
        });
      }
    }

    onSent();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[32px] border-border bg-background p-6 md:p-8"
        data-testid="send-sheet"
      >
        <div className="mx-auto max-w-md">
          {stage === "pick" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                  Choose your intensity
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  How Much? 💩
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  You've got{" "}
                  <span className="font-black text-foreground">
                    {reservoirUnits}
                  </span>{" "}
                  units in the tank.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {recipientLocked ? (
                  <div
                    className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-3"
                    data-testid="send-recipient-locked"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Hitting
                    </span>
                    <span className="text-base font-black text-foreground">
                      {recipient}
                    </span>
                  </div>
                ) : (
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={inputPlaceholder}
                    maxLength={40}
                    className="h-14 rounded-2xl border-2 bg-muted/30 px-5 text-base font-bold transition-all focus:border-primary/50 focus:bg-background text-foreground"
                    autoFocus
                    data-testid="send-recipient-input"
                  />
                )}

                {!user && (
                  <Input
                    value={senderNameGuest}
                    onChange={(e) => setSenderNameGuest(e.target.value)}
                    placeholder="Your name"
                    maxLength={40}
                    className="h-14 rounded-2xl border-2 bg-muted/30 px-5 text-base font-bold transition-all focus:border-primary/50 focus:bg-background text-foreground"
                    data-testid="send-sender-input"
                  />
                )}
              </div>

              <div
                className="mt-6 grid grid-cols-2 gap-3"
                data-testid="intensity-grid"
              >
                {INTENSITY_TIERS.map((tier) => {
                  const enabled = reservoirUnits >= tier.units;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => handlePickIntensity(tier)}
                      disabled={!enabled || launching}
                      className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-[22px] border-2 p-4 text-left transition-all active:scale-[0.97]
                        ${
                          enabled
                            ? "border-transparent bg-muted/25 hover:border-primary/40 hover:bg-muted/40"
                            : "cursor-not-allowed border-dashed border-muted-foreground/20 bg-muted/10 opacity-50"
                        }
                      `}
                      data-testid={`intensity-${tier.id}`}
                    >
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${tier.glowFrom} ${tier.glowTo}`}
                      />
                      <span className="relative text-3xl leading-none">
                        {tier.emoji}
                      </span>
                      <div className="relative mt-1">
                        <span className="block text-base font-black tracking-tight text-foreground">
                          {tier.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                          {tier.description}
                        </span>
                      </div>
                      <span
                        className={`relative mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                          enabled
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {tier.units} units
                      </span>
                    </button>
                  );
                })}
              </div>

              {launching && (
                <p className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Launching…
                </p>
              )}
            </div>
          )}

          {stage === "share" && resultSplat && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStage("pick");
                    setResultSplat(null);
                  }}
                  className="rounded-full bg-muted/50 p-1.5 text-foreground"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  Splat ready 💥
                </h2>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Now send it to {resultSplat.recipient_name}.
              </p>

              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Send via
              </p>

              <div className="mt-4 flex justify-between gap-6 px-2">
                <button
                  onClick={() => handleSharePick("whatsapp")}
                  disabled={sharing}
                  className="group flex flex-col items-center gap-3 transition-transform active:scale-90 disabled:opacity-50"
                  data-testid="share-whatsapp"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all group-hover:scale-110">
                    <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-foreground">
                    WhatsApp
                  </span>
                </button>

                <button
                  onClick={() => handleSharePick("copy")}
                  disabled={sharing}
                  className="group flex flex-col items-center gap-3 transition-transform active:scale-90 disabled:opacity-50"
                  data-testid="share-copy"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 text-foreground shadow-md transition-all group-hover:scale-110 group-hover:bg-muted/60">
                    <Copy className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">
                    Copy link
                  </span>
                </button>

                <button
                  onClick={() => handleSharePick("share")}
                  disabled={sharing}
                  className="group flex flex-col items-center gap-3 transition-transform active:scale-90 disabled:opacity-50"
                  data-testid="share-more"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all group-hover:scale-110">
                    <Share2 className="h-7 w-7" strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">
                    Share
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
