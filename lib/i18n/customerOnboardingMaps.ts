import type { MessageKey } from "./messages/en";
import {
  PROFILE_CONTRACT,
  PROFILE_INDUSTRY,
  profileStoredLabel,
} from "./customerProfileOptionMaps";

/** Contract types shown in onboarding (extends profile map). */
export const ONBOARDING_CONTRACT: Record<string, MessageKey> = {
  ...PROFILE_CONTRACT,
  "Dedicated Team": "customer.onboarding.contract.dedicated_team",
};

/** Onboarding industry <Select> values (lowercase API values). */
export const ONBOARDING_INDUSTRY_VALUE: Record<string, MessageKey> = {
  technology: "customer.onboarding.industryOption.technology",
  finance: "customer.onboarding.industryOption.finance",
  healthcare: "customer.onboarding.industryOption.healthcare",
  education: "customer.onboarding.industryOption.education",
  retail: "customer.onboarding.industryOption.retail",
  manufacturing: "customer.onboarding.industryOption.manufacturing",
  consulting: "customer.onboarding.industryOption.consulting",
  media: "customer.onboarding.industryOption.media",
  government: "customer.onboarding.industryOption.government",
  nonprofit: "customer.onboarding.industryOption.nonprofit",
  other: "customer.onboarding.industryOption.other",
};

export const ONBOARDING_STATE: Record<string, MessageKey> = {
  "Kuala Lumpur": "customer.onboarding.state.kuala_lumpur",
  Selangor: "customer.onboarding.state.selangor",
  Penang: "customer.onboarding.state.penang",
  Johor: "customer.onboarding.state.johor",
  Perak: "customer.onboarding.state.perak",
  Kedah: "customer.onboarding.state.kedah",
  Kelantan: "customer.onboarding.state.kelantan",
  Terengganu: "customer.onboarding.state.terengganu",
  Pahang: "customer.onboarding.state.pahang",
  "Negeri Sembilan": "customer.onboarding.state.negeri_sembilan",
  Melaka: "customer.onboarding.state.melaka",
  Perlis: "customer.onboarding.state.perlis",
  Sabah: "customer.onboarding.state.sabah",
  Sarawak: "customer.onboarding.state.sarawak",
};

export const ONBOARDING_FUNDING: Record<string, MessageKey> = {
  "Pre-seed": "customer.onboarding.funding.pre_seed",
  Seed: "customer.onboarding.funding.seed",
  "Series A": "customer.onboarding.funding.series_a",
  "Series B": "customer.onboarding.funding.series_b",
  "Series C": "customer.onboarding.funding.series_c",
  "Series D+": "customer.onboarding.funding.series_d_plus",
  Bootstrapped: "customer.onboarding.funding.bootstrapped",
  Public: "customer.onboarding.funding.public",
  "Private Equity": "customer.onboarding.funding.private_equity",
  "Non-profit": "customer.onboarding.funding.nonprofit",
};

export const ONBOARDING_HIRING_FREQ: Record<string, MessageKey> = {
  "One-time": "customer.onboarding.hiringFreq.one_time",
  Ongoing: "customer.onboarding.hiringFreq.ongoing",
  "Project-based": "customer.onboarding.hiringFreq.project_based",
  Seasonal: "customer.onboarding.hiringFreq.seasonal",
  "As needed": "customer.onboarding.hiringFreq.as_needed",
};

export const ONBOARDING_REMOTE: Record<string, MessageKey> = {
  "Fully Remote": "customer.onboarding.remote.fully_remote",
  Hybrid: "customer.onboarding.remote.hybrid",
  "Office-based with remote options":
    "customer.onboarding.remote.office_with_remote",
  "Fully Office-based": "customer.onboarding.remote.fully_office",
};

export function formatOnboardingIndustry(
  value: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string {
  const v = value?.trim();
  if (!v) return "";
  const byValue = profileStoredLabel(ONBOARDING_INDUSTRY_VALUE, v, t);
  if (byValue !== v) return byValue;
  return profileStoredLabel(PROFILE_INDUSTRY, v, t);
}

export { profileStoredLabel };
