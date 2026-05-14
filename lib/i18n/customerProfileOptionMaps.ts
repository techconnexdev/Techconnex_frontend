import type { MessageKey } from "./messages/en";

/** Registration form industry values (lowercase API values → i18n keys). */
export const AUTH_COMPANY_REGISTER_INDUSTRY: Record<string, MessageKey> = {
  technology: "auth.companyRegister.industry.technology",
  finance: "auth.companyRegister.industry.finance",
  healthcare: "auth.companyRegister.industry.healthcare",
  education: "auth.companyRegister.industry.education",
  retail: "auth.companyRegister.industry.retail",
  manufacturing: "auth.companyRegister.industry.manufacturing",
  consulting: "auth.companyRegister.industry.consulting",
  media: "auth.companyRegister.industry.media",
  government: "auth.companyRegister.industry.government",
  nonprofit: "auth.companyRegister.industry.nonprofit",
  other: "auth.companyRegister.industry.other",
};

/** Display labels for stored English enum values (company profile). */
export const PROFILE_INDUSTRY: Record<string, MessageKey> = {
  Technology: "customer.profile.company.industry.technology",
  Finance: "customer.profile.company.industry.finance",
  Healthcare: "customer.profile.company.industry.healthcare",
  Education: "customer.profile.company.industry.education",
  Manufacturing: "customer.profile.company.industry.manufacturing",
  Retail: "customer.profile.company.industry.retail",
  Government: "customer.profile.company.industry.government",
  Consulting: "customer.profile.company.industry.consulting",
  "Real Estate": "customer.profile.company.industry.real_estate",
  Other: "customer.profile.company.industry.other",
};

export const PROFILE_COMPANY_SIZE: Record<string, MessageKey> = {
  "1-10": "customer.profile.company.size.startup",
  "11-50": "customer.profile.company.size.small",
  "51-200": "customer.profile.company.size.medium",
  "201-1000": "customer.profile.company.size.large",
  "1000+": "customer.profile.company.size.enterprise",
  "150": "customer.profile.company.size.n150",
};

export const PROFILE_FUNDING: Record<string, MessageKey> = {
  "Pre-seed": "customer.profile.company.funding.pre_seed",
  Bootstrap: "customer.profile.company.funding.bootstrap",
  Seed: "customer.profile.company.funding.seed",
  "Series A": "customer.profile.company.funding.series_a",
  "Series B": "customer.profile.company.funding.series_b",
  "Series C": "customer.profile.company.funding.series_c",
  "Series D+": "customer.profile.company.funding.series_d_plus",
  Bootstrapped: "customer.profile.company.funding.bootstrapped",
  "Private Equity": "customer.profile.company.funding.private_equity",
  Public: "customer.profile.company.funding.public",
  "Non-profit": "customer.profile.company.funding.nonprofit",
  Other: "customer.profile.company.funding.other",
};

export const PROFILE_REMOTE: Record<string, MessageKey> = {
  "Fully Remote": "customer.profile.company.remote.fully_remote",
  Hybrid: "customer.profile.company.remote.hybrid",
  "On-site": "customer.profile.company.remote.onsite",
  Flexible: "customer.profile.company.remote.flexible",
  "Office-based with remote options":
    "customer.profile.company.remote.office_remote_options",
  "Fully Office-based": "customer.profile.company.remote.fully_office",
};

export const PROFILE_HIRING_FREQ: Record<string, MessageKey> = {
  Occasional: "customer.profile.company.hiring.occasional",
  Regular: "customer.profile.company.hiring.regular",
  "Project-based": "customer.profile.company.hiring.project_based",
  Enterprise: "customer.profile.company.hiring.enterprise",
  "One-time": "customer.profile.company.hiring.one_time",
  Ongoing: "customer.profile.company.hiring.ongoing",
  Seasonal: "customer.profile.company.hiring.seasonal",
  "As needed": "customer.profile.company.hiring.as_needed",
};

export const PROFILE_CONTRACT: Record<string, MessageKey> = {
  "Fixed Price": "customer.profile.company.contract.fixed_price",
  "Time & Materials": "customer.profile.company.contract.time_materials",
  "Monthly Retainer": "customer.profile.company.contract.monthly_retainer",
  "Milestone-based": "customer.profile.company.contract.milestone_based",
  Hourly: "customer.profile.company.contract.hourly",
  "Dedicated Team": "customer.profile.company.contract.dedicated_team",
};

export const PROFILE_HIRE_CATEGORY: Record<string, MessageKey> = {
  "Web Development": "customer.profile.company.hire.web_development",
  "Mobile Development": "customer.profile.company.hire.mobile_development",
  "UI/UX Design": "customer.profile.company.hire.ui_ux_design",
  DevOps: "customer.profile.company.hire.devops",
  "Data Science": "customer.profile.company.hire.data_science",
  "AI/ML": "customer.profile.company.hire.ai_ml",
  "Cloud Computing": "customer.profile.company.hire.cloud_computing",
  Cybersecurity: "customer.profile.company.hire.cybersecurity",
  Blockchain: "customer.profile.company.hire.blockchain",
  IoT: "customer.profile.company.hire.iot",
  "Software Architecture": "customer.profile.company.hire.software_architecture",
  "Quality Assurance": "customer.profile.company.hire.quality_assurance",
  "Project Management": "customer.profile.company.hire.project_management",
  "Product Management": "customer.profile.company.hire.product_management",
  "Technical Writing": "customer.profile.company.hire.technical_writing",
};

export const PROFILE_CORE_VALUE: Record<string, MessageKey> = {
  Innovation: "customer.profile.company.value.innovation",
  Quality: "customer.profile.company.value.quality",
  "Customer Focus": "customer.profile.company.value.customer_focus",
  Teamwork: "customer.profile.company.value.teamwork",
  Integrity: "customer.profile.company.value.integrity",
  Transparency: "customer.profile.company.value.transparency",
  Sustainability: "customer.profile.company.value.sustainability",
  "Diversity & Inclusion": "customer.profile.company.value.diversity_inclusion",
  Agility: "customer.profile.company.value.agility",
  Excellence: "customer.profile.company.value.excellence",
  Collaboration: "customer.profile.company.value.collaboration",
  Accountability: "customer.profile.company.value.accountability",
  "Growth Mindset": "customer.profile.company.value.growth_mindset",
  "Work-Life Balance": "customer.profile.company.value.work_life_balance",
  "Social Responsibility": "customer.profile.company.value.social_responsibility",
};

export function profileStoredLabel(
  map: Record<string, MessageKey>,
  value: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string {
  const key = map[value];
  return key ? t(key) : value;
}
