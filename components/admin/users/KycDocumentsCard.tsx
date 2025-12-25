"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { KycDocument } from "./types"

interface KycDocumentsCardProps {
  documents: KycDocument[]
}

export function KycDocumentsCard({ documents }: KycDocumentsCardProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-sm text-gray-500">{doc.type}</p>
                  <p className="text-xs text-gray-400">Status: {doc.status}</p>
                </div>
              </div>
              <a href={`${API_URL}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  View
                </Button>
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

