import { Skeleton } from "@/components/ui/skeleton"
import { CustomerLayout } from "@/components/customer-layout"

export default function ProviderProfileLoading() {
  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Cover Image Skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* Profile Header Skeleton */}
        <div className="relative -mt-24 px-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6">
            <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />

            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-40 mb-3" />

                  <div className="flex flex-wrap items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20" />
            ))}
          </div>

          {/* Tab Content Skeleton */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio Skeleton */}
              <div className="border rounded-lg p-6">
                <Skeleton className="h-6 w-16 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>

              {/* Skills Skeleton */}
              <div className="border rounded-lg p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Work Skeleton */}
              <div className="border rounded-lg p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="grid md:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <Skeleton className="w-full h-32" />
                      <div className="p-4">
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <div className="flex flex-wrap gap-1">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Info Skeleton */}
              <div className="border rounded-lg p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages Skeleton */}
              <div className="border rounded-lg p-6">
                <Skeleton className="h-6 w-20 mb-4" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialties Skeleton */}
              <div className="border rounded-lg p-6">
                <Skeleton className="h-6 w-20 mb-4" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}
