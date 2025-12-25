export interface UserBasicInfo {
  name: string
  email: string
  phone: string
  kycStatus: string
  status: string
  isVerified: boolean
  createdAt: string
}

export interface UserFormData {
  name: string
  email: string
  phone: string
  kycStatus: string
  status: string
  isVerified: boolean
  providerProfile?: ProviderProfile
  customerProfile?: CustomerProfile
}

export interface ProviderProfile {
  bio?: string
  location?: string
  hourlyRate?: string | number
  availability?: string
  website?: string
  skills?: string[]
  languages?: string[]
  yearsExperience?: string | number
  minimumProjectBudget?: string | number
  maximumProjectBudget?: string | number
  preferredProjectDuration?: string
  workPreference?: string
  teamSize?: number
}

export interface CustomerProfile {
  description?: string
  industry?: string
  location?: string
  website?: string
  socialLinks?: string[]
  languages?: string[]
  companySize?: string
  employeeCount?: string | number
  establishedYear?: string | number
  annualRevenue?: string
  fundingStage?: string
  preferredContractTypes?: string[]
  averageBudgetRange?: string
  remotePolicy?: string
  hiringFrequency?: string
  categoriesHiringFor?: string[]
  mission?: string
  values?: string[]
  benefits?: string | null
  mediaGallery?: string[]
}

export interface ProfileStats {
  totalProjects?: number
  rating?: number
  totalEarnings?: number
  projectsPosted?: number
  totalSpend?: number
}

export interface KycDocument {
  id: string
  filename: string
  type: string
  status: string
  fileUrl: string
}

export interface Project {
  id: string
  title: string
  description?: string
  status: string
  createdAt: string
  budgetMin?: number
  budgetMax?: number
  customer?: {
    name: string
  }
  provider?: {
    name: string
  }
}

