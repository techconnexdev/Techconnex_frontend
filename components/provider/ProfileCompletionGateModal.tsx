"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required percentage (e.g. 40 or 50) */
  requiredPercent: number;
  /** Action description, e.g. "contact users" or "submit proposals" */
  actionLabel: string;
};

export function ProfileCompletionGateModal({
  open,
  onOpenChange,
  requiredPercent,
  actionLabel,
}: Props) {
  const router = useRouter();

  const handleCompleteNow = () => {
    onOpenChange(false);
    router.push("/provider/onboarding");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            Complete your profile to at least {requiredPercent}% to{" "}
            {actionLabel}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCompleteNow}
            className="bg-blue-600 hover:bg-blue-700"
          >
            👉 Complete Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
