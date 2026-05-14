import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerProviderGridSkeleton } from "@/components/customer/CustomerPageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <Skeleton className="h-8 sm:h-9 w-56 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-md" />
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
      <CustomerProviderGridSkeleton
        loadingLabel="Loading providers"
        count={6}
        recommended={false}
      />
    </div>
  );
}
