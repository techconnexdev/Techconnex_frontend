// app/customer/profile/page.tsx
import ProfileClient from "@/components/customer/profile/ProfileClient";

// Render client-only profile component. The client will fetch real data from the backend.
export default function ProfilePage() {
  return (
    
      <ProfileClient />
    
  );
}
