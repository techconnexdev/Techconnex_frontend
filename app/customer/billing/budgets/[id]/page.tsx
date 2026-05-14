"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Calendar,
  CheckCircle,
  Briefcase,
  BarChart3,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/contexts/I18nProvider"
import type { MessageKey } from "@/lib/i18n/messages/en"

function getBudgetProjectStatusLabel(
  status: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
) {
  const map: Record<string, MessageKey> = {
    completed: "customer.billing.budget.status.completed",
    in_progress: "customer.billing.budget.status.in_progress",
    pending: "customer.billing.budget.status.pending",
  }
  return map[status] ? t(map[status]) : status.replace(/_/g, " ")
}

function getBillingStatusLabel(
  status: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
) {
  const s = status.toLowerCase().replace(/\s+/g, "_")
  const paymentKeys: Record<string, MessageKey> = {
    completed: "customer.payments.status.completed",
    pending: "customer.payments.status.pending",
    processing: "customer.payments.status.processing",
    failed: "customer.payments.status.failed",
  }
  const billingKeys: Record<string, MessageKey> = {
    paid: "customer.billing.status.paid",
    scheduled: "customer.billing.status.scheduled",
    overdue: "customer.billing.status.overdue",
    refunded: "customer.billing.status.refunded",
    approved: "customer.billing.status.approved",
  }
  if (paymentKeys[s]) return t(paymentKeys[s])
  if (billingKeys[s]) return t(billingKeys[s])
  return status.replace(/_/g, " ")
}

