export type KycDocStatus = "uploaded" | "verified" | "rejected"
export type KycStatus = "active" | "inactive" | "suspended" | "pending_verification"
export type Role = "CUSTOMER" | "PROVIDER" | "ADMIN"

export interface KycDoc {
  id: string
  type: "PROVIDER_ID" | "COMPANY_REG" | "COMPANY_DIRECTOR_ID" | "OTHER"
  fileUrl: string
  filename: string
  mimeType?: string
  status: KycDocStatus
  uploadedAt?: string
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface KycUser {
  id: string
  name: string
  email: string
  role: Role
  kycStatus: KycStatus
  createdAt: string
  documents: KycDoc[]
  profile?: Record<string, unknown>
}

export interface VerificationStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface VerificationRow extends KycUser {
  submittedDate: string
  _uiStatus: "verified" | "rejected" | "uploaded"
  _uiType: "provider" | "customer" | "admin"
  reviewedDocName: string
  reviewedDocStatus: string
}

