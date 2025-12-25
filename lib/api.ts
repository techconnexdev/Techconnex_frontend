// lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

/**
 * Get the full URL for a profile image
 * Handles both old local paths and new R2 URLs
 * @param imageUrl - Image URL or key from database
 * @returns Full URL to the image
 */
export function getProfileImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "/placeholder.svg?height=96&width=96";
  }

  // If it's already a full URL (R2 public URL or http/https), return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's a local path (old format starting with /), prepend API base URL
  if (imageUrl.startsWith("/")) {
    return `${API_BASE_URL}${imageUrl}`;
  }

  // Handle old uploads paths (uploads/... or uploads/media-company/...)
  if (imageUrl.startsWith("uploads/")) {
    // Normalize the path (remove leading slash if present, ensure it starts with /)
    const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${API_BASE_URL}${normalizedPath}`;
  }

  // Check if it's an R2 key for media gallery or profile images (public files)
  const r2PublicPrefixes = ["media-gallery/", "profile-images/"];
  const isR2PublicKey = r2PublicPrefixes.some(prefix => imageUrl.startsWith(prefix)) ||
                        (!imageUrl.includes("://") && !imageUrl.startsWith("/") && !imageUrl.includes(API_BASE_URL));

  if (isR2PublicKey) {
    // Construct R2 public URL
    const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
    if (r2PublicDomain) {
      // Use custom domain if configured
      return `https://${r2PublicDomain}/${imageUrl}`;
    }
    
    // Fallback: try to construct R2 public URL using account ID and bucket name
    const r2AccountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
    const r2BucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (r2AccountId && r2BucketName) {
      return `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${imageUrl}`;
    }
    
    // If no R2 config, return the key as-is (might be handled by backend proxy)
    // But for now, let's try the API base URL as fallback
    console.warn("R2 public domain not configured, using API base URL fallback for:", imageUrl);
  }

  // Otherwise, treat as relative path
  return `${API_BASE_URL}/${imageUrl}`;
}

/**
 * Get the URL for a message attachment
 * Handles both old local paths and new R2 URLs/keys
 * @param attachmentUrl - Attachment URL or key from database
 * @returns Full URL to the attachment
 */
export function getMessageAttachmentUrl(attachmentUrl: string | null | undefined): string {
  if (!attachmentUrl) {
    return "";
  }

  // If it's already a full URL (R2 public URL or http/https), return as is
  if (attachmentUrl.startsWith("http://") || attachmentUrl.startsWith("https://")) {
    return attachmentUrl;
  }

  // If it's a local path (old format like /uploads/messages/...), prepend API base URL
  if (attachmentUrl.startsWith("/uploads/") || attachmentUrl.startsWith("uploads/")) {
    const normalized = attachmentUrl.replace(/\\/g, "/");
    const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${cleanPath}`;
  }

  // If it starts with /, treat as local path
  if (attachmentUrl.startsWith("/")) {
    return `${API_BASE_URL}${attachmentUrl}`;
  }

  // Check if it's an R2 key for message attachments
  const r2KeyPrefixes = ["message-attachments/"];
  const isR2Key = r2KeyPrefixes.some(prefix => attachmentUrl.startsWith(prefix)) || 
                  (!attachmentUrl.includes("://") && !attachmentUrl.startsWith("/") && !attachmentUrl.includes(API_BASE_URL));
  
  if (isR2Key) {
    // Construct R2 public URL for message attachments
    const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
    if (r2PublicDomain) {
      return `https://${r2PublicDomain}/${attachmentUrl}`;
    }
    
    // Fallback: try to construct R2 public URL using account ID and bucket name
    const r2AccountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
    const r2BucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    if (r2AccountId && r2BucketName) {
      return `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${attachmentUrl}`;
    }
    
    // If no R2 config, use API base URL as fallback
    console.warn("R2 public domain not configured, using API base URL fallback for:", attachmentUrl);
    return `${API_BASE_URL}/${attachmentUrl}`;
  }

  // Otherwise, treat as relative path
  return `${API_BASE_URL}/${attachmentUrl}`;
}

/**
 * Get the URL for an attachment (proposal, milestone, etc.)
 * Handles both old local paths and new R2 URLs/keys
 * For private R2 files, returns "#" to prevent direct navigation (use onClick with getDownloadUrl)
 * @param attachmentUrl - Attachment URL or key from database
 * @returns Full URL for local paths, "#" for R2 keys (use getDownloadUrl), or full URL for R2 public files
 */
export function getAttachmentUrl(attachmentUrl: string | null | undefined): string {
  if (!attachmentUrl) {
    return "";
  }

  // If it's already a full URL (R2 public URL or http/https), return as is
  if (attachmentUrl.startsWith("http://") || attachmentUrl.startsWith("https://")) {
    return attachmentUrl;
  }

  // If it's a local path (old format like /uploads/...), prepend API base URL
  if (attachmentUrl.startsWith("/uploads/") || attachmentUrl.startsWith("uploads/")) {
    const normalized = attachmentUrl.replace(/\\/g, "/");
    const cleanPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${cleanPath}`;
  }

  // If it starts with /, treat as local path
  if (attachmentUrl.startsWith("/")) {
    return `${API_BASE_URL}${attachmentUrl}`;
  }

  // Check if it's an R2 key (common prefixes: proposals/, milestones/, disputes/, etc.)
  // R2 keys typically don't start with / and aren't full URLs
  const r2KeyPrefixes = ["proposals/", "milestones/", "disputes/", "portfolio/", "profile-images/", "media-gallery/"];
  const isR2Key = r2KeyPrefixes.some(prefix => attachmentUrl.startsWith(prefix)) || 
                  (!attachmentUrl.includes("://") && !attachmentUrl.startsWith("/") && !attachmentUrl.includes(API_BASE_URL));
  
  if (isR2Key) {
    // Return "#" for R2 keys - frontend should use onClick with getDownloadUrl
    // This prevents the browser from trying to navigate to a non-existent route
    return "#";
  }

  // Otherwise, return as-is (shouldn't happen, but fallback)
  return attachmentUrl;
}

/**
 * Extract userId from JWT token stored in localStorage
 */
export function getUserIdFromToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (base64 decode)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    
    // userId could be under different keys depending on backend
    return payload.userId || payload.id || payload.sub || null;
  } catch (err) {
    console.warn("Failed to decode token:", err);
    return null;
  }
}

export async function uploadKyc(files: File[], type: "PROVIDER_ID" | "COMPANY_REG" | "COMPANY_DIRECTOR_ID") {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const fd = new FormData();
  fd.append("type", type);
  files.forEach((f) => fd.append("documents", f));

  const res = await fetch(`${API_BASE}/kyc/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type when sending FormData
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "KYC upload failed");
  return data;
}