export default function BudgetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { t, locale } = useI18n()
  const dateLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US"
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Mock budget data - in real app, fetch based on params.id
  const budget = {
    id: params.id,
    category: "Web Development",
    allocated: 20000,
    spent: 12000,
    remaining: 8000,
    projects: 3,
    period: "Monthly",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "active",
    createdDate: "2023-12-15",
  }

  const transactions = [
    {
      id: "TXN-001",
      project: "E-commerce Website",
      description: "Frontend Development Payment",
      amount: 5000,
      date: "2024-01-15",
      status: "completed",
      provider: "Web Solutions Pro",
    },
    {
      id: "TXN-002",
      project: "Corporate Website Redesign",
      description: "UI/UX Design Phase",
      amount: 3500,
      date: "2024-01-10",
      status: "completed",
      provider: "Design Masters",
    },
    {
      id: "TXN-003",
      project: "Landing Page Development",
      description: "Full Stack Development",
      amount: 3500,
      date: "2024-01-08",
      status: "completed",
      provider: "Ahmad Tech Solutions",
    },
  ]

  const projectBreakdown = [
    {
      id: "proj-1",
      name: "E-commerce Website",
      allocated: 8000,
      spent: 5000,
      remaining: 3000,
      status: "in_progress",
      progress: 62.5,
    },
    {
      id: "proj-2",
      name: "Corporate Website Redesign",
      allocated: 7000,
      spent: 3500,
      remaining: 3500,
      status: "in_progress",
      progress: 50,
    },
    {
      id: "proj-3",
      name: "Landing Page Development",
      allocated: 5000,
      spent: 3500,
      remaining: 1500,
      status: "in_progress",
      progress: 70,
    },
  ]

  const monthlySpending = [
    { month: "Week 1", spent: 2000, budget: 5000 },
    { month: "Week 2", spent: 4500, budget: 5000 },
    { month: "Week 3", spent: 3000, budget: 5000 },
    { month: "Week 4", spent: 2500, budget: 5000 },
  ]

  const percentage = (budget.spent / budget.allocated) * 100
  const isOverBudget = percentage > 90
  const avgWeeklySpend = budget.spent / 4
  const projectedTotal = avgWeeklySpend * 4

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEdit = () => {
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    toast({
      title: t("customer.billing.budget.toastUpdatedTitle"),
      description: t("customer.billing.budget.toastUpdatedDesc"),
    })
    setEditDialogOpen(false)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    toast({
      title: t("customer.billing.budget.toastDeletedTitle"),
      description: t("customer.billing.budget.toastDeletedDesc"),
    })
    setDeleteDialogOpen(false)
    router.push("/customer/billing")
  }

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {budget.category} {t("customer.billing.budget.titleSuffix")}
              </h1>
              <p className="text-gray-600">{t("customer.billing.budget.subtitle")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              {t("customer.billing.budget.edit")}
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t("customer.billing.budget.delete")}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.budget.totalAllocated")}
                  </p>
                  <p className="text-2xl font-bold">RM{budget.allocated.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.budget.totalSpent")}
                  </p>
                  <p className="text-2xl font-bold">RM{budget.spent.toLocaleString()}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>
                      {t("customer.billing.budget.percentUsed", {
                        n: percentage.toFixed(0),
                      })}
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.budget.remaining")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">RM{budget.remaining.toLocaleString()}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>
                      {t("customer.billing.budget.percentLeft", {
                        n: (100 - percentage).toFixed(0),
                      })}
                    </span>
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.budget.activeProjects")}
                  </p>
                  <p className="text-2xl font-bold">{budget.projects}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>{t("customer.billing.budget.inProgress")}</span>
                  </div>
                </div>
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className={isOverBudget ? "ring-2 ring-red-500" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("customer.billing.budget.progressTitle")}</CardTitle>
                <CardDescription>
                  {t("customer.billing.budget.progressDesc", {
                    period: budget.period,
                  })}
                </CardDescription>
              </div>
              {isOverBudget && (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {t("customer.billing.budget.nearLimit")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {t("customer.billing.budget.overallProgress")}
                </span>
                <span className="font-medium">
                  RM{budget.spent.toLocaleString()} / RM{budget.allocated.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} className={`h-3 ${isOverBudget ? "bg-red-100" : ""}`} />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>
                  {t("customer.billing.budget.percentUtilized", {
                    n: percentage.toFixed(1),
                  })}
                </span>
                <span>
                  {t("customer.billing.budget.withAmountRemaining", {
                    amount: `RM${budget.remaining.toLocaleString()}`,
                  })}
                </span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">
                  {t("customer.billing.budget.startDate")}
                </div>
                <div className="font-semibold">
                  {new Date(budget.startDate).toLocaleDateString(dateLocale)}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">
                  {t("customer.billing.budget.endDate")}
                </div>
                <div className="font-semibold">
                  {new Date(budget.endDate).toLocaleDateString(dateLocale)}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">
                  {t("customer.billing.budget.avgWeekly")}
                </div>
                <div className="font-semibold">RM{avgWeeklySpend.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">
                  {t("customer.billing.budget.projectedTotal")}
                </div>
                <div className="font-semibold">RM{projectedTotal.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">
              {t("customer.billing.budget.tabProjects")}
            </TabsTrigger>
            <TabsTrigger value="transactions">
              {t("customer.billing.budget.tabTransactions")}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              {t("customer.billing.budget.tabAnalytics")}
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("customer.billing.budget.breakdownTitle")}</CardTitle>
                <CardDescription>
                  {t("customer.billing.budget.breakdownDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projectBreakdown.map((project) => (
                    <div key={project.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{project.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(project.status)}>
                              {getBudgetProjectStatusLabel(project.status, t)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            RM{project.spent.toLocaleString()} / RM{project.allocated.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t("customer.billing.budget.withAmountRemaining", {
                              amount: `RM${project.remaining.toLocaleString()}`,
                            })}
                          </p>
                        </div>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                      <p className="text-sm text-gray-500">
                        {t("customer.billing.budget.percentComplete", {
                          n: project.progress.toFixed(0),
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("customer.billing.budget.relatedTitle")}</CardTitle>
                <CardDescription>
                  {t("customer.billing.budget.relatedDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{transaction.project}</h3>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                          <p className="text-xs text-gray-400">
                            {transaction.provider} •{" "}
                            {new Date(transaction.date).toLocaleDateString(
                              dateLocale,
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">RM{transaction.amount.toLocaleString()}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(transaction.status)}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {getBillingStatusLabel(transaction.status, t)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("customer.billing.budget.analyticsTitle")}</CardTitle>
                <CardDescription>
                  {t("customer.billing.budget.analyticsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {monthlySpending.map((week, index) => {
                    const weekPercentage = (week.spent / week.budget) * 100
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{week.month}</span>
                          <span className="text-sm text-gray-500">
                            RM{week.spent.toLocaleString()} / RM{week.budget.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={weekPercentage} className="h-2" />
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {t("customer.billing.budget.percentOfWeekly", {
                              n: weekPercentage.toFixed(0),
                            })}
                          </span>
                          {weekPercentage > 80 ? (
                            <span className="text-orange-600 flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {t("customer.billing.budget.high")}
                            </span>
                          ) : (
                            <span className="text-green-600 flex items-center">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              {t("customer.billing.budget.normal")}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">RM{avgWeeklySpend.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">
                      {t("customer.billing.budget.avgWeeklySpendLabel")}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{percentage.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">
                      {t("customer.billing.budget.budgetUtilized")}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{budget.projects}</div>
                    <div className="text-sm text-gray-600">
                      {t("customer.billing.budget.activeProjects")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Budget Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("customer.billing.budget.dialogEditTitle")}</DialogTitle>
              <DialogDescription>
                {t("customer.billing.budget.dialogEditDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category">
                  {t("customer.billing.editBudget.category")}
                </Label>
                <Input id="edit-category" defaultValue={budget.category} />
              </div>
              <div>
                <Label htmlFor="edit-allocated">
                  {t("customer.billing.editBudget.allocated")}
                </Label>
                <Input id="edit-allocated" type="number" defaultValue={budget.allocated} />
              </div>
              <div>
                <Label htmlFor="edit-period">
                  {t("customer.billing.editBudget.period")}
                </Label>
                <Select defaultValue={budget.period.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      {t("customer.billing.editBudget.monthly")}
                    </SelectItem>
                    <SelectItem value="quarterly">
                      {t("customer.billing.editBudget.quarterly")}
                    </SelectItem>
                    <SelectItem value="yearly">
                      {t("customer.billing.editBudget.yearly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start">
                    {t("customer.billing.budget.startDate")}
                  </Label>
                  <Input id="edit-start" type="date" defaultValue={budget.startDate} />
                </div>
                <div>
                  <Label htmlFor="edit-end">
                    {t("customer.billing.budget.endDate")}
                  </Label>
                  <Input id="edit-end" type="date" defaultValue={budget.endDate} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t("customer.billing.editBudget.cancel")}
              </Button>
              <Button onClick={handleSaveEdit}>
                {t("customer.billing.editBudget.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("customer.billing.budget.dialogDeleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("customer.billing.budget.dialogDeleteDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">
                    {t("customer.billing.budget.warning")}
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {t("customer.billing.budget.warningBody")}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {t("customer.billing.editBudget.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {t("customer.billing.budget.dialogDeleteConfirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
