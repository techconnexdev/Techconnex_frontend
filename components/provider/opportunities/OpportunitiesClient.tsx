"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Zap } from "lucide-react";
import FiltersBar from "./sections/FiltersBar";
import OpportunityCard from "./sections/OpportunityCard";
import DetailsDialog from "./sections/DetailsDialog";
import ProposalDialog from "./sections/ProposalDialog";
import type { Opportunity, ProposalDraft } from "./types";

export default function OpportunitiesClient({ opportunities: initial }: { opportunities: Opportunity[] }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initial);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [draft, setDraft] = useState<ProposalDraft>({
    coverLetter: "",
    bidAmount: "",
    timeline: "",
    milestones: "",
    attachments: [],
  });

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      const q = search.toLowerCase();
      const matchText =
        o.title.toLowerCase().includes(q) ||
        o.client.toLowerCase().includes(q) ||
        o.skills.some((s) => s.toLowerCase().includes(q));
      const matchCat =
        category === "all"
          ? true
          : category === "submitted"
          ? !!o.hasSubmitted
          : category === "not-submitted"
          ? !o.hasSubmitted
          : o.category === category;
      return matchText && matchCat;
    });
  }, [opportunities, search, category]);

  const submitProposal = () => {
    if (!selected) return;
    // mock update: mark as submitted and increment proposals
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === selected.id ? { ...opp, hasSubmitted: true, proposals: opp.proposals + 1 } : opp
      )
    );
    setProposalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Job Opportunities</h1>
          <p className="text-gray-600">Discover projects that match your skills and expertise</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" />Advanced Filters</Button>
          <Button className="gap-2"><Zap className="w-4 h-4" />AI Recommendations</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <FiltersBar
            search={search}
            onSearch={setSearch}
            category={category}
            onCategory={setCategory}
          />
        </CardContent>
      </Card>

      {/* Lists */}
      <Tabs defaultValue="recommended" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="recent">Most Recent</TabsTrigger>
          <TabsTrigger value="budget">Highest Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No opportunities found.</div>
          ) : (
            filtered.map((o) => (
              <OpportunityCard
                key={o.id}
                opportunity={o}
                onView={() => { setSelected(o); setDetailsOpen(true); }}
                onSubmit={() => { setSelected(o); setDraft({ coverLetter: "", bidAmount: "", timeline: "", milestones: "", attachments: [] }); setProposalOpen(true); }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="recent"><div className="text-center py-12 text-gray-500">Recent opportunities coming soon.</div></TabsContent>
        <TabsContent value="budget"><div className="text-center py-12 text-gray-500">Highest budget sort coming soon.</div></TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        opportunity={selected}
        onSubmit={() => { setDetailsOpen(false); if (selected) { setDraft({ coverLetter: "", bidAmount: "", timeline: "", milestones: "", attachments: [] }); setProposalOpen(true); } }}
      />
      <ProposalDialog
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        draft={draft}
        setDraft={setDraft}
        opportunity={selected}
        onSubmit={() => submitProposal()}
      />
    </div>
  );
}
