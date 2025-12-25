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
      <CardHeader>
        <CardTitle className="text-lg">Review Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Add your review notes here..."
          value={reviewNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[100px]"
        />
      </CardContent>
    </Card>
  )
}

