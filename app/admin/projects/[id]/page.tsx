"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/admin-layout"
import { useToast } from "@/hooks/use-toast"
import {
  getAdminProjectById,
  updateAdminProject,
  getDisputesByProject,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api"
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Paperclip,
  Download,
  Globe,
  MapPin,
  Star,
} from "lucide-react"
import Link from "next/link"
import { formatTimeline } from "@/lib/timeline-utils"
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer"

// Type definitions
interface CustomerProfile {
  profileImageUrl?: string
  location?: string
  website?: string
  industry?: string
  companySize?: string
}

interface Customer {
  id?: string
  name?: string
  email?: string
  customerProfile?: CustomerProfile
}

interface ProviderProfile {
  profileImageUrl?: string
  location?: string
  website?: string
  rating?: number
  totalProjects?: number
}

interface Provider {
  id?: string
  name?: string
  email?: string
  providerProfile?: ProviderProfile
}

interface Milestone {
  id?: string
  title?: string
  description?: string
  amount?: number
  status?: string
  dueDate?: string
  submittedAt?: string
  submissionAttachmentUrl?: string
  submissionHistory?: Array<{
    submissionAttachmentUrl?: string
    revisionNumber?: number
    submittedAt?: string
  }>
}

interface Proposal {
  id?: string
  provider?: Provider
  proposedBudget?: number
  proposedTimeline?: string
  message?: string
  status?: string
  createdAt?: string
  attachments?: string[]
  attachmentUrls?: string[]
}

interface Dispute {
  id?: string
  reason?: string
  description?: string
  status?: string
  raisedBy?: {
    name?: string
  }
}

interface Project {
  id?: string
  title?: string
  description?: string
  category?: string
  status?: string
  type?: string
  budgetMin?: number
  budgetMax?: number
  timeline?: string
  originalTimeline?: string
  providerProposedTimeline?: string
  priority?: string
  skills?: string[]
  requirements?: string | string[]
  deliverables?: string | string[]
  customer?: Customer
  provider?: Provider
  milestones?: Milestone[]
  proposals?: Proposal[]
  proposalsCount?: number
  createdAt?: string
  updatedAt?: string
}

interface FormData {
  title: string
  description: string
  category: string
  budgetMin: number
  budgetMax: number
  timeline: string
  priority: string
  status: string
  requirements: string
  deliverables: string
  skills: string
}