export async function getCompanyProfile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/company/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch company profile");
  return data;
}

export async function getCompanyProfileCompletion() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/company/profile/completion`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch profile completion");
  return data;
}

export async function updateCompanyProfile(profileData: Record<string, unknown>) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/company/profile`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update company profile");
  return data;
}

export async function upsertCompanyProfile(profileData: Record<string, unknown>) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/company/profile`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to save company profile");
  return data;
}

export async function uploadCompanyProfileImage(imageFile: File) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  // Use the new R2 upload helper
  const { uploadFile } = await import("./upload");
  
  // Upload to R2 with public visibility (profile images should be public)
  const uploadResult = await uploadFile({
    file: imageFile,
    prefix: "profile-images",
    visibility: "public",
    category: "image",
  });

  if (!uploadResult.success) {
    throw new Error(uploadResult.error || "Failed to upload profile image");
  }

  // Send the key and URL to backend to update the profile
  const res = await fetch(`${API_BASE_URL}/company/profile/upload-image`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: uploadResult.key,
      url: uploadResult.url, // Public URL if visibility is "public"
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update profile with image");
  return data;
}

export async function uploadCompanyMediaGalleryImages(imageFiles: File[]) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  // Use the new R2 upload helper
  const { uploadFiles } = await import("./upload");
  
  // Upload all files to R2 with public visibility (media gallery images should be public)
  const uploadResults = await uploadFiles(imageFiles, {
    prefix: "media-gallery",
    visibility: "public",
    category: "image",
  });

  // Filter successful uploads
  const successfulUploads = uploadResults
    .filter((result) => result.success)
    .map((result) => ({
      key: result.key,
      url: result.url, // Public URL if visibility is "public"
    }));

  if (successfulUploads.length === 0) {
    throw new Error("Failed to upload any media gallery images to R2");
  }

  // Send the keys and URLs to backend to update the profile
  const res = await fetch(`${API_BASE_URL}/company/profile/upload-media`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      images: successfulUploads,
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update profile with media gallery images");
  return data;
}

export async function getKycDocuments() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/kyc/kyc-documents`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch KYC documents");
  return data;
}

// Project API functions
export async function getCompanyProjects(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status) searchParams.append("status", params.status);
  if (params?.category) searchParams.append("category", params.category);

  const url = `${API_BASE}/company/projects${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch projects");
  return data;
}

export async function analyzeProjectDocument(file: File) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : undefined;

  if (!token) throw new Error("Not authenticated");

  try {
    // Upload to R2 first
    const { uploadFile } = await import("@/lib/upload");
    
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    
    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      throw new Error("Invalid file type. Only PDF, Word, Excel, and TXT files are allowed.");
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)} MB`);
    }

    // Upload to R2
    let uploadResult;
    try {
      uploadResult = await uploadFile({
        file: file,
        prefix: "project-documents",
        visibility: "private",
        category: "document",
      });
    } catch (uploadError: unknown) {
      // Handle R2 upload errors
      const error = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        throw new Error("Network error: Unable to connect to upload service. Please check your internet connection and try again.");
      }
      if (error.message?.includes("size") || error.message?.includes("limit")) {
        throw new Error(`File size error: ${error.message}`);
      }
      if (error.message?.includes("type") || error.message?.includes("format")) {
        throw new Error(`File type error: ${error.message}`);
      }
      throw new Error(`Upload failed: ${error.message || "Unknown error occurred during file upload"}`);
    }

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload document to R2");
    }

    // Send R2 key to backend for analysis
    let res;
    try {
      res = await fetch(`${API_BASE}/company/projects/analyze-document`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: uploadResult.key,
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
        }),
      });
    } catch (fetchError: unknown) {
      // Handle network errors
      const error = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      if (error.message?.includes("network") || error.message?.includes("fetch") || error.name === "TypeError") {
        throw new Error("Network error: Unable to connect to server. Please check your internet connection and try again.");
      }
      throw new Error(`Server connection failed: ${error.message || "Unknown error"}`);
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server response error: Invalid response from server. Please try again.");
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || `Document analysis failed (${res.status})`;
      if (res.status === 400) {
        throw new Error(`Validation error: ${errorMsg}`);
      } else if (res.status === 401 || res.status === 403) {
        throw new Error(`Authorization error: ${errorMsg}. Please refresh the page and try again.`);
      } else if (res.status >= 500) {
        throw new Error(`Server error: ${errorMsg}. Please try again later.`);
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: unknown) {
    console.error("Document analysis error:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function createProject(projectData: {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  priority: string;
  skills: string[];
  ndaSigned?: boolean;
  requirements?: string;  // ✅ Markdown string
  deliverables?: string;  // ✅ Markdown string
}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : undefined;

  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to create project");
  }

  return data;
}


