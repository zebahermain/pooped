import { useEffect, useMemo, useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LaunchAnimation } from "@/components/LaunchAnimation";
import {
  DELIVERY_STYLES,
  buildIMessageLink,
  buildShareText,
  buildSplatUrl,
  buildWhatsAppLink,
  createSplat,
  drainReservoir,
  getGrade,
  type DeliveryStyle,
  type ShareMethod,
  type Splat,
} from "@/lib/splats";
import { getProfile } from "@/lib/storage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservoirUnits: number;
  onSent: () => void; // Parent refreshes reservoir after drain.
}

type Step = 1 | 2 | 3;

/**
 * 3-step bottom sheet for the viral send flow.
 *   Step 1 — Who deserves this? (recipient + share method selector)
 *   Step 2 — Pick your weapon (2×2 style grid)
 *   Step 3 — Full-screen launch animation, then auto-share.
 *
 * All reservoir units are sent on launch (simple "dump-the-tank" model —
 * matches the viral send brief).
 */
export const SendSheet = ({ open, onOpenChange, reservoirUnits, onSent }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [recipient, setRecipient] = useState("");
  const [senderNameGuest, setSenderNameGuest] = useState("");
  const [shareMethod, setShareMethod] = useState<ShareMethod | null>(null);
  const [style, setStyle] = useState<DeliveryStyle | null>(null);
  const [launching, setLaunching] = useState(false);
  const [resultSplat, setResultSplat] = useState<Splat | null>(null);

  // Reset sheet whenever it closes.
  useEffect(() => {
    if (!open) {
      setStep(1);
      setRecipient("");
      setSenderNameGuest("");
      setShareMethod(null);
      setStyle(null);
      setLaunching(false);
      setResultSplat(null);
    }
  }, [open]);

  const profile = useMemo(() => getProfile(), []);
  const resolvedSenderName =
    (user ? profile?.name : senderNameGuest)?.trim() || "Someone";

  const canStep1Continue =
    recipient.trim().length > 0 &&
    shareMethod !== null &&
    (user || senderNameGuest.trim().length > 0);

  const handleStep1Select = (method: ShareMethod) => {
    if (!recipient.trim() || (!user && !senderNameGuest.trim())) {
      toast({
        title: "Who gets it?",
        description: user ? "Add a recipient name first." : "Add your name and the recipient's name.",
      });
      return;
    }
    setShareMethod(method);
    setStep(2);
  };

  const handlePickStyle = async (chosen: DeliveryStyle) => {
    setStyle(chosen);
    setStep(3);
    setLaunching(true);
    try {
      const splat = await createSplat({
        recipient_name: recipient.trim(),
        sender_name_override: user ? undefined : senderNameGuest.trim(),
        units: reservoirUnits,
        style: chosen,
      });
      await drainReservoir(reservoirUnits);
      setResultSplat(splat);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send your splat.";
      toast({ title: "Launch failed", description: msg, variant: "destructive" });
      setLaunching(false);
      setStep(2);
    }
  };

  const onAnimationComplete = () => {
    if (!resultSplat || !shareMethod) return;
    const splatUrl = buildSplatUrl(resultSplat.id);
    const grade = getGrade(resultSplat.units);
    const text = buildShareText({
      recipient: resultSplat.recipient_name,
      sender: resolvedSenderName,
      units: resultSplat.units,
      grade,
      splatUrl,
    });

    if (shareMethod === "copy") {
      navigator.clipboard?.writeText(text).catch(() => {});
      toast({ title: "Link copied!", description: "Paste it anywhere 😈" });
    } else if (shareMethod === "whatsapp") {
      window.open(buildWhatsAppLink(text), "_blank", "noopener,noreferrer");
    } else if (shareMethod === "imessage") {
      window.location.href = buildIMessageLink(text);
    }

    onSent();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-border bg-background p-6"
        data-testid="send-sheet"
      >
        {/* Tiny progress strip */}
        <div className="mb-6 flex h-1.5 gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-full flex-1 rounded-full transition-all ${
                s <= step ? "gradient-warm" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-extrabold">Who deserves this? 😈</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Just a name — no signup needed for them.
            </p>

            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Their name (so they know who got hit)"
              maxLength={40}
              className="mt-5 h-14 rounded-2xl text-base"
              autoFocus
              data-testid="send-recipient-input"
            />

            {!user && (
              <Input
                value={senderNameGuest}
                onChange={(e) => setSenderNameGuest(e.target.value)}
                placeholder="Your name (so they know who sent it)"
                maxLength={40}
                className="mt-3 h-14 rounded-2xl text-base"
                data-testid="send-sender-input"
              />
            )}

            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Send via →
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <button
                onClick={() => handleStep1Select("whatsapp")}
                disabled={!canStep1Continue && !recipient.trim()}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-4 shadow-card transition-bounce hover:scale-[1.02] hover:border-primary/40 disabled:opacity-40"
                data-testid="share-whatsapp"
              >
                <MessageCircle className="h-6 w-6 text-[hsl(142,70%,42%)]" />
                <span className="text-xs font-bold">WhatsApp</span>
              </button>
              <button
                onClick={() => handleStep1Select("imessage")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-4 shadow-card transition-bounce hover:scale-[1.02] hover:border-primary/40 disabled:opacity-40"
                data-testid="share-imessage"
              >
                <span className="text-2xl leading-none">💬</span>
                <span className="text-xs font-bold">iMessage</span>
              </button>
              <button
                onClick={() => handleStep1Select("copy")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-4 shadow-card transition-bounce hover:scale-[1.02] hover:border-primary/40 disabled:opacity-40"
                data-testid="share-copy"
              >
                <Copy className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold">Copy link</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-extrabold">Choose your style</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How should {recipient.trim()} get hit?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3" data-testid="style-grid">
              {DELIVERY_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handlePickStyle(s.id)}
                  disabled={launching}
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-transparent bg-card p-4 text-left shadow-card transition-bounce hover:scale-[1.02] hover:border-primary/50 disabled:opacity-50"
                  data-testid={`style-${s.id}`}
                >
                  <span className="text-4xl leading-none">{s.emoji}</span>
                  <span className="text-sm font-bold">{s.label}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 w-full"
              onClick={() => setStep(1)}
              disabled={launching}
            >
              ← Back
            </Button>
          </div>
        )}

        {step === 3 && launching && (
          <LaunchAnimation
            units={reservoirUnits}
            onComplete={onAnimationComplete}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
