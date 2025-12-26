'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { type Assessment } from '@/types'
import { AssessmentDetailView } from './assessment-detail-view'
import { formatDate } from '@/lib/utils'

interface AssessmentViewDialogProps {
  open: boolean
  onClose: () => void
  assessment: Assessment | null
}

export function AssessmentViewDialog({
  open,
  onClose,
  assessment,
}: AssessmentViewDialogProps) {
  if (!assessment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Assessment Details
          </DialogTitle>
          <DialogDescription>
            Assessment conducted on {formatDate(assessment.assessedAt)}
          </DialogDescription>
        </DialogHeader>

        <AssessmentDetailView
          assessment={assessment}
          showPrintButton={true}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
