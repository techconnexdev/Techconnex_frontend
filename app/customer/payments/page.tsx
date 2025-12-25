"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Receipt,
} from "lucide-react"
import { CustomerLayout } from "@/components/customer-layout"

export default function CustomerPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [activeTab, setActiveTab] = useState("transactions")

  // Mock payment data
  const transactions = [
    {
      id: "TXN-001",
      type: "payment",
      description: "Payment to Ahmad Tech Solutions",
      project: "E-commerce Mobile App Development",
      amount: 5000,
      currency: "MYR",
      status: "completed",
      date: "2024-01-15",
      method: "Credit Card",
      reference: "REF-2024-001",
      provider: "Ahmad Tech Solutions",
      milestone: "UI Design & Setup",
    },
    {
      id: "TXN-002",
      type: "payment",
      description: "Payment to Web Solutions Pro",
      project: "Company Website Redesign",
      amount: 3500,
      currency: "MYR",
      status: "completed",
      date: "2024-01-10",
      method: "Online Banking",
      reference: "REF-2024-002",
      provider: "Web Solutions Pro",
      milestone: "Final Delivery",
    },
    {
      id: "TXN-003",
      type: "refund",
      description: "Refund from Digital Marketing Experts",
      project: "SEO Optimization Campaign",
      amount: 500,
      currency: "MYR",
      status: "processing",
      date: "2024-01-08",
      method: "Credit Card",
      reference: "REF-2024-003",
      provider: "Digital Marketing Experts",
      milestone: "Partial Refund",
    },
    {
      id: "TXN-004",
      type: "payment",
      description: "Payment to Cloud Solutions Inc",
      project: "AWS Infrastructure Setup",
      amount: 2800,
      currency: "MYR",
      status: "pending",
      date: "2024-01-20",
      method: "Credit Card",
      reference: "REF-2024-004",
      provider: "Cloud Solutions Inc",
      milestone: "Infrastructure Setup",
    },
  ]

  const paymentMethods = [
    {
      id: "card-1",
      type: "credit_card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      name: "Ahmad Rahman",
    },
    {
      id: "card-2",
      type: "credit_card",
      brand: "Mastercard",
      last4: "8888",
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
      name: "Ahmad Rahman",
    },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.provider.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus

    const matchesPeriod =
      filterPeriod === "all" ||
      (() => {
        const transactionDate = new Date(transaction.date)
        const now = new Date()
        switch (filterPeriod) {
          case "week":
            return now.getTime() - transactionDate.getTime() <= 7 * 24 * 60 * 60 * 1000
          case "month":
            return now.getTime() - transactionDate.getTime() <= 30 * 24 * 60 * 60 * 1000
          case "quarter":
            return now.getTime() - transactionDate.getTime() <= 90 * 24 * 60 * 60 * 1000
          default:
            return true
        }
      })()

    return matchesSearch && matchesStatus && matchesPeriod
  })

  const stats = {
    totalSpent: transactions
      .filter((t) => t.type === "payment" && t.status === "completed")
      .reduce((acc, t) => acc + t.amount, 0),
    pendingPayments: transactions.filter((t) => t.status === "pending").reduce((acc, t) => acc + t.amount, 0),
    totalTransactions: transactions.length,
    thisMonth: transactions
      .filter((t) => {
        const transactionDate = new Date(t.date)
        const now = new Date()
        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear()
      })
      .reduce((acc, t) => acc + (t.type === "payment" ? t.amount : 0), 0),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "processing":
        return <Clock className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "💳"
      case "mastercard":
        return "💳"
      case "amex":
        return "💳"
      default:
        return "💳"
    }
  }

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
            <p className="text-gray-600">Manage your payment history and billing information</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>Add a new credit card or payment method to your account.</DialogDescription>
                </DialogHeader>
                <AddPaymentMethodForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold">RM{stats.totalSpent.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Payments</p>
                  <p className="text-2xl font-bold">RM{stats.pendingPayments.toLocaleString()}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">RM{stats.thisMonth.toLocaleString()}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <Receipt className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full lg:w-48">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          {transaction.type === "payment" ? (
                            <CreditCard className="w-6 h-6 text-blue-600" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{transaction.description}</h3>
                          <p className="text-sm text-gray-500">{transaction.project}</p>
                          <p className="text-xs text-gray-400">
                            {transaction.milestone} • {transaction.method} • {transaction.reference}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-lg font-bold ${transaction.type === "refund" ? "text-green-600" : "text-gray-900"}`}
                          >
                            {transaction.type === "refund" ? "+" : "-"}RM{transaction.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">{transaction.status}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTransactions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== "all" || filterPeriod !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "You haven't made any payments yet."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <Card key={method.id} className={method.isDefault ? "ring-2 ring-blue-500" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCardIcon(method.brand)}</div>
                        <div>
                          <p className="font-semibold">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {method.expiryMonth.toString().padStart(2, "0")}/{method.expiryYear}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{method.name}</p>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button variant="outline" size="sm">
                          Set as Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  )
}

function AddPaymentMethodForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Card Number</label>
          <Input placeholder="1234 5678 9012 3456" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Cardholder Name</label>
          <Input placeholder="Ahmad Rahman" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Expiry Date</label>
          <Input placeholder="MM/YY" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CVV</label>
          <Input placeholder="123" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="default" className="rounded" />
        <label htmlFor="default" className="text-sm">
          Set as default payment method
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button>Add Payment Method</Button>
      </div>
    </div>
  )
}
