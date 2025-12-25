"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, FileText, Building, User } from "lucide-react"
import { VerificationRow, KycUser } from "./types"
import { getAttachmentUrl, getR2DownloadUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

function getStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-800"
    case "uploaded":
      return "bg-yellow-100 text-yellow-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "under_review":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getDocumentStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "text-green-600"
    case "uploaded":
      return "text-blue-600"
    case "rejected":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

interface VerificationsTableProps {
  rows: VerificationRow[]
  loading: boolean
  onSelectUser: (user: KycUser) => void
}

export function VerificationsTable({ rows, loading, onSelectUser }: VerificationsTableProps) {
  const { toast } = useToast()

  const handleDocumentClick = async (doc: { fileUrl: string; filename: string }) => {
    try {
      const attachmentUrl = getAttachmentUrl(doc.fileUrl)
      const isR2Key = attachmentUrl === "#"

      if (isR2Key) {
        const downloadData = await getR2DownloadUrl(doc.fileUrl)
        window.open(downloadData.downloadUrl, "_blank")
      } else {
        window.open(attachmentUrl, "_blank")
      }
    } catch (error: unknown) {
      console.error("Failed to open document:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open document",
        variant: "destructive",
      })
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Documents</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((u) => (
          <TableRow key={u.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{u.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{u.name || "Unnamed"}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {u._uiType === "provider" ? (
                  <User className="w-4 h-4 text-blue-600" />
                ) : (
                  <Building className="w-4 h-4 text-purple-600" />
                )}
                <Badge
                  className={
                    u._uiType === "provider"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }
                >
                  {u._uiType.charAt(0).toUpperCase() + u._uiType.slice(1)}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(u._uiStatus)}>
                {u._uiStatus.charAt(0).toUpperCase() + u._uiStatus.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="space-y-1 max-w-[260px]">
                {u.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className={`w-3 h-3 ${getDocumentStatusColor(doc.status)}`} />
                    <a
                      className="truncate underline decoration-dotted cursor-pointer"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDocumentClick(doc)
                      }}
                      title={doc.filename}
                    >
                      {doc.type}
                    </a>
                    <Badge variant="outline" className={`text-xs ${getDocumentStatusColor(doc.status)}`}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{u.submittedDate}</p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onSelectUser(u)}>
                <Eye className="w-4 h-4 mr-2" />
                Review
              </Button>
            </TableCell>
          </TableRow>
        ))}

        {!loading && rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-12">
              No verification requests found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

