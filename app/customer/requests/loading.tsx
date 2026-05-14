import { CustomerRequestsListSkeleton } from "@/components/customer/CustomerPageSkeletons";

export default function Loading() {
  return <CustomerRequestsListSkeleton loadingLabel="Loading requests" />;
}
