"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { createProject } from "@/lib/api";

type NewProjectForm = {
  title: string;
  category: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  skills: string[];
  requirements: string;
  deliverables: string;
  priority: "Low" | "Medium" | "High" | "";
  ndaSigned: boolean;
};

const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Cloud / DevOps",
  "Data / Analytics",
  "UI/UX Design",
  "Automation / RPA",
  "Cybersecurity",
  "Other",
];

const SKILL_TAGS = [
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "React Native",
  "Flutter",
  "iOS",
  "Android",
  "Node.js",
  "Python",
  "Java",
  "PHP",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "UI/UX Design",
  "Figma",
  "Adobe XD",
];

export default function NewProjectClient() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<NewProjectForm>({
    title: "",
    category: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    skills: [],
    requirements: "",
    deliverables: "",
    priority: "",
    ndaSigned: false,
  });

  const set = <K extends keyof NewProjectForm>(
    key: K,
    value: NewProjectForm[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const toggleSkill = (s: string) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(s)
        ? f.skills.filter((x) => x !== s)
        : [...f.skills, s],
    }));

  const isValid = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Project title is required.";
    if (!form.category) e.category = "Please select a category.";
    if (!form.description.trim())
      e.description = "Please describe your project.";
    const min = Number(form.budgetMin || 0);
    const max = Number(form.budgetMax || 0);
    if (!min) e.budgetMin = "Enter a minimum budget.";
    if (!max) e.budgetMax = "Enter a maximum budget.";
    if (min && max && min > max)
      e.budgetMax = "Max budget must be ≥ min budget.";
    if (!form.timeline.trim()) e.timeline = "Provide a rough timeline.";
    if (!form.priority) e.priority = "Select a priority.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [
    form.title,
    form.category,
    form.description,
    form.budgetMin,
    form.budgetMax,
    form.timeline,
    form.priority,
  ]);

  const submit = async () => {
    if (!isValid) return;

    try {
      setSubmitting(true);

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        budgetMin: Number(form.budgetMin || 0),
        budgetMax: Number(form.budgetMax || 0),
        timeline: form.timeline,
        priority: form.priority,
        skills: form.skills,
        requirements: form.requirements,
        deliverables: form.deliverables,
      };

      await createProject(payload);
      
      // Show success message
      alert("Project created successfully! Providers will now be able to send proposals.");
      router.push("/customer/projects");
    } catch (e: unknown) {
      console.error("Failed to create project:", e);
      alert(e instanceof Error ? e.message : "Failed to create project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const aiSuggest = () => {
    // Simple client-side “AI” placeholder. Replace with your real endpoint later.
    if (!form.description.trim()) {
      alert("Add a brief description first so I can suggest skills.");
      return;
    }
    const text = form.description.toLowerCase();
    const auto: string[] = [];
    if (/mobile|react native|flutter|ios|android/.test(text))
      auto.push("React Native", "Flutter");
    if (/e-?commerce|checkout|payment|store|shop/.test(text))
      auto.push("Next.js", "Stripe", "Node.js");
    if (/dashboard|analytics|charts|bi|data/.test(text))
      auto.push("React", "PostgreSQL", "Python");
    if (/cloud|docker|kubernetes|k8s|aws|gcp|azure|scalable/.test(text))
      auto.push("AWS", "Docker", "Kubernetes");
    const unique = Array.from(new Set([...form.skills, ...auto]));
    set("skills", unique);
  };

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/customer/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Left column: form */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Project</h1>
            <p className="text-gray-600">
              Tell us about your ICT project and we’ll find the perfect match
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Provide clear information about your project requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Title */}
              <div>
                <Label htmlFor="title" className="flex items-center gap-1">
                  Project Title
                  {errors.title && <span className="text-red-600">*</span>}
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., E-commerce Mobile App Development"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <Label className="flex items-center gap-1">
                  Category
                  {errors.category && <span className="text-red-600">*</span>}
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="description"
                  className="flex items-center gap-1"
                >
                  Project Description
                  {errors.description && (
                    <span className="text-red-600">*</span>
                  )}
                </Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Describe your project in detail. What are you trying to achieve? What features do you need? Who is your target audience?"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              {/* Budget */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="budgetMin"
                    className="flex items-center gap-1"
                  >
                    Minimum Budget (RM)
                    {errors.budgetMin && (
                      <span className="text-red-600">*</span>
                    )}
                  </Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    placeholder="5000"
                    value={form.budgetMin}
                    onChange={(e) => set("budgetMin", e.target.value)}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="budgetMax"
                    className="flex items-center gap-1"
                  >
                    Maximum Budget (RM)
                    {errors.budgetMax && (
                      <span className="text-red-600">*</span>
                    )}
                  </Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    placeholder="15000"
                    value={form.budgetMax}
                    onChange={(e) => set("budgetMax", e.target.value)}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <Label htmlFor="timeline" className="flex items-center gap-1">
                  Project Timeline
                  {errors.timeline && <span className="text-red-600">*</span>}
                </Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 10–12 weeks"
                  value={form.timeline}
                  onChange={(e) => set("timeline", e.target.value)}
                />
              </div>

              {/* Required Skills */}
              <div>
                <div className="flex items-center justify-between">
                  <Label>Required Skills</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={aiSuggest}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Get AI Suggestions
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SKILL_TAGS.map((s) => {
                    const active = form.skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`px-3 py-1 rounded-full text-sm border transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {form.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div>
                <Label>Requirements</Label>
                <Textarea
                  rows={3}
                  placeholder="Must-haves, constraints, tech stack, compliance…"
                  value={form.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                />
              </div>

              {/* Deliverables */}
              <div>
                <Label>Deliverables</Label>
                <Textarea
                  rows={3}
                  placeholder="What the provider will hand over (e.g., source, docs, designs)"
                  value={form.deliverables}
                  onChange={(e) => set("deliverables", e.target.value)}
                />
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <Label>Additional Options</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="flex items-center gap-1">
                      Project Priority
                      {errors.priority && (
                        <span className="text-red-600">*</span>
                      )}
                    </Label>
                    <Select
                      value={form.priority}
                      onValueChange={(v) =>
                        set("priority", v as NewProjectForm["priority"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nda"
                    checked={form.ndaSigned}
                    onCheckedChange={(v) => set("ndaSigned", Boolean(v))}
                  />
                  <Label htmlFor="nda">
                    This project requires an NDA (Non-Disclosure Agreement)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom buttons (mobile-friendly inline) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={aiSuggest}
            >
              <Sparkles className="w-4 h-4" />
              Get AI Suggestions
            </Button>
            <Button
              type="button"
              className="gap-2 flex-1"
              onClick={submit}
              disabled={submitting || !isValid}
            >
              Find ICT Professionals
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right column: sidebars */}
        <div className="lg:col-span-4 mt-6 lg:mt-14 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Project Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-medium">Escrow Payment</div>
                  <p className="text-gray-600">
                    Your payment is held securely until milestones are
                    completed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-medium">Verified Professionals</div>
                  <p className="text-gray-600">
                    All providers undergo KYC and skill verification.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-medium">Dispute Resolution</div>
                  <p className="text-gray-600">
                    24/7 support and mediation services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
              <CardDescription>Simple, transparent process</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                <b>1. AI Matching</b> — We find the best professionals for your
                project.
              </p>
              <p>
                <b>2. Review Proposals</b> — Compare profiles, portfolios, and
                proposals.
              </p>
              <p>
                <b>3. Start Project</b> — Choose your provider and begin
                collaboration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                <b>Be specific about your requirements</b> for better matches
                and proposals.
              </p>
              <p>
                <b>Set realistic budgets</b> for fair, quality work.
              </p>
              <p>
                <b>Include examples or references</b> to communicate your
                vision.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
