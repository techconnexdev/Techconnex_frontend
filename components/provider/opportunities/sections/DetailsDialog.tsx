"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import type { Opportunity } from "../types";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nProvider";

const scoreColor = (n: number) =>
  n >= 90 ? "text-green-600 bg-green-100" : n >= 80 ? "text-blue-600 bg-blue-100" : n >= 70 ? "text-yellow-600 bg-yellow-100" : "text-gray-600 bg-gray-100";

export default function DetailsDialog({
  open, onOpenChange, opportunity, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  opportunity: Opportunity | null;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  if (!opportunity) return null;
  const o = opportunity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{o.title}</DialogTitle>
          <DialogDescription className="text-base">
            {t("provider.opportunities.details.postedBy", { client: o.client, time: o.postedTime })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <section>
                <h3 className="font-semibold text-lg mb-2">{t("provider.opportunities.details.projectDescription")}</h3>
                <p className="text-gray-700 leading-relaxed">{o.fullDescription}</p>
              </section>
              {o.requirements?.length ? (
                <section>
                  <h3 className="font-semibold text-lg mb-2">{t("provider.opportunities.details.requirements")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">{o.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </section>
              ) : null}
              {o.deliverables?.length ? (
                <section>
                  <h3 className="font-semibold text-lg mb-2">{t("provider.opportunities.details.deliverables")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">{o.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </section>
              ) : null}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">{t("provider.opportunities.details.projectDetails")}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label={t("provider.opportunities.details.budget")} v={o.budget} strong />
                  <Row label={t("provider.opportunities.details.timeline")} v={o.timeline} />
                  <Row label={t("provider.opportunities.details.proposals")} v={String(o.proposals)} />
                  <Row label={t("provider.opportunities.details.location")} v={o.location} />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t("provider.opportunities.details.matchScore")}</span>
                    <Badge className={scoreColor(o.matchScore)}>
                      {t("provider.opportunities.details.matchPercent", { n: o.matchScore })}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">{t("provider.opportunities.details.clientInfo")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar><AvatarImage src={o.avatar || "/placeholder.svg"} /><AvatarFallback>{o.client.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold">{o.client}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="w-3 h-3 text-yellow-400 mr-1" />
                        {t("provider.opportunities.details.clientRatingProjects", {
                          rating: o.clientRating,
                          n: o.clientJobs,
                        })}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <Row label={t("provider.opportunities.details.companySize")} v={o.clientInfo?.companySize || "-"} />
                    <Row label={t("provider.opportunities.details.industry")} v={o.clientInfo?.industry || "-"} />
                    <Row label={t("provider.opportunities.details.memberSince")} v={String(o.clientInfo?.memberSince || "-")} />
                    <Row label={t("provider.opportunities.details.totalSpent")} v={o.clientInfo?.totalSpent || "-"} strong />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <section>
            <h3 className="font-semibold text-lg mb-3">{t("provider.opportunities.details.skillsRequired")}</h3>
            <div className="flex flex-wrap gap-2">{o.skills.map((s) => <Badge key={s} variant="secondary" className="text-sm px-3 py-1">{s}</Badge>)}</div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("provider.opportunities.details.close")}</Button>
          <Button onClick={onSubmit} disabled={o.hasSubmitted}>
            {o.hasSubmitted ? t("provider.opportunities.details.alreadySubmitted") : t("provider.opportunities.submitProposal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, v, strong = false }: { label: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={strong ? "text-green-600 font-semibold" : ""}>{v}</span>
    </div>
  );
}
