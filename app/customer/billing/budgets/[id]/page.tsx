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
import { CustomerLayout } from "@/components/customer-layout"
import { useToast } from "@/hooks/use-toast"

export default function BudgetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
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
      title: "Budget Updated",
      description: "Your budget has been updated successfully.",
    })
    setEditDialogOpen(false)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    toast({
      title: "Budget Deleted",
      description: "The budget has been deleted successfully.",
    })
    setDeleteDialogOpen(false)
    router.push("/customer/billing")
  }

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{budget.category} Budget</h1>
              <p className="text-gray-600">Detailed budget overview and analytics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Budget
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Allocated</p>
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
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold">RM{budget.spent.toLocaleString()}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>{percentage.toFixed(0)}% used</span>
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
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-2xl font-bold text-green-600">RM{budget.remaining.toLocaleString()}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>{(100 - percentage).toFixed(0)}% left</span>
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
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold">{budget.projects}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span>In progress</span>
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
                <CardTitle>Budget Progress</CardTitle>
                <CardDescription>{budget.period} budget utilization</CardDescription>
              </div>
              {isOverBudget && (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Near Limit
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="font-medium">
                  RM{budget.spent.toLocaleString()} / RM{budget.allocated.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} className={`h-3 ${isOverBudget ? "bg-red-100" : ""}`} />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>{percentage.toFixed(1)}% utilized</span>
                <span>RM{budget.remaining.toLocaleString()} remaining</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Start Date</div>
                <div className="font-semibold">{new Date(budget.startDate).toLocaleDateString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">End Date</div>
                <div className="font-semibold">{new Date(budget.endDate).toLocaleDateString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Avg. Weekly</div>
                <div className="font-semibold">RM{avgWeeklySpend.toLocaleString()}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Projected Total</div>
                <div className="font-semibold">RM{projectedTotal.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Breakdown</CardTitle>
                <CardDescription>Budget allocation across active projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projectBreakdown.map((project) => (
                    <div key={project.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{project.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(project.status)}>{project.status.replace("_", " ")}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            RM{project.spent.toLocaleString()} / RM{project.allocated.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">RM{project.remaining.toLocaleString()} remaining</p>
                        </div>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                      <p className="text-sm text-gray-500">{project.progress.toFixed(0)}% complete</p>
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
                <CardTitle>Related Transactions</CardTitle>
                <CardDescription>All transactions under this budget</CardDescription>
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
                            {transaction.provider} • {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">RM{transaction.amount.toLocaleString()}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(transaction.status)}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {transaction.status}
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
                <CardTitle>Spending Trends</CardTitle>
                <CardDescription>Weekly spending analysis</CardDescription>
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
                          <span>{weekPercentage.toFixed(0)}% of weekly budget</span>
                          {weekPercentage > 80 ? (
                            <span className="text-orange-600 flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              High
                            </span>
                          ) : (
                            <span className="text-green-600 flex items-center">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Normal
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
                    <div className="text-sm text-gray-600">Avg. Weekly Spend</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{percentage.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Budget Utilized</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{budget.projects}</div>
                    <div className="text-sm text-gray-600">Active Projects</div>
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
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>Update your budget allocation and settings.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input id="edit-category" defaultValue={budget.category} />
              </div>
              <div>
                <Label htmlFor="edit-allocated">Allocated Amount (RM)</Label>
                <Input id="edit-allocated" type="number" defaultValue={budget.allocated} />
              </div>
              <div>
                <Label htmlFor="edit-period">Period</Label>
                <Select defaultValue={budget.period.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start">Start Date</Label>
                  <Input id="edit-start" type="date" defaultValue={budget.startDate} />
                </div>
                <div>
                  <Label htmlFor="edit-end">End Date</Label>
                  <Input id="edit-end" type="date" defaultValue={budget.endDate} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Budget</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this budget? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting this budget will remove all associated data and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  )
}
