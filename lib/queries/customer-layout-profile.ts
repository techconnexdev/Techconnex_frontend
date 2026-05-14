/**
 * Customer (company) shell profile — cached via TanStack Query in `CustomerLayout`.
 * Invalidate after logo/image upload or `upsertCompanyProfile` (see
 * `useInvalidateCustomerLayoutProfile`).
 */

export type CustomerLayoutProfile = {
  id?: string;
  name?: string;
  email?: string;
  data?: {
    name?: string;
    email?: string;
    customerProfile?: {
      profileImageUrl?: string;
    };
  };
  [key: string]: unknown;
};

export async function fetchCustomerLayoutProfile(): Promise<CustomerLayoutProfile> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${base}/company/profile/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");

  return (await res.json()) as CustomerLayoutProfile;
}
