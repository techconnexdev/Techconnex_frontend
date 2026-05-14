// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const API_ENDPOINTS = {
  // Authentication endpoints
  COMPANY_REGISTER: `${API_BASE_URL}/auth/company/register`,
  COMPANY_LOGIN: `${API_BASE_URL}/auth/login`,
  PROVIDER_REGISTER: `${API_BASE_URL}/auth/provider/register`,
  PROVIDER_LOGIN: `${API_BASE_URL}/auth/login`,
  
  // File upload endpoints
  RESUME_UPLOAD: `${API_BASE_URL}/resume/upload`,
  CERTIFICATIONS_UPLOAD: `${API_BASE_URL}/certifications/upload`,
  KYC_UPLOAD_COMPANY: `${API_BASE_URL}/kyc/upload`,
  KYC_UPLOAD_PROVIDER: `${API_BASE_URL}/kyc/upload`,
  
  // Company profile endpoints
  COMPANY_PROFILE: `${API_BASE_URL}/company/profile`,
  
  // Project endpoints
  COMPANY_PROJECTS: `${API_BASE_URL}/company/projects`,
  COMPANY_PROJECT_REQUESTS: `${API_BASE_URL}/company/project-requests`,
  PROVIDER_PROPOSALS: `${API_BASE_URL}/provider/proposals`,
  
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