export async function getProjectRequests(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status) searchParams.append("status", params.status);
  if (params?.category) searchParams.append("category", params.category);

  const url = `${API_BASE}/company/project-requests${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch project requests");
  return data;
}

export async function acceptProposal(proposalId: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests/${proposalId}/accept`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to accept proposal");
  return data;
}

export async function rejectProposal(proposalId: string, reason?: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests/${proposalId}/reject`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to reject proposal");
  return data;
}

// Get single project/service request details
export async function getProjectById(id: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/projects/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch project");
  return data;
}

// Get proposals for a specific service request
export async function getProposalsByServiceRequest(serviceRequestId: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests?serviceRequestId=${serviceRequestId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch proposals");
  return data;
}

// Accept proposal with milestone choice
export async function acceptProposalWithMilestones(proposalId: string, useProviderMilestones: boolean = true) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests/${proposalId}/accept`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ useProviderMilestones }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to accept proposal");
  return data;
}

// Provider opportunities API functions
export async function getProviderOpportunities(params?: {
  page?: number;
  limit?: number;
  category?: string;
  skills?: string[];
  search?: string;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.category) searchParams.append("category", params.category);
  if (params?.skills && params.skills.length > 0) {
    params.skills.forEach(skill => searchParams.append("skills", skill));
  }
  if (params?.search) searchParams.append("search", params.search);

  const url = `${API_BASE}/provider/opportunities${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch opportunities");
  return data;
}

export async function getProviderRecommendedOpportunities() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/opportunities/recommended`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch recommended opportunities");
  return data;
}

export async function getProviderOpportunityById(opportunityId: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/opportunities/${opportunityId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch opportunity");
  return data;
}

export async function sendProposal(formData: FormData) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : undefined;

  if (!token) throw new Error("Not authenticated");

  // Extract attachments from FormData and upload to R2
  const attachments = formData.getAll("attachments") as File[];
  const attachmentResults: Array<{ key: string; url: string }> = [];

  if (attachments.length > 0) {
    const { uploadFiles } = await import("./upload");
    
    // Upload all attachments to R2 with private visibility (proposal attachments should be private)
    const uploadResults = await uploadFiles(attachments, {
      prefix: "proposals",
      visibility: "private",
      category: "document",
    });

    // Collect successful uploads
    attachmentResults.push(
      ...uploadResults
        .filter((result) => result.success)
        .map((result) => ({
          key: result.key,
          url: result.url || result.key, // URL will be empty for private files, use key
        }))
    );
  }

  // Convert FormData to plain object (excluding attachments)
  const proposalData: Record<string, unknown> = {};
  const milestonesMap: Record<number, Record<string, unknown>> = {};
  
  for (const [key, value] of formData.entries()) {
    if (key !== "attachments") {
      // Handle milestones array - format: milestones[0][sequence], milestones[0][title], etc.
      const milestoneMatch = key.match(/^milestones\[(\d+)\]\[(\w+)\]$/);
      if (milestoneMatch) {
        const index = parseInt(milestoneMatch[1]);
        const field = milestoneMatch[2];
        if (!milestonesMap[index]) {
          milestonesMap[index] = {};
        }
        milestonesMap[index][field] = value;
      } else {
        // Regular fields
        proposalData[key] = value;
      }
    }
  }

  // Convert milestones map to array (sorted by index)
  if (Object.keys(milestonesMap).length > 0) {
    proposalData.milestones = Object.keys(milestonesMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((key) => milestonesMap[parseInt(key)]);
  }

  // Add attachments array (always include, even if empty, for backend compatibility)
  proposalData.attachments = attachmentResults;

  // Send as JSON (no longer need FormData since files are uploaded to R2)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/provider/proposals`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proposalData),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Proposal submit failed");
  }
  return data;
}



// Company project requests API functions
export async function getCompanyProjectRequests(params?: {
  page?: number;
  limit?: number;
  status?: string;
  proposalStatus?: string;
  serviceRequestId?: string;
  search?: string;
  sort?: string;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status) searchParams.append("status", params.status);
  if (params?.proposalStatus) searchParams.append("proposalStatus", params.proposalStatus);
  if (params?.serviceRequestId) searchParams.append("serviceRequestId", params.serviceRequestId);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.sort) searchParams.append("sort", params.sort);

  const url = `${API_BASE}/company/project-requests${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch project requests");
  return data;
}

export async function acceptProjectRequest(proposalId: string, useProviderMilestones: boolean = true) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests/${proposalId}/accept`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ useProviderMilestones }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to accept proposal");
  return data;
}

export async function rejectProjectRequest(proposalId: string, reason?: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests/${proposalId}/reject`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to reject proposal");
  return data;
}

export async function getProjectRequestStats() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/project-requests/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch stats");
  return data;
}

export async function exportCompanyProjectRequests(params?: {
  search?: string;
  proposalStatus?: string;
  serviceRequestId?: string;
}): Promise<Blob> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append("search", params.search);
  if (params?.proposalStatus) searchParams.append("proposalStatus", params.proposalStatus);
  if (params?.serviceRequestId) searchParams.append("serviceRequestId", params.serviceRequestId);

  const res = await fetch(`${API_BASE}/company/project-requests/export?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.message || "Failed to export requests");
  }

  return await res.blob();
}

/**
 * Get company project statistics (active projects, completed projects, total spent)
 */
export async function getCompanyProjectStats() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/projects/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch project stats");
  return data;
}

