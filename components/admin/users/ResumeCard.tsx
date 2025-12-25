"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Loader2 } from "lucide-react"

interface ResumeCardProps {
  loading: boolean
  resume: { fileUrl: string; uploadedAt: string } | null
  onDownload: () => void
}

export function ResumeCard({ loading, resume, onDownload }: ResumeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading resume...</span>
          </div>
        ) : resume ? (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium">Resume uploaded</p>
                <p className="text-sm text-gray-500">
                  Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No resume uploaded</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

