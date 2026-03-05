import { CustomerLayout } from "@/components/customer-layout";
import ProfileSectionClient from "@/components/customer/profile/ProfileSectionClient";

export default function ProfileCompanyPage() {
  return (
    <CustomerLayout>
      <ProfileSectionClient section="company" />
    </CustomerLayout>
  );
}
