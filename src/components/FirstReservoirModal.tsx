import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const FirstReservoirModal = ({ open, onClose }: Props) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <div className="mb-2 text-center text-6xl">💩</div>
          <DialogTitle className="text-center text-2xl">
            You just filled your reservoir for the first time
          </DialogTitle>
          <DialogDescription className="text-center">
            Keep logging daily to build up enough to launch at your friends.
            Check your Reservoir tab to watch it fill up.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="hero"
            size="xl"
            onClick={() => {
              onClose();
              navigate("/reservoir");
            }}
          >
            Show me →
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
