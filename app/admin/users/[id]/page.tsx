"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/admin-layout"
import { getAdminUserById, suspendUser, activateUser, updateAdminUser, getResumeByUserId, getR2DownloadUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { UserHeader } from "@/components/admin/users/UserHeader"
import { StatusBadges } from "@/components/admin/users/StatusBadges"
import { BasicInformationCard } from "@/components/admin/users/BasicInformationCard"
import { ProfileStatsCard } from "@/components/admin/users/ProfileStatsCard"
import { ProviderProfileCard } from "@/components/admin/users/ProviderProfileCard"
import { CustomerProfileCard } from "@/components/admin/users/CustomerProfileCard"
import { ResumeCard } from "@/components/admin/users/ResumeCard"
import { KycDocumentsCard } from "@/components/admin/users/KycDocumentsCard"
import { ProjectsCard } from "@/components/admin/users/ProjectsCard"
import type { UserBasicInfo, UserFormData, ProviderProfile, CustomerProfile, ProfileStats, KycDocument, Project } from "@/components/admin/users/types"

// Helper type for user data with property access
type UserData = Record<string, unknown> & {
  [key: string]: unknown
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserData | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UserFormData | null>(null)
  const [resume, setResume] = useState<{ fileUrl: string; uploadedAt: string } | null>(null)
  const [loadingResume, setLoadingResume] = useState(false)

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAdminUserById(userId)
      if (response.success) {
        setUser(response.data as UserData)
        initializeFormData(response.data as UserData)
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  useEffect(() => {
    const loadResume = async () => {
      if (!user || !Array.isArray(user.role) || !user.role.includes("PROVIDER")) return
      try {
        setLoadingResume(true)
        const response = await getResumeByUserId(user.id as string)
        if (response.success && response.data) {
          setResume(response.data)
        }
      } catch (error) {
        // Resume is optional
        console.error("Failed to load resume:", error)
      } finally {
        setLoadingResume(false)
      }
    }

    if (user) {
      loadResume()
    }
  }, [user])

  const handleDownloadResume = async () => {
    if (!resume?.fileUrl) return

    try {
      const downloadUrl = await getR2DownloadUrl(resume.fileUrl)
      window.open(downloadUrl.downloadUrl, "_blank")
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download resume",
        variant: "destructive",
      })
    }
  }

  const initializeFormData = (userData: UserData) => {
    const userRole = Array.isArray(userData.role) ? userData.role : []
    const isProvider = userRole.includes("PROVIDER")
    const profile = (isProvider ? userData.providerProfile : userData.customerProfile) as Record<string, unknown> | undefined
    
    setFormData({
      name: (userData.name as string) || "",
      email: (userData.email as string) || "",
      phone: (userData.phone as string) || "",
      isVerified: (userData.isVerified as boolean) || false,
      status: (userData.status as string) || "ACTIVE",
      kycStatus: (userData.kycStatus as string) || "pending_verification",
      ...(isProvider && profile
        ? {
            providerProfile: {
              bio: (profile.bio as string) || "",
              location: (profile.location as string) || "",
              hourlyRate: (profile.hourlyRate as string) || "",
              availability: (profile.availability as string) || "",
              website: (profile.website as string) || "",
              skills: (Array.isArray(profile.skills) ? profile.skills : []) as string[],
              languages: (Array.isArray(profile.languages) ? profile.languages : []) as string[],
              yearsExperience: (profile.yearsExperience as string) || "",
              minimumProjectBudget: (profile.minimumProjectBudget as string) || "",
              maximumProjectBudget: (profile.maximumProjectBudget as string) || "",
              preferredProjectDuration: (profile.preferredProjectDuration as string) || "",
              workPreference: (profile.workPreference as string) || "remote",
              teamSize: (profile.teamSize as number) || 1,
            },
          }
        : {
            customerProfile: {
              description: (profile?.description as string) || "",
              industry: (profile?.industry as string) || "",
              location: (profile?.location as string) || "",
              website: (profile?.website as string) || "",
              socialLinks: (Array.isArray(profile?.socialLinks) ? profile.socialLinks : []) as string[],
              languages: (Array.isArray(profile?.languages) ? profile.languages : []) as string[],
              companySize: (profile?.companySize as string) || "",
              employeeCount: (profile?.employeeCount as string) || "",
              establishedYear: (profile?.establishedYear as string) || "",
              annualRevenue: (profile?.annualRevenue as string) || "",
              fundingStage: (profile?.fundingStage as string) || "",
              preferredContractTypes: (Array.isArray(profile?.preferredContractTypes) ? profile.preferredContractTypes : []) as string[],
              averageBudgetRange: (profile?.averageBudgetRange as string) || "",
              remotePolicy: (profile?.remotePolicy as string) || "",
              hiringFrequency: (profile?.hiringFrequency as string) || "",
              categoriesHiringFor: (Array.isArray(profile?.categoriesHiringFor) ? profile.categoriesHiringFor : []) as string[],
              mission: (profile?.mission as string) || "",
              values: (Array.isArray(profile?.values) ? profile.values : []) as string[],
              benefits: typeof profile?.benefits === "string" ? profile.benefits : null,
              mediaGallery: (Array.isArray(profile?.mediaGallery) ? profile.mediaGallery : []) as string[],
            },
          }),
    })
  }

  const handleFieldChange = (field: string, value: unknown, isProfile = false) => {
    setFormData((prev) => {
      if (!prev) return prev
      if (isProfile) {
        const profileKey = Array.isArray(user?.role) && user.role.includes("PROVIDER") ? "providerProfile" : "customerProfile"
        return {
          ...prev,
          [profileKey]: {
            ...((prev[profileKey] as Record<string, unknown>) || {}),
            [field]: value,
          },
        }
      }
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const handleSave = async () => {
    if (!formData) return

    try {
      setSaving(true)
      const response = await updateAdminUser(userId, formData as unknown as Record<string, unknown>)
      if (response.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditing(false)
        loadUserData()
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      initializeFormData(user)
      setIsEditing(false)
    }
  }

  const handleArrayFieldChange = (field: string, value: string, action: "add" | "remove") => {
    setFormData((prev) => {
      if (!prev) return prev
      const profileKey = Array.isArray(user?.role) && user.role.includes("PROVIDER") ? "providerProfile" : "customerProfile"
      const profile = prev[profileKey] as Record<string, unknown> | undefined
      const currentArray = (Array.isArray(profile?.[field]) ? profile[field] : []) as string[]
      
      let newArray = [...currentArray]
      
      if (action === "add") {
        if (value.trim() && !newArray.includes(value.trim())) {
          newArray.push(value.trim())
        }
      } else if (action === "remove") {
        newArray = newArray.filter((item: string) => item !== value)
      }
      
      return {
        ...prev,
        [profileKey]: {
          ...(profile || {}),
          [field]: newArray,
        },
      }
    })
  }

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this user? They will not be able to login until activated.")) {
      return
    }

    try {
      setActionLoading(true)
      const response = await suspendUser(userId)
      if (response.success) {
        toast({
          title: "Success",
          description: "User suspended successfully",
        })
        loadUserData()
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to suspend user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!confirm("Are you sure you want to activate this user?")) {
      return
    }

    try {
      setActionLoading(true)
      const response = await activateUser(userId)
      if (response.success) {
        toast({
          title: "Success",
          description: "User activated successfully",
        })
        loadUserData()
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading user data...</span>
        </div>
      </AdminLayout>
    )
  }

  if (!user || !formData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
          <Link href="/admin/users">
            <Button className="mt-4">Back to Users</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const userRole = Array.isArray(user?.role) ? user.role : []
  const isProvider = userRole.includes("PROVIDER")
  const isCustomer = userRole.includes("CUSTOMER")

  // Extract typed values for components
  const userName = typeof user.name === "string" ? user.name : ""
  const userEmail = typeof user.email === "string" ? user.email : ""
  const userStatus = typeof user.status === "string" ? user.status : "ACTIVE"
  const userIsVerified = typeof user.isVerified === "boolean" ? user.isVerified : false
  const userCreatedAt = user.createdAt
    ? typeof user.createdAt === "string"
      ? user.createdAt
      : typeof user.createdAt === "number"
        ? new Date(user.createdAt).toISOString()
        : ""
    : ""

  const userBasicInfo: UserBasicInfo = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    kycStatus: formData.kycStatus,
    status: formData.status,
    isVerified: formData.isVerified,
    createdAt: userCreatedAt,
  }

  const providerProfile: ProviderProfile | undefined = isProvider && formData.providerProfile
    ? {
        bio: formData.providerProfile.bio,
        location: formData.providerProfile.location,
        hourlyRate: formData.providerProfile.hourlyRate,
        availability: formData.providerProfile.availability,
        website: formData.providerProfile.website,
        skills: formData.providerProfile.skills,
        languages: formData.providerProfile.languages,
        yearsExperience: formData.providerProfile.yearsExperience,
        minimumProjectBudget: formData.providerProfile.minimumProjectBudget,
        maximumProjectBudget: formData.providerProfile.maximumProjectBudget,
        preferredProjectDuration: formData.providerProfile.preferredProjectDuration,
        workPreference: formData.providerProfile.workPreference,
        teamSize: formData.providerProfile.teamSize,
      }
    : undefined

  const customerProfile: CustomerProfile | undefined = isCustomer && formData.customerProfile
    ? {
        description: formData.customerProfile.description,
        industry: formData.customerProfile.industry,
        location: formData.customerProfile.location,
        website: formData.customerProfile.website,
        socialLinks: formData.customerProfile.socialLinks,
        languages: formData.customerProfile.languages,
        companySize: formData.customerProfile.companySize,
        employeeCount: formData.customerProfile.employeeCount,
        establishedYear: formData.customerProfile.establishedYear,
        annualRevenue: formData.customerProfile.annualRevenue,
        fundingStage: formData.customerProfile.fundingStage,
        preferredContractTypes: formData.customerProfile.preferredContractTypes,
        averageBudgetRange: formData.customerProfile.averageBudgetRange,
        remotePolicy: formData.customerProfile.remotePolicy,
        hiringFrequency: formData.customerProfile.hiringFrequency,
        categoriesHiringFor: formData.customerProfile.categoriesHiringFor,
        mission: formData.customerProfile.mission,
        values: formData.customerProfile.values,
        benefits: formData.customerProfile.benefits,
        mediaGallery: formData.customerProfile.mediaGallery,
      }
    : undefined

  // Extract profile stats
  const providerStats: ProfileStats | undefined = isProvider && user.providerProfile
    ? {
        totalProjects: typeof (user.providerProfile as Record<string, unknown>).totalProjects === "number"
          ? (user.providerProfile as Record<string, unknown>).totalProjects as number
          : 0,
        rating: typeof (user.providerProfile as Record<string, unknown>).rating === "number"
          ? (user.providerProfile as Record<string, unknown>).rating as number
          : 0,
        totalEarnings: typeof (user.providerProfile as Record<string, unknown>).totalEarnings === "number"
          ? (user.providerProfile as Record<string, unknown>).totalEarnings as number
          : 0,
      }
    : undefined

  const customerStats: ProfileStats | undefined = isCustomer && user.customerProfile
    ? {
        projectsPosted: typeof (user.customerProfile as Record<string, unknown>).projectsPosted === "number"
          ? (user.customerProfile as Record<string, unknown>).projectsPosted as number
          : 0,
        totalSpend: typeof (user.customerProfile as Record<string, unknown>).totalSpend === "number"
          ? (user.customerProfile as Record<string, unknown>).totalSpend as number
          : 0,
      }
    : undefined

  // Extract KYC documents
  const kycDocuments: KycDocument[] = Array.isArray(user.KycDocument)
    ? (user.KycDocument as Array<Record<string, unknown>>)
        .filter((doc) => doc.id && doc.filename && doc.type && doc.status && doc.fileUrl)
        .map((doc) => ({
          id: String(doc.id),
          filename: String(doc.filename),
          type: String(doc.type),
          status: String(doc.status),
          fileUrl: String(doc.fileUrl),
        }))
    : []

  // Extract projects
  const projectsAsProvider: Project[] = isProvider && Array.isArray(user.projectsAsProvider)
    ? (user.projectsAsProvider as Array<Record<string, unknown>>)
        .filter((p) => p.id && p.title && p.status && p.createdAt)
        .map((p) => ({
          id: String(p.id),
          title: String(p.title),
          description: typeof p.description === "string" ? p.description : undefined,
          status: String(p.status),
          createdAt: String(p.createdAt),
          budgetMin: typeof p.budgetMin === "number" ? p.budgetMin : undefined,
          budgetMax: typeof p.budgetMax === "number" ? p.budgetMax : undefined,
          customer: p.customer && typeof p.customer === "object" && "name" in p.customer
            ? { name: String((p.customer as Record<string, unknown>).name) }
            : undefined,
        }))
    : []

  const projectsAsCustomer: Project[] = isCustomer && Array.isArray(user.projectsAsCustomer)
    ? (user.projectsAsCustomer as Array<Record<string, unknown>>)
        .filter((p) => p.id && p.title && p.status && p.createdAt)
        .map((p) => ({
          id: String(p.id),
          title: String(p.title),
          description: typeof p.description === "string" ? p.description : undefined,
          status: String(p.status),
          createdAt: String(p.createdAt),
          budgetMin: typeof p.budgetMin === "number" ? p.budgetMin : undefined,
          budgetMax: typeof p.budgetMax === "number" ? p.budgetMax : undefined,
          provider: p.provider && typeof p.provider === "object" && "name" in p.provider
            ? { name: String((p.provider as Record<string, unknown>).name) }
            : undefined,
        }))
    : []

  const allProjects = [...projectsAsProvider, ...projectsAsCustomer]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <UserHeader
          userName={userName}
          userEmail={userEmail}
          userStatus={userStatus}
          isEditing={isEditing}
          saving={saving}
          actionLoading={actionLoading}
          isProvider={isProvider}
          isCustomer={isCustomer}
          providerProfile={user.providerProfile as Record<string, unknown> | undefined}
          customerProfile={user.customerProfile as Record<string, unknown> | undefined}
          userId={userId}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
          onSave={handleSave}
          onSuspend={handleSuspend}
          onActivate={handleActivate}
        />

        <StatusBadges
          status={userStatus}
          roles={userRole as string[]}
          isVerified={userIsVerified}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {kycDocuments.length > 0 && <TabsTrigger value="documents">Documents</TabsTrigger>}
            {allProjects.length > 0 && <TabsTrigger value="projects">Projects</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <BasicInformationCard
              userInfo={userBasicInfo}
              formData={formData}
              isEditing={isEditing}
              onFieldChange={(field, value) => handleFieldChange(field, value, false)}
            />

            {isProvider && providerStats && (
              <ProfileStatsCard stats={providerStats} isProvider={true} />
            )}

            {isCustomer && customerStats && (
              <ProfileStatsCard stats={customerStats} isProvider={false} />
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {isProvider && providerProfile && formData.providerProfile && (
              <>
                <ProviderProfileCard
                  profile={providerProfile}
                  formData={formData.providerProfile}
                  isEditing={isEditing}
                  onFieldChange={(field, value) => handleFieldChange(field, value, true)}
                  onArrayFieldChange={handleArrayFieldChange}
                />
                <ResumeCard loading={loadingResume} resume={resume} onDownload={handleDownloadResume} />
              </>
            )}

            {isCustomer && customerProfile && formData.customerProfile && (
              <CustomerProfileCard
                profile={customerProfile}
                formData={formData.customerProfile}
                isEditing={isEditing}
                onFieldChange={(field, value) => handleFieldChange(field, value, true)}
                onArrayFieldChange={handleArrayFieldChange}
              />
            )}
          </TabsContent>

          {kycDocuments.length > 0 && (
            <TabsContent value="documents" className="space-y-6">
              <KycDocumentsCard documents={kycDocuments} />
            </TabsContent>
          )}

          {allProjects.length > 0 && (
            <TabsContent value="projects" className="space-y-6">
              <ProjectsCard projects={allProjects} isProvider={isProvider} isCustomer={isCustomer} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  )
}