export async function exportCompanyProjects(params?: {
  search?: string;
  status?: string;
}): Promise<Blob> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append("search", params.search);
  if (params?.status) searchParams.append("status", params.status);

  const res = await fetch(`${API_BASE}/company/projects/export?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.message || "Failed to export projects");
  }

  return await res.blob();
}

// Provider projects API functions
export async function getProviderProjects(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status) searchParams.append("status", params.status);
  if (params?.category) searchParams.append("category", params.category);
  if (params?.search) searchParams.append("search", params.search);

  const url = `${API_BASE}/provider/projects${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch projects");
  return data;
}

export async function exportProviderProjects(params?: {
  search?: string;
  status?: string;
}): Promise<Blob> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append("search", params.search);
  if (params?.status) searchParams.append("status", params.status);

  const res = await fetch(`${API_BASE}/provider/projects/export?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.message || "Failed to export projects");
  }

  return await res.blob();
}

export async function getProviderProjectById(id: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/projects/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch project");
  return data;
}

export async function updateProviderProjectStatus(id: string, status: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/projects/${id}/status`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update project status");
  return data;
}

export async function updateProviderMilestoneStatus(
  milestoneId: string, 
  status: string, 
  deliverables?: unknown,
  submissionNote?: string,
  attachment?: File
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  let submissionAttachmentUrl: string | undefined = undefined;

  // Upload attachment to R2 if provided
  if (attachment) {
    const { uploadFile } = await import("./upload");
    
    // Upload to R2 with private visibility (milestone attachments should be private)
    const uploadResult = await uploadFile({
      file: attachment,
      prefix: "milestones",
      visibility: "private",
      category: attachment.type.startsWith("image/") ? "image" : "document",
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Failed to upload milestone attachment to R2");
    }

    // Use the URL if available (for public files), otherwise use the key
    // For private files, frontend will need to get download URL when displaying
    submissionAttachmentUrl = uploadResult.url || uploadResult.key;
  }

  // Always use JSON now (no FormData needed)
  const headers: HeadersInit = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({ 
    status, 
    deliverables, 
    submissionNote,
    submissionAttachmentUrl,
  });

  const res = await fetch(`${API_BASE}/provider/projects/milestones/${milestoneId}/status`, {
    method: "PUT",
    headers,
    body,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update milestone status");
  return data;
}

export async function getProviderProjectStats() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/projects/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch stats");
  return data;
}

export async function getProviderPerformanceMetrics() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/projects/performance`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch performance metrics");
  return data;
}


export async function updateCompanyProject(
  id: string,
  body: Partial<{
    title: string;
    description: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    timeline: string;
    priority: string;
    skills: string[];
    ndaSigned: boolean;
    requirements: string;  // ✅ Markdown string
    deliverables: string;  // ✅ Markdown string
  }>
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/projects/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update project");
  return data;
}


// lib/api.ts

export type Milestone = {
  id?: string;
  sequence: number;
  title: string;
  description?: string;
  amount: number;
  dueDate: string; // ISO
  status?: string;
  order?: number;
  completedAt?: string;
  progress?: number;
  startDeliverables?: unknown; // When starting work (LOCKED -> IN_PROGRESS)
  submitDeliverables?: unknown; // When submitting work (IN_PROGRESS -> SUBMITTED)
  submissionAttachmentUrl?: string;
  submissionNote?: string;
  submittedAt?: string;
  revisionNumber?: number; // Track submission iterations
  submissionHistory?: unknown[]; // Array of previous submissions
};

function getToken() {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("token") || undefined;
}

/** COMPANY side - Project milestone management */
export async function getCompanyProjectMilestones(projectId: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/company/milestones/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to load project milestones");
  return data as {
    success: boolean;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      amount: number;
      dueDate: string;
      order: number;
      status: string;
      startDeliverables?: unknown;
      submitDeliverables?: unknown;
      submissionAttachmentUrl?: string;
      submissionNote?: string;
      submittedAt?: string;
      revisionNumber?: number;
      submissionHistory?: unknown[];
    }>;
    milestonesLocked: boolean;
    companyApproved: boolean;
    providerApproved: boolean;
    milestonesApprovedAt: string | null;
  };
}

export async function updateCompanyProjectMilestones(projectId: string, milestones: Milestone[]) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/company/milestones/${projectId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ milestones }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update milestones");
  return data;
}

export async function approveCompanyMilestones(projectId: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/company/milestones/${projectId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to approve milestones");
  return data as { 
    success: boolean; 
    approved: boolean; 
    locked: boolean; 
    milestones: Milestone[];
    milestonesLocked: boolean;
    companyApproved: boolean;
    providerApproved: boolean;
    milestonesApprovedAt: string | null;
  };
}

export async function approveIndividualMilestone(milestoneId: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/company/projects/milestones/${milestoneId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to approve milestone");
  return data;
}

export async function requestMilestoneChanges(milestoneId: string, reason?: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/company/projects/milestones/${milestoneId}/request-changes`, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to request milestone changes");
  return data;
}

export async function payMilestone(milestoneId: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/company/projects/milestones/${milestoneId}/pay`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to pay milestone");
  return data;
}

/** PROVIDER side - Project milestone management */
export async function getProviderProjectMilestones(projectId: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/provider/milestones/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to load project milestones");
  return data as {
    success: boolean;
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      amount: number;
      dueDate: string;
      order: number;
      status: string;
    }>;
    milestonesLocked: boolean;
    companyApproved: boolean;
    providerApproved: boolean;
    milestonesApprovedAt: string | null;
  };
}

export async function updateProviderProjectMilestones(projectId: string, milestones: Milestone[]) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/provider/milestones/${projectId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ milestones }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update milestones");
  return data;
}

export async function approveProviderMilestones(projectId: string) {
  const token = getToken(); if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/provider/milestones/${projectId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to approve milestones");
  return data as { 
    success: boolean; 
    approved: boolean; 
    locked: boolean; 
    milestones: Milestone[];
    milestonesLocked: boolean;
    companyApproved: boolean;
    providerApproved: boolean;
    milestonesApprovedAt: string | null;
  };
}

// Provider search API functions
export async function getRecommendedProviders() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/providers/recommended`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch recommended providers");
  return data;
}

export async function searchProviders(params?: {
  search?: string;
  category?: string;
  location?: string;
  rating?: string;
  page?: number;
  limit?: number;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.category) queryParams.append("category", params.category);
  if (params?.location) queryParams.append("location", params.location);
  if (params?.rating) queryParams.append("rating", params.rating);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/providers?${queryParams}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to search providers");
  return data;
}

export async function getProviderById(providerId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/providers/${providerId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch provider");
  return data;
}

export async function getProviderFilters() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/providers/filters`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch filters");
  return data;
}

// Company search API functions (for providers)
export async function searchCompanies(params?: {
  search?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  rating?: string;
  page?: number;
  limit?: number;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.industry) queryParams.append("industry", params.industry);
  if (params?.location) queryParams.append("location", params.location);
  if (params?.companySize) queryParams.append("companySize", params.companySize);
  if (params?.rating) queryParams.append("rating", params.rating);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const res = await fetch(`${API_BASE}/companies?${queryParams}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to search companies");
  return data;
}

export async function getCompanyById(companyId: string, userId?: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const queryParams = new URLSearchParams();
  if (userId) queryParams.append("userId", userId);

  const res = await fetch(`${API_BASE}/companies/${companyId}?${queryParams}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch company");
  return data;
}

export async function getCompanyFilters() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/companies/filters`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch filters");
  return data;
}

export async function saveCompany(companyId: string, userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/companies/${companyId}/save?userId=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to save company");
  return data;
}

export async function unsaveCompany(companyId: string, userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/companies/${companyId}/save?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to unsave company");
  return data;
}

export async function getSavedCompanies(userId: string, page?: number, limit?: number) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const queryParams = new URLSearchParams();
  if (page) queryParams.append("page", page.toString());
  if (limit) queryParams.append("limit", limit.toString());

  const res = await fetch(`${API_BASE}/companies/users/${userId}/saved-companies?${queryParams}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch saved companies");
  return data;
}

export async function getCompanyOpportunities(companyId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/companies/${companyId}/opportunities`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch company opportunities");
  return data;
}

// Provider Profile API functions
export async function getProviderProfile() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch provider profile");
  return data;
}

export async function updateProviderProfile(profileData: Record<string, unknown>) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update provider profile");
  return data;
}

export async function upsertProviderProfile(profileData: Record<string, unknown>) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to save provider profile");
  return data;
}

