import { useEffect, useMemo, useState } from "react";
import { Copy, Share2, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LaunchAnimation } from "@/components/LaunchAnimation";
import {
  DELIVERY_STYLES,
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
  onSent: () => void;
}

type Step = 1 | 2 | 3;

export const SendSheet = ({ open, onOpenChange, reservoirUnits, onSent }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [recipient, setRecipient] = useState("");
  const [senderNameGuest, setSenderNameGuest] = useState("");
  const [shareMethod, setShareMethod] = useState<ShareMethod | null>(null);
  const [style, setStyle] = useState<DeliveryStyle | null>(null);
  const [launching, setLaunching] = useState(false);
  const [resultSplat, setResultSplat] = useState<Splat | null>(null);

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
  const resolvedSenderName = (user ? profile?.name : senderNameGuest)?.trim() || "Someone";

  const canStep1Continue = recipient.trim().length > 0 && (user || senderNameGuest.trim().length > 0);

  const handleStep1Select = (method: ShareMethod) => {
    if (!canStep1Continue) {
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

  const onAnimationComplete = async () => {
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
      await navigator.clipboard?.writeText(text).catch(() => {});
      toast({ title: "Link copied!", description: "Paste it anywhere 😈" });
    } else if (shareMethod === "whatsapp") {
      window.open(buildWhatsAppLink(text), "_blank", "noopener,noreferrer");
    } else if (shareMethod === "share") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Pooped!',
            text: text,
            url: splatUrl,
          });
        } catch (err) {
          // User cancelled or error
        }
      } else {
        await navigator.clipboard?.writeText(text).catch(() => {});
        toast({ title: "Link copied!", description: "Sharing not supported, link copied instead." });
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
          {/* Tiny progress strip */}
          <div className="mb-8 flex h-1.5 gap-1.5">
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-2xl font-black tracking-tight">Who deserves this? 😈</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Just a name — no signup needed for them.
              </p>

              <div className="mt-6 space-y-3">
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient's name"
                  maxLength={40}
                  className="h-14 rounded-2xl border-2 bg-muted/30 px-5 text-base font-bold transition-all focus:border-primary/50 focus:bg-background"
                  autoFocus
                  data-testid="send-recipient-input"
                />

                {!user && (
                  <Input
                    value={senderNameGuest}
                    onChange={(e) => setSenderNameGuest(e.target.value)}
                    placeholder="Your name"
                    maxLength={40}
                    className="h-14 rounded-2xl border-2 bg-muted/30 px-5 text-base font-bold transition-all focus:border-primary/50 focus:bg-background"
                    data-testid="send-sender-input"
                  />
                )}
              </div>

              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Send via
              </p>
              
              <div className="mt-4 flex justify-between gap-6 px-2">
                {/* WhatsApp */}
                <button
                  onClick={() => handleStep1Select("whatsapp")}
                  className="group flex flex-col items-center gap-3 transition-transform active:scale-90"
                  data-testid="share-whatsapp"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all group-hover:scale-110">
                    <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={() => handleStep1Select("copy")}
                  className="group flex flex-col items-center gap-3 transition-transform active:scale-90"
                  data-testid="share-copy"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 text-foreground shadow-md transition-all group-hover:scale-110 group-hover:bg-muted/60">
                    <Copy className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold">Copy link</span>
                </button>

                {/* Share (More) */}
                <button
                  onClick={() => handleStep1Select("share")}
                  className="group flex flex-col items-center gap-3 transition-transform active:scale-90"
                  data-testid="share-more"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all group-hover:scale-110">
                    <Share2 className="h-7 w-7" strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-bold">Share</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="rounded-full bg-muted/50 p-1.5">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-2xl font-black tracking-tight">Choose your weapon</h2>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                How should {recipient.trim()} get hit?
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4" data-testid="style-grid">
                {DELIVERY_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handlePickStyle(s.id)}
                    disabled={launching}
                    className="flex flex-col items-start gap-3 rounded-[24px] border-2 border-transparent bg-muted/20 p-5 text-left transition-all active:scale-95 hover:border-primary/40 hover:bg-muted/30 disabled:opacity-50"
                    data-testid={`style-${s.id}`}
                  >
                    <span className="text-4xl leading-none">{s.emoji}</span>
                    <div className="mt-2">
                      <span className="block text-sm font-black uppercase tracking-tight">{s.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {s.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