export default function AdminProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const { toast: toastHook } = useToast()

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData | null>(null)

  const loadProject = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAdminProjectById(projectId)
      if (response.success) {
        const projectData = response.data as Project
        setProject(projectData)
        initializeFormData(projectData)
      }
    } catch (error: unknown) {
      toastHook({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [projectId, toastHook])

  const loadDisputes = useCallback(async () => {
    try {
      const response = await getDisputesByProject(projectId)
      if (response.success) {
        setDisputes((response.data || []) as Dispute[])
      }
    } catch (error: unknown) {
      console.error("Failed to load disputes:", error)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
    loadDisputes()
  }, [loadProject, loadDisputes])

  const initializeFormData = (projectData: Project) => {
    const requirements = typeof projectData.requirements === "string"
      ? projectData.requirements
      : Array.isArray(projectData.requirements)
      ? projectData.requirements.map((r) => `- ${String(r)}`).join("\n")
      : ""
    
    const deliverables = typeof projectData.deliverables === "string"
      ? projectData.deliverables
      : Array.isArray(projectData.deliverables)
      ? projectData.deliverables.map((d) => `- ${String(d)}`).join("\n")
      : ""

    setFormData({
      title: projectData.title || "",
      description: projectData.description || "",
      category: projectData.category || "",
      budgetMin: projectData.budgetMin || 0,
      budgetMax: projectData.budgetMax || 0,
      timeline: projectData.timeline || projectData.originalTimeline || "",
      priority: projectData.priority || "medium",
      status: projectData.status || "IN_PROGRESS",
      requirements: requirements,
      deliverables: deliverables,
      skills: Array.isArray(projectData.skills) ? projectData.skills.join(", ") : "",
    })
  }

  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const handleSave = async () => {
    if (!formData || !project) return

    try {
      setSaving(true)
      
      const isServiceRequest = project.type === "serviceRequest"
      
      const updateData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
        timeline: formData.timeline,
        priority: formData.priority,
      }

      if (!isServiceRequest && formData.status) {
        updateData.status = formData.status
      }

      if (formData.skills) {
        const skillsArray = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        if (skillsArray.length > 0) {
          updateData.skills = skillsArray
        }
      }

      if (formData.requirements !== undefined && formData.requirements !== null) {
        updateData.requirements = formData.requirements.trim() || null
      }
      if (formData.deliverables !== undefined && formData.deliverables !== null) {
        updateData.deliverables = formData.deliverables.trim() || null
      }

      const response = await updateAdminProject(projectId, updateData)
      if (response.success) {
        toastHook({
          title: "Success",
          description: "Project updated successfully",
        })
        setIsEditing(false)
        loadProject()
      }
    } catch (error: unknown) {
      toastHook({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (project) {
      initializeFormData(project)
      setIsEditing(false)
    }
  }

  const getStatusColor = (status: string, type?: string) => {
    if (type === "serviceRequest") {
      return "bg-yellow-100 text-yellow-800"
    }
    
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "DISPUTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string, type?: string) => {
    if (type === "serviceRequest") {
      return "Open Opportunity"
    }
    return status?.replace("_", " ") || status
  }

  const getMilestoneStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "APPROVED":
        return "bg-green-100 text-green-700"
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "LOCKED":
        return "bg-purple-100 text-purple-800"
      case "PENDING":
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "DISPUTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMilestoneStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "Paid"
      case "APPROVED":
        return "Approved"
      case "SUBMITTED":
        return "Submitted"
      case "IN_PROGRESS":
        return "In Progress"
      case "LOCKED":
        return "Locked"
      case "PENDING":
        return "Pending"
      case "DRAFT":
        return "Draft"
      case "DISPUTED":
        return "Disputed"
      default:
        return status
    }
  }

  const getMilestoneStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "SUBMITTED":
        return <Clock className="w-5 h-5 text-yellow-600" />
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "LOCKED":
        return <CheckCircle className="w-5 h-5 text-purple-600" />
      case "PENDING":
      case "DRAFT":
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
      case "DISPUTED":
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const formatCurrency = (amount: number) => {
    return `RM${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Project not found</p>
          <Link href="/admin/projects">
            <Button className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const isServiceRequest = project.type === "serviceRequest"
  const milestonesArray = project.milestones || []
  const completedMilestones = milestonesArray.filter(
    (m) => m.status === "APPROVED" || m.status === "PAID"
  ).length
  const totalMilestones = milestonesArray.length
  const progress = isServiceRequest ? 0 : (totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0)
  const approvedPrice = milestonesArray.reduce((sum, m) => sum + (m.amount || 0), 0)
  
  const requirements = typeof project.requirements === "string"
    ? project.requirements
    : Array.isArray(project.requirements)
    ? project.requirements.map((r) => `- ${String(r)}`).join("\n")
    : ""
  
  const deliverables = typeof project.deliverables === "string"
    ? project.deliverables
    : Array.isArray(project.deliverables)
    ? project.deliverables.map((d) => `- ${String(d)}`).join("\n")
    : ""

  const proposalsCount = project.proposalsCount || (project.proposals?.length || 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/projects">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.title || ""}</h1>
              <p className="text-gray-600">{project.category || ""}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isServiceRequest ? "Edit Opportunity" : "Edit Project"}
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex gap-4">
          <Badge className={getStatusColor(project.status || "", project.type)}>
            {getStatusText(project.status || "", project.type)}
          </Badge>
          {isServiceRequest && (
            <Badge className="bg-yellow-100 text-yellow-800">
              Opportunity
            </Badge>
          )}
          {disputes.length > 0 && !isServiceRequest && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {disputes.length} Dispute(s)
            </Badge>
          )}
          {isServiceRequest && proposalsCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              {proposalsCount} {proposalsCount === 1 ? "proposal" : "proposals"}
            </Badge>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isServiceRequest ? (
              <TabsTrigger value="proposals">Proposals ({proposalsCount})</TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="proposals">Proposals ({proposalsCount})</TabsTrigger>
              </>
            )}
            <TabsTrigger value="files">Files</TabsTrigger>
            {disputes.length > 0 && !isServiceRequest && <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    {isEditing ? (
                      <Input
                        value={formData?.category || ""}
                        onChange={(e) => handleFieldChange("category", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg mt-1">{project.category || ""}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">
                      {isEditing && !isServiceRequest ? (
                        <Select
                          value={formData?.status || "IN_PROGRESS"}
                          onValueChange={(value) => handleFieldChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="DISPUTED">Disputed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(project.status || "", project.type)}>
                          {getStatusText(project.status || "", project.type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Budget Range</Label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          type="number"
                          value={formData?.budgetMin || 0}
                          onChange={(e) => handleFieldChange("budgetMin", parseFloat(e.target.value) || 0)}
                          placeholder="Min"
                        />
                        <Input
                          type="number"
                          value={formData?.budgetMax || 0}
                          onChange={(e) => handleFieldChange("budgetMax", parseFloat(e.target.value) || 0)}
                          placeholder="Max"
                        />
                      </div>
                    ) : (
                      <p className="text-lg mt-1">
                        {formatCurrency(project.budgetMin || 0)} - {formatCurrency(project.budgetMax || 0)}
                      </p>
                    )}
                  </div>
                  {!isServiceRequest && approvedPrice > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Approved Price</Label>
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        {formatCurrency(approvedPrice)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Timeline</Label>
                    <div className="space-y-2 mt-1">
                      {project.originalTimeline && typeof project.originalTimeline === "string" && project.originalTimeline.trim() ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Original Timeline (Company):</p>
                          {isEditing ? (
                            <Input
                              value={formData?.timeline || ""}
                              onChange={(e) => handleFieldChange("timeline", e.target.value)}
                            />
                          ) : (
                            <p className="text-sm text-gray-900 font-medium">
                              {formatTimeline(project.originalTimeline)}
                            </p>
                          )}
                        </div>
                      ) : null}
                      {project.providerProposedTimeline && typeof project.providerProposedTimeline === "string" && project.providerProposedTimeline.trim() ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Provider Proposed Timeline:</p>
                          <p className="text-sm text-gray-700">
                            {formatTimeline(project.providerProposedTimeline)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Priority</Label>
                    {isEditing ? (
                      <Select
                        value={formData?.priority || "medium"}
                        onValueChange={(value) => handleFieldChange("priority", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-lg mt-1 capitalize">{project.priority || ""}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData?.description || ""}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      rows={6}
                      className="mt-1"
                    />
                  ) : project.description ? (
                    <MarkdownViewer content={project.description} />
                  ) : (
                    <p className="text-sm text-gray-700 mt-1">{project.description || ""}</p>
                  )}
                </div>
                {requirements && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Requirements</Label>
                    {isEditing ? (
                      <Textarea
                        value={formData?.requirements || ""}
                        onChange={(e) => handleFieldChange("requirements", e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    ) : (
                      <MarkdownViewer content={requirements} />
                    )}
                  </div>
                )}
                {deliverables && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Deliverables</Label>
                    {isEditing ? (
                      <Textarea
                        value={formData?.deliverables || ""}
                        onChange={(e) => handleFieldChange("deliverables", e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    ) : (
                      <MarkdownViewer content={deliverables} />
                    )}
                  </div>
                )}
                {project.skills && project.skills.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Skills Required</Label>
                    {isEditing ? (
                      <Input
                        value={formData?.skills || ""}
                        onChange={(e) => handleFieldChange("skills", e.target.value)}
                        placeholder="Comma-separated skills"
                        className="mt-1"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            {project.customer && (
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={getProfileImageUrl(project.customer.customerProfile?.profileImageUrl)}
                      />
                      <AvatarFallback>{(project.customer.name || "C").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-semibold text-lg">{project.customer.name || "N/A"}</p>
                        <p className="text-sm text-gray-600">{project.customer.email || ""}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {project.customer.customerProfile?.location && project.customer.customerProfile.location.trim() ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{project.customer.customerProfile.location}</span>
                          </div>
                        ) : null}
                        {project.customer.customerProfile?.website && project.customer.customerProfile.website.trim() ? (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a
                              href={project.customer.customerProfile.website.startsWith("http") ? project.customer.customerProfile.website : `https://${project.customer.customerProfile.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.customer.customerProfile.website}
                            </a>
                          </div>
                        ) : null}
                        {project.customer.customerProfile?.industry && project.customer.customerProfile.industry.trim() ? (
                          <div>
                            <span className="text-gray-500">Industry: </span>
                            <span className="text-gray-700">{project.customer.customerProfile.industry}</span>
                          </div>
                        ) : null}
                        {project.customer.customerProfile?.companySize && project.customer.customerProfile.companySize.trim() ? (
                          <div>
                            <span className="text-gray-500">Company Size: </span>
                            <span className="text-gray-700">{project.customer.customerProfile.companySize}</span>
                          </div>
                        ) : null}
                      </div>
                      {project.customer.id && (
                        <Link href={`/admin/users/${project.customer.id}`}>
                          <Button variant="outline" size="sm">
                            View Full Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Provider Information */}
            {!isServiceRequest && project.provider && (
              <Card>
                <CardHeader>
                  <CardTitle>Provider Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={getProfileImageUrl(project.provider.providerProfile?.profileImageUrl)}
                      />
                      <AvatarFallback>{(project.provider.name || "P").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-semibold text-lg">{project.provider.name || "N/A"}</p>
                        <p className="text-sm text-gray-600">{project.provider.email || ""}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {project.provider.providerProfile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{project.provider.providerProfile.location}</span>
                          </div>
                        )}
                        {project.provider.providerProfile?.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a
                              href={project.provider.providerProfile.website.startsWith("http") ? project.provider.providerProfile.website : `https://${project.provider.providerProfile.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.provider.providerProfile.website}
                            </a>
                          </div>
                        )}
                        {project.provider.providerProfile?.rating && typeof project.provider.providerProfile.rating === "number" && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-700">{project.provider.providerProfile.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {project.provider.providerProfile?.totalProjects !== undefined && (
                          <div>
                            <span className="text-gray-500">Projects: </span>
                            <span className="text-gray-700">{project.provider.providerProfile.totalProjects}</span>
                          </div>
                        )}
                      </div>
                      {project.provider.id && (
                        <Link href={`/admin/users/${project.provider.id}`}>
                          <Button variant="outline" size="sm">
                            View Full Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isServiceRequest && (
            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>
                    {totalMilestones > 0 && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {completedMilestones} of {totalMilestones} completed
                        </span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {milestonesArray.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No milestones found</p>
                  ) : (
                    <div className="space-y-4">
                      {milestonesArray.map((milestone, idx) => (
                        <div key={milestone.id || idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {getMilestoneStatusIcon(milestone.status || "")}
                              <div>
                                <h4 className="font-semibold">{milestone.title || `Milestone ${idx + 1}`}</h4>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getMilestoneStatusColor(milestone.status || "")}>
                                {getMilestoneStatusText(milestone.status || "")}
                              </Badge>
                              {milestone.amount && (
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(milestone.amount)}
                                </span>
                              )}
                            </div>
                          </div>
                          {milestone.dueDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {milestone.submittedAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                              <Clock className="w-4 h-4" />
                              <span>Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {milestone.submissionAttachmentUrl && (
                            <div className="mt-3">
                              <a
                                href={getAttachmentUrl(milestone.submissionAttachmentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                              >
                                <Paperclip className="w-4 h-4" />
                                View Submission
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="proposals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                {!project.proposals || project.proposals.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No proposals found</p>
                ) : (
                  <div className="space-y-4">
                    {project.proposals.map((proposal, idx) => (
                      <div key={proposal.id || idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">
                              {proposal.provider?.name || "Unknown Provider"}
                            </h4>
                            <p className="text-sm text-gray-600">{proposal.provider?.email || ""}</p>
                          </div>
                          <Badge className={getStatusColor(proposal.status || "", "")}>
                            {getStatusText(proposal.status || "", "")}
                          </Badge>
                        </div>
                        {proposal.proposedBudget && (
                          <p className="text-sm text-gray-700 mt-2">
                            <span className="font-medium">Budget: </span>
                            {formatCurrency(proposal.proposedBudget)}
                          </p>
                        )}
                        {proposal.proposedTimeline && (
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Timeline: </span>
                            {formatTimeline(proposal.proposedTimeline)}
                          </p>
                        )}
                        {proposal.message && (
                          <p className="text-sm text-gray-600 mt-2">{proposal.message}</p>
                        )}
                        {proposal.createdAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted: {new Date(proposal.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            {/* Proposal Attachments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Attachments</CardTitle>
                <CardDescription>Files attached to proposals</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const proposalAttachments: Array<{
                    url: string
                    proposalName: string
                    proposalId?: string
                  }> = []

                  if (project.proposals && Array.isArray(project.proposals)) {
                    project.proposals.forEach((proposal) => {
                      const attachments = proposal.attachments || proposal.attachmentUrls || []
                      if (Array.isArray(attachments) && attachments.length > 0) {
                        attachments.forEach((url: string) => {
                          proposalAttachments.push({
                            url,
                            proposalName: proposal.provider?.name || "Provider",
                            proposalId: proposal.id,
                          })
                        })
                      }
                    })
                  }

                  if (proposalAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No proposal attachments found
                      </p>
                    )
                  }

                  return (
                    <div className="space-y-2">
                      {proposalAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/")
                        const fileName = normalized.split("/").pop() || `file-${idx + 1}`
                        const attachmentUrl = getAttachmentUrl(attachment.url)
                        const isR2Key = attachmentUrl === "#" || (!attachmentUrl.startsWith("http") && !attachmentUrl.startsWith("/uploads/") && !attachmentUrl.includes(process.env.NEXT_PUBLIC_API_URL || "localhost"))

                        return (
                          <a
                            key={idx}
                            href={attachmentUrl === "#" ? undefined : attachmentUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={isR2Key ? async (e) => {
                              e.preventDefault()
                              try {
                                const downloadUrl = await getR2DownloadUrl(attachment.url)
                                window.open(downloadUrl.downloadUrl, "_blank")
                              } catch (error) {
                                console.error("Failed to get download URL:", error)
                                toastHook({
                                  title: "Error",
                                  description: "Failed to download attachment",
                                  variant: "destructive",
                                })
                              }
                            } : undefined}
                            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                          >
                            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-xs text-gray-500 leading-snug">
                                From: {attachment.proposalName} • Click to preview / download
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                              <Download className="w-4 h-4" />
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Milestone Attachments Section */}
            <Card>
              <CardHeader>
                <CardTitle>Milestone Attachments</CardTitle>
                <CardDescription>Files submitted with milestone completions</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const milestoneAttachments: Array<{
                    url: string
                    milestoneTitle: string
                    milestoneId?: string
                    submittedAt?: string
                  }> = []

                  milestonesArray.forEach((milestone) => {
                    if (milestone.submissionAttachmentUrl) {
                      milestoneAttachments.push({
                        url: milestone.submissionAttachmentUrl,
                        milestoneTitle: milestone.title || "Untitled Milestone",
                        milestoneId: milestone.id,
                        submittedAt: milestone.submittedAt,
                      })
                    }

                    if (milestone.submissionHistory && Array.isArray(milestone.submissionHistory)) {
                      milestone.submissionHistory.forEach((history) => {
                        if (history.submissionAttachmentUrl) {
                          milestoneAttachments.push({
                            url: history.submissionAttachmentUrl,
                            milestoneTitle: `${milestone.title || "Untitled Milestone"} (Revision ${history.revisionNumber || "N/A"})`,
                            milestoneId: milestone.id,
                            submittedAt: history.submittedAt,
                          })
                        }
                      })
                    }
                  })

                  if (milestoneAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No milestone attachments found
                      </p>
                    )
                  }

                  return (
                    <div className="space-y-2">
                      {milestoneAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/")
                        const fileName = normalized.split("/").pop() || `file-${idx + 1}`
                        const attachmentUrl = getAttachmentUrl(attachment.url)
                        const isR2Key = attachmentUrl === "#" || (!attachmentUrl.startsWith("http") && !attachmentUrl.startsWith("/uploads/") && !attachmentUrl.includes(process.env.NEXT_PUBLIC_API_URL || "localhost"))

                        return (
                          <a
                            key={idx}
                            href={attachmentUrl === "#" ? undefined : attachmentUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={isR2Key ? async (e) => {
                              e.preventDefault()
                              try {
                                const downloadUrl = await getR2DownloadUrl(attachment.url)
                                window.open(downloadUrl.downloadUrl, "_blank")
                              } catch (error) {
                                console.error("Failed to get download URL:", error)
                                toastHook({
                                  title: "Error",
                                  description: "Failed to download attachment",
                                  variant: "destructive",
                                })
                              }
                            } : undefined}
                            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                          >
                            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-xs text-gray-500 leading-snug">
                                From: {attachment.milestoneTitle}
                                {attachment.submittedAt &&
                                  ` • Submitted: ${new Date(attachment.submittedAt).toLocaleDateString()}`}
                                <span className="block mt-0.5">Click to preview / download</span>
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                              <Download className="w-4 h-4" />
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Attachments</CardTitle>
                <CardDescription>Files attached to project messages</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 text-center py-8">
                  Message attachments will be available here once implemented
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {disputes.length > 0 && (
            <TabsContent value="disputes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Related Disputes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <div key={dispute.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{dispute.reason || "N/A"}</p>
                            <p className="text-sm text-gray-600">{dispute.description || ""}</p>
                          </div>
                          <Badge className={getStatusColor(dispute.status || "")}>
                            {(dispute.status || "").replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">
                            Raised by: {dispute.raisedBy?.name || "N/A"}
                          </span>
                          <Link href={`/admin/disputes`}>
                            <Button variant="outline" size="sm">
                              View Dispute
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  )
}

