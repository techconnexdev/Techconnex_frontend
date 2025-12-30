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
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Resume</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            <span className="ml-2 text-sm sm:text-base">Loading resume...</span>
          </div>
        ) : resume ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
            <div className="flex items-center gap-3 sm:gap-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Resume uploaded</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDownload} className="w-full sm:w-auto text-xs sm:text-sm">
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Download
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">No resume uploaded</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

