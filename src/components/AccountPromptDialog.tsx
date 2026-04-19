import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getLogs } from "@/lib/storage";

const DISMISSED_KEY = "pooped_account_prompt_dismissed";

export const AccountPromptDialog = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || session) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (getLogs().length >= 3) setOpen(true);
  }, [session, loading]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Save your streak 🔥</DialogTitle>
          <DialogDescription>
            Create a free account so you never lose your data.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="hero"
          size="lg"
          onClick={() => {
            dismiss();
            navigate("/auth");
          }}
        >
          Create free account →
        </Button>
        <button onClick={dismiss} className="text-sm text-muted-foreground">
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
};
