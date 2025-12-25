// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const API_ENDPOINTS = {
  // Authentication endpoints
  COMPANY_REGISTER: `${API_BASE_URL}/company/auth/register`,
  COMPANY_LOGIN: `${API_BASE_URL}/company/auth/login`,
  PROVIDER_REGISTER: `${API_BASE_URL}/provider/auth/register`,
  PROVIDER_LOGIN: `${API_BASE_URL}/provider/auth/login`,
  
  // File upload endpoints
  RESUME_UPLOAD: `${API_BASE_URL}/api/resume/upload`,
  CERTIFICATIONS_UPLOAD: `${API_BASE_URL}/api/certifications/upload`,
  KYC_UPLOAD_COMPANY: `${API_BASE_URL}/api/kyc/upload/company`,
  KYC_UPLOAD_PROVIDER: `${API_BASE_URL}/api/kyc/upload/provider`,
  
  // Company profile endpoints
  COMPANY_PROFILE: `${API_BASE_URL}/company/profile`,
  
  // Project endpoints
  COMPANY_PROJECTS: `${API_BASE_URL}/api/company/projects`,
  COMPANY_PROJECT_REQUESTS: `${API_BASE_URL}/api/company/project-requests`,
  PROVIDER_PROPOSALS: `${API_BASE_URL}/api/provider/proposals`,
  
  // Review endpoints
  COMPANY_REVIEWS: `${API_BASE_URL}/company/reviews`,
  PROVIDER_REVIEWS: `${API_BASE_URL}/provider/reviews`,
  COMPANY_REVIEW_STATISTICS: `${API_BASE_URL}/company/reviews/statistics`,
  PROVIDER_REVIEW_STATISTICS: `${API_BASE_URL}/provider/reviews/statistics`,
  COMPANY_COMPLETED_PROJECTS: `${API_BASE_URL}/company/reviews/projects/completed`,
  PROVIDER_COMPLETED_PROJECTS: `${API_BASE_URL}/provider/reviews/projects/completed`,
  
  // Other endpoints
  HEALTH: `${API_BASE_URL}/health`,
} as const;

export default API_ENDPOINTS;