export async function uploadProviderProfileImage(imageFile: File) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Use the new R2 upload helper
  const { uploadFile } = await import("./upload");
  
  // Upload to R2 with public visibility (profile images should be public)
  const uploadResult = await uploadFile({
    file: imageFile,
    prefix: "profile-images",
    visibility: "public",
    category: "image",
  });

  if (!uploadResult.success) {
    throw new Error(uploadResult.error || "Failed to upload profile image");
  }

  // Send the key and URL to backend to update the profile
  const res = await fetch(`${API_BASE}/provider/profile/upload-image`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: uploadResult.key,
      url: uploadResult.url, // Public URL if visibility is "public"
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update profile with image");
  return data;
}

export async function getProviderPortfolio() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/portfolio`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch portfolio");
  return data;
}

// Portfolio Items (External Work) API functions
export async function getProviderPortfolioItems() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/portfolio-items`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch portfolio items");
  return data;
}

export async function createPortfolioItem(portfolioData: {
  title: string;
  description: string;
  techStack?: string[];
  client?: string;
  date: string;
  imageUrl?: string;
  externalUrl?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/portfolio-items`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(portfolioData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create portfolio item");
  return data;
}

export async function updatePortfolioItem(id: string, portfolioData: {
  title?: string;
  description?: string;
  techStack?: string[];
  client?: string;
  date?: string;
  imageUrl?: string;
  externalUrl?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/portfolio-items/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(portfolioData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update portfolio item");
  return data;
}

export async function deletePortfolioItem(id: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/portfolio-items/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to delete portfolio item");
  return data;
}

export async function uploadPortfolioImage(imageFile: File) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Use the new R2 upload helper
  const { uploadFile } = await import("./upload");
  
  // Upload to R2 with public visibility (portfolio images should be public)
  const uploadResult = await uploadFile({
    file: imageFile,
    prefix: "portfolio",
    visibility: "public",
    category: imageFile.type.startsWith("image/") ? "image" : "document",
  });

  if (!uploadResult.success) {
    throw new Error(uploadResult.error || "Failed to upload portfolio file to R2");
  }

  // Send the key and URL to backend
  const res = await fetch(`${API_BASE}/provider/profile/portfolio-items/upload-image`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: uploadResult.key,
      url: uploadResult.url, // Public URL if visibility is "public"
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to upload portfolio file");
  return data;
}

export async function getProviderProfileStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch provider profile stats");
  return data;
}

export async function getProviderProfileCompletion() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/profile/completion`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch profile completion");
  return data;
}

// Review API functions
// export async function getCompanyReviews(params?: {
//   page?: number;
//   limit?: number;
//   rating?: number;
//   search?: string;
//   sortBy?: string;
//   status?: string;
// }) {
//   const token = getToken();
//   if (!token) throw new Error("Not authenticated");

//   const res = await fetch(`${API_BASE}/provider/profile/portfolio`, {
//     method: "GET",
//     headers: {
//       "Authorization": `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//   });
  
//   const data = await res.json();
//   if (!res.ok) throw new Error(data?.message || "Failed to fetch portfolio");
//   return data;
// }

export async function getProviderCompletedProjects(providerId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/providers/${providerId}/completed-projects`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch reviews");
  return data;
}

// Certification API functions
export async function getMyCertifications() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/certifications`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch certifications");
  return data;
}

export async function createCertification(certificationData: {
  name: string;
  issuer: string;
  issuedDate: string;
  serialNumber?: string;
  sourceUrl?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/certifications`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(certificationData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create certification");
  return data;
}

export async function updateCertification(id: string, certificationData: {
  name: string;
  issuer: string;
  issuedDate: string;
  serialNumber?: string;
  sourceUrl?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/certifications/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(certificationData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update certification");
  return data;
}

export async function deleteCertification(id: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/certifications/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to delete certification");
  return data;
}


export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ fix
    ...options.headers,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    { ...options, headers }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// Admin User Management API
export async function getAdminUsers(filters?: { role?: string; status?: string; search?: string }) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (filters?.role) params.append("role", filters.role);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);

  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch users");
  return data;
}

export async function getAdminUserStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/users/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch user stats");
  return data;
}

export async function getAdminUserById(userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    // body: JSON.stringify({ content }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch user");
  return data;
}

export async function suspendUser(userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to suspend user");
  return data;
}

export async function activateUser(userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/users/${userId}/activate`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to activate user");
  return data;
}

export async function updateAdminUser(userId: string, updateData: Record<string, unknown>) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update user");
  return data;
}

export async function createAdminUser(userData: {
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "PROVIDER" | "CUSTOMER";
  password: string;
  providerProfile?: Record<string, unknown>;
  customerProfile?: Record<string, unknown>;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to create user");
  return data;
}

// Dispute API functions
export async function createDispute(disputeData: {
  projectId: string;
  milestoneId?: string;
  paymentId?: string;
  reason: string;
  description: string;
  contestedAmount?: number;
  suggestedResolution?: string;
  attachments?: File[];
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Extract attachments and upload to R2
  const attachments = disputeData.attachments || [];
  const attachmentResults: Array<{ key: string; url: string }> = [];

  if (attachments.length > 0) {
    const { uploadFiles } = await import("./upload");

    // Upload all attachments to R2 with private visibility (dispute attachments should be private)
    // Category will be auto-detected from file type (image, document, or video)
    const uploadResults = await uploadFiles(attachments, {
      prefix: "disputes",
      visibility: "private",
      // Don't specify category - let it auto-detect from file.type
    });

    // Collect successful uploads
    attachmentResults.push(
      ...uploadResults
        .filter((result) => result.success)
        .map((result) => ({
          key: result.key,
          url: result.url || result.key, // URL will be empty for private files, use key
        }))
    );
  }

  // Prepare JSON payload
  const payload: Record<string, unknown> = {
    projectId: disputeData.projectId,
    reason: disputeData.reason,
    description: disputeData.description,
  };

  if (disputeData.milestoneId) {
    payload.milestoneId = disputeData.milestoneId;
  }
  if (disputeData.paymentId) {
    payload.paymentId = disputeData.paymentId;
  }
  if (disputeData.contestedAmount !== undefined) {
    payload.contestedAmount = disputeData.contestedAmount;
  }
  if (disputeData.suggestedResolution) {
    payload.suggestedResolution = disputeData.suggestedResolution;
  }

  // Add attachments array
  if (attachmentResults.length > 0) {
    payload.attachments = attachmentResults;
  }

  const res = await fetch(`${API_BASE}/disputes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to create dispute");
  return data;
}

export async function getDisputeByProject(projectId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/disputes/project/${projectId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch dispute");
  return data;
}

export async function updateDispute(disputeId: string, updateData: {
  reason?: string;
  description?: string;
  contestedAmount?: number;
  suggestedResolution?: string;
  additionalNotes?: string;
  attachments?: File[];
  projectId?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Extract attachments and upload to R2
  const attachments = updateData.attachments || [];
  const attachmentResults: Array<{ key: string; url: string }> = [];

  if (attachments.length > 0) {
    const { uploadFiles } = await import("./upload");

    // Upload all attachments to R2 with private visibility (dispute attachments should be private)
    // Category will be auto-detected from file type (image, document, or video)
    const uploadResults = await uploadFiles(attachments, {
      prefix: "disputes",
      visibility: "private",
      // Don't specify category - let it auto-detect from file.type
    });

    // Collect successful uploads
    attachmentResults.push(
      ...uploadResults
        .filter((result) => result.success)
        .map((result) => ({
          key: result.key,
          url: result.url || result.key, // URL will be empty for private files, use key
        }))
    );
  }

  // Prepare JSON payload
  const payload: Record<string, unknown> = {};

  if (updateData.reason) payload.reason = updateData.reason;
  if (updateData.description) payload.description = updateData.description;
  if (updateData.contestedAmount !== undefined) {
    payload.contestedAmount = updateData.contestedAmount;
  }
  if (updateData.suggestedResolution) {
    payload.suggestedResolution = updateData.suggestedResolution;
  }
  if (updateData.additionalNotes) {
    payload.additionalNotes = updateData.additionalNotes;
  }
  if (updateData.projectId) {
    payload.projectId = updateData.projectId;
  }

  // Add attachments array
  if (attachmentResults.length > 0) {
    payload.attachments = attachmentResults;
  }

  const res = await fetch(`${API_BASE}/disputes/${disputeId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update dispute");
  return data;
}

export async function getDisputesByProject(projectId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/disputes/project/${projectId}/all`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch disputes");
  return data;
}

// Admin Disputes API
export async function getAdminDisputes(filters?: { status?: string; search?: string }) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);

  const res = await fetch(`${API_BASE}/admin/disputes?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch disputes");
  return data;
}

export async function getAdminDisputeStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/disputes/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch dispute stats");
  return data;
}

export async function getAdminDisputeById(disputeId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/disputes/${disputeId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch dispute");
  return data;
}

export async function resolveDispute(disputeId: string, status: string, resolution?: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/disputes/${disputeId}/resolve`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, resolution: resolution || "" }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to resolve dispute");
  return data;
}

export async function simulateDisputePayout(disputeId: string, refundAmount: number, releaseAmount: number, resolution?: string, bankTransferRefImage?: File) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Use FormData if there's an image, otherwise use JSON
  const useFormData = bankTransferRefImage !== undefined;

  let body: FormData | string;
  const headers: HeadersInit = {
    "Authorization": `Bearer ${token}`,
  };

  if (useFormData) {
    body = new FormData();
    body.append("refundAmount", refundAmount.toString());
    body.append("releaseAmount", releaseAmount.toString());
    body.append("resolution", resolution || "");
    if (bankTransferRefImage) {
      body.append("bankTransferRefImage", bankTransferRefImage);
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
  } else {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
    body = JSON.stringify({ refundAmount, releaseAmount, resolution: resolution || "" });
  }

  const res = await fetch(`${API_BASE}/admin/disputes/${disputeId}/payout`, {
    method: "POST",
    headers,
    body,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to simulate payout");
  return data;
}

export async function redoMilestone(disputeId: string, resolution?: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/disputes/${disputeId}/redo-milestone`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resolution: resolution || "" }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to redo milestone");
  return data;
}

// Admin Projects API
export async function getAdminProjects(filters?: { status?: string; search?: string }) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);

  const res = await fetch(`${API_BASE}/admin/projects?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch projects");
  return data;
}

export async function getAdminProjectStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/projects/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch project stats");
  return data;
}

export async function getAdminProjectById(projectId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/projects/${projectId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch project");
  return data;
}

export async function updateAdminProject(projectId: string, updateData: Record<string, unknown>) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update project");
  return data;
}

// Admin Dashboard API
export async function getAdminDashboardStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/dashboard/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch dashboard stats");
  return data;
}

export async function getAdminRecentActivity(limit?: number) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE}/admin/dashboard/activity?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch recent activity");
  return data;
}

export async function getAdminPendingVerifications(limit?: number) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE}/admin/dashboard/verifications?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch pending verifications");
  return data;
}

export async function getAdminTopProviders(limit?: number) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());

  const res = await fetch(`${API_BASE}/admin/dashboard/top-providers?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch top providers");
  return data;
}

// Admin Reports API
export async function getAdminReports(params?: {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.dateRange) searchParams.append("dateRange", params.dateRange);
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);

  const res = await fetch(`${API_BASE}/admin/reports?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch reports");
  return data;
}

export async function exportAdminReport(params?: {
  reportType?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  format?: string;
}): Promise<Blob> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.reportType) searchParams.append("reportType", params.reportType);
  if (params?.dateRange) searchParams.append("dateRange", params.dateRange);
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  if (params?.format) searchParams.append("format", params.format || "pdf");

  const res = await fetch(`${API_BASE}/admin/reports/export?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      // Do not set Content-Type for PDF download, let browser handle it
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error || "Failed to export report");
  }

  // Return blob for PDF (default format)
  return await res.blob();
}

export async function getAdminCategoryDetails(params: {
  category: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params.dateRange) searchParams.append("dateRange", params.dateRange);
  if (params.startDate) searchParams.append("startDate", params.startDate);
  if (params.endDate) searchParams.append("endDate", params.endDate);

  const encodedCategory = encodeURIComponent(params.category);
  const res = await fetch(`${API_BASE}/admin/reports/category/${encodedCategory}?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch category details");
  return data;
}

// Review API functions
export async function getCompanyReviews(params?: {
  page?: number;
  limit?: number;
  rating?: number;
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.rating) searchParams.append("rating", params.rating.toString());
  if (params?.search) searchParams.append("search", params.search);
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.status) searchParams.append("status", params.status);

  const url = `${API_BASE}/company/reviews${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch reviews");
  return data;
}

export async function getProviderReviews(params?: {
  page?: number;
  limit?: number;
  rating?: number;
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.rating) searchParams.append("rating", params.rating.toString());
  if (params?.search) searchParams.append("search", params.search);
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.status) searchParams.append("status", params.status);

  const url = `${API_BASE}/provider/reviews${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch reviews");
  return data;
}

export async function createCompanyReview(reviewData: {
  projectId: string;
  recipientId: string;
  content: string;
  rating: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  company?: string;
  role?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/reviews`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create review");
  return data;
}

export async function createProviderReview(reviewData: {
  projectId: string;
  recipientId: string;
  content: string;
  rating: number;
  communicationRating?: number;
  clarityRating?: number;
  paymentRating?: number;
  professionalismRating?: number;
  company?: string;
  role?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/reviews`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
  });
  
  const data = await res.json();
  
  if (!res.ok) throw new Error(data?.message || "Failed to create review");
  return data;
}

export async function getCompanyReviewStatistics() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/reviews/statistics`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch review statistics");
  return data;
}

export async function getProviderReviewStatistics() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/reviews/statistics`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch review statistics");
  return data;
}

export async function getCompletedProjectsForCompanyReview() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/reviews/projects/completed`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch completed projects");
  return data;
}

export async function getCompletedProjectsForProviderReview() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/reviews/projects/completed`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch completed projects");
  return data;
}

// Update review functions
export async function updateCompanyReview(reviewId: string, reviewData: {
  content?: string;
  rating?: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/company/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update review");
  return data;
}

export async function updateProviderReview(reviewId: string, reviewData: {
  content?: string;
  rating?: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to update review");
  return data;
}

// Delete review functions
export async function deleteCompanyReview(reviewId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  console.log("🔍 Deleting company review:", reviewId);
  console.log("🔍 API URL:", `${API_BASE}/company/reviews/${reviewId}`);

  const res = await fetch(`${API_BASE}/company/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  console.log("🔍 Delete response:", { status: res.status, data });
  
  if (!res.ok) throw new Error(data?.message || "Failed to delete review");
  return data;
}

export async function deleteProviderReview(reviewId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/provider/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  const data = await res.json();
  
  if (!res.ok) throw new Error(data?.message || "Failed to delete review");
  return data;
}

export async function createReviewReply(reviewId: string, content: string, isProvider: boolean = false) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const endpoint = isProvider ? "provider" : "company";
  const res = await fetch(`${API_BASE}/${endpoint}/reviews/${reviewId}/reply`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create reply");
  return data;
}

export async function getProviderAiDrafts(referenceIds?: string[]) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (referenceIds && referenceIds.length > 0) {
    params.append("referenceIds", referenceIds.join(","));
  }

  const res = await fetch(`${API_BASE}/providers/ai-drafts${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch AI drafts");
  return data;
}

export async function getCompanyAiDrafts(referenceIds?: string[]) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (referenceIds && referenceIds.length > 0) {
    params.append("referenceIds", referenceIds.join(","));
  }

  const res = await fetch(`${API_BASE}/companies/ai-drafts${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch AI drafts");
  return data;
}

export async function getServiceRequestAiDrafts(referenceIds?: string[]) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (referenceIds && referenceIds.length > 0) {
    params.append("referenceIds", referenceIds.join(","));
  }

  const res = await fetch(`${API_BASE}/provider/opportunities/ai-drafts${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch AI drafts");
  return data;
}

// Admin Payment Functions
export async function getAdminPayments(filters?: {
  search?: string;
  status?: string;
  method?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.method) params.append("method", filters.method);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const res = await fetch(`${API_BASE}/admin/payments?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch payments");
  return data;
}

export async function getAdminPaymentStats() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/payments/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch payment stats");
  return data;
}

export async function getAdminPaymentById(paymentId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/payments/${paymentId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch payment");
  return data;
}

export async function getAdminReadyToTransferPayments() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/admin/payments/ready-to-transfer`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to fetch ready to transfer payments");
  return data;
}

export async function confirmAdminBankTransfer(
  paymentId: string,
  transferRef: string,
  file?: File | null
) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("transferRef", transferRef);
  if (file) {
    formData.append("transferProof", file);
  }

  const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/confirm-transfer`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // Don't set Content-Type header when using FormData - browser will set it with boundary
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to confirm bank transfer");
  return data;
}

// R2 Upload API functions
export async function generateR2PresignedUrl(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  prefix?: string;
  visibility?: "public" | "private";
  category?: "image" | "document" | "video";
}) {
  // Token is optional (for registration flows)
  const token = getToken();

  // Validate params before sending
  if (!params.fileName || typeof params.fileName !== "string" || params.fileName.trim() === "") {
    throw new Error("fileName is required and must be a non-empty string");
  }
  if (!params.mimeType || typeof params.mimeType !== "string" || params.mimeType.trim() === "") {
    throw new Error("mimeType is required and must be a non-empty string");
  }
  if (params.fileSize === undefined || params.fileSize === null || typeof params.fileSize !== "number" || params.fileSize < 0) {
    throw new Error(`fileSize is required and must be a non-negative number (received: ${params.fileSize}, type: ${typeof params.fileSize})`);
  }

  // Log params for debugging (remove in production if needed)
  console.log("Requesting presigned URL with params:", {
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    fileSizeType: typeof params.fileSize,
    prefix: params.prefix,
    visibility: params.visibility,
    category: params.category,
  });

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Add authorization header only if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/uploads/presigned-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize, // Ensure it's a number
      prefix: params.prefix,
      visibility: params.visibility,
      category: params.category,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Presigned URL generation failed:", {
      status: res.status,
      message: data?.message,
      params: params,
    });
    throw new Error(data?.message || "Failed to generate presigned URL");
  }
  return data as {
    success: boolean;
    uploadUrl: string;
    key: string;
    accessUrl?: string; // Only present if visibility is "public"
  };
}

// Resume API functions
export async function getMyResume() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/resume`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Failed to get resume");
  return data;
}

export async function getResumeByUserId(userId: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/resume/${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Failed to get resume");
  return data;
}

export async function uploadResume(key: string, url?: string) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/resume/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, url }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Failed to upload resume");
  return data;
}

export async function deleteResume() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/resume`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || "Failed to delete resume");
  return data;
}

/**
 * Get a presigned download URL for a private file
 * @param key - R2 object key
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns Presigned download URL
 */
export async function getR2DownloadUrl(key: string, expiresIn: number = 3600) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const params = new URLSearchParams({
    key,
    expiresIn: expiresIn.toString(),
  });

  const res = await fetch(`${API_BASE}/uploads/download?${params.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to get download URL");
  return data as {
    success: boolean;
    downloadUrl: string;
    expiresIn: number;
  };
}

