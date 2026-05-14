/**
 * Provider header/shell profile — cached via TanStack Query in `ProviderLayout`.
 * Invalidate after profile image upload or material profile edits (see
 * `useInvalidateProviderLayoutProfile`).
 */

export type ProviderLayoutProfile = {
  id?: string;
  name?: string;
  email?: string;
  profileImageUrl?: string;
  user?: {
    name?: string;
    email?: string;
  };
  resume?: {
    fileUrl?: string;
  };
  data?: {
    user?: {
      name?: string;
      email?: string;
    };
  };
  [key: string]: unknown;
};

export async function fetchProviderLayoutProfile(): Promise<ProviderLayoutProfile> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("Not authenticated");

  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${base}/provider/profile/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");

  const response = (await res.json()) as {
    data?: ProviderLayoutProfile;
  } & ProviderLayoutProfile;
  return (response.data ?? response) as ProviderLayoutProfile;
}
