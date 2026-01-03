import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminReviewsLoading() {
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
        {/* Header skeleton */}
        <div>
          <div className="h-7 sm:h-8 w-48 sm:w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 sm:h-4 w-64 sm:w-96 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main card skeleton */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="h-5 sm:h-6 w-28 sm:w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 sm:h-4 w-48 sm:w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full sm:w-64 bg-gray-200 rounded animate-pulse mt-4" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 animate-pulse"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="h-4 w-32 sm:w-40 bg-gray-200 rounded" />
                      <div className="h-3 w-48 sm:w-56 bg-gray-200 rounded" />
                      <div className="h-12 sm:h-16 w-full bg-gray-200 rounded" />
                      <div className="h-3 w-36 sm:w-48 bg-gray-200 rounded" />
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                      <div className="h-8 w-8 sm:h-9 sm:w-20 bg-gray-200 rounded" />
                      <div className="h-8 w-8 sm:h-9 sm:w-20 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
