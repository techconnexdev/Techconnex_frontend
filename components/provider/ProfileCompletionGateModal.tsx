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
import { useI18n } from "@/contexts/I18nProvider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required percentage (e.g. 40 or 50) */
  requiredPercent: number;
  /** Localized action phrase from t(), e.g. submit proposals */
  actionLabel: string;
};

export function ProfileCompletionGateModal({
  open,
  onOpenChange,
  requiredPercent,
  actionLabel,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();

  const handleCompleteNow = () => {
    onOpenChange(false);
    router.push("/provider/onboarding");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("provider.profileCompletion.gate.title")}</DialogTitle>
          <DialogDescription>
            {t("provider.profileCompletion.gate.description", {
              percent: requiredPercent,
              action: actionLabel,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("provider.profile.cancel")}
          </Button>
          <Button
            onClick={handleCompleteNow}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {t("provider.profileCompletion.gate.completeNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
