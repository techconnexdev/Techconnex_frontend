import { AdminLayout } from "@/components/admin-layout"
import PaymentsClient from "./PaymentsClient"

export default function AdminPaymentsPage() {

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600">Monitor and manage all platform transactions</p>
          </div>
        </div>

        <PaymentsClient />
      </div>
    </AdminLayout>
  )
}
