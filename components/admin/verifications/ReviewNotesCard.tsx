"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface ReviewNotesCardProps {
  reviewNotes: string
  onNotesChange: (value: string) => void
}

export function ReviewNotesCard({ reviewNotes, onNotesChange }: ReviewNotesCardProps) {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">Review Notes</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <Textarea
          placeholder="Add your review notes here..."
          value={reviewNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[100px] text-sm sm:text-base"
        />
      </CardContent>
    </Card>
  )
}

