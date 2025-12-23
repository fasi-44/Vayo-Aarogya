'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { type Assessment } from '@/types'

interface AssessmentDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  assessment: Assessment | null
}

export function AssessmentDeleteDialog({
  open,
  onClose,
  onConfirm,
  assessment,
}: AssessmentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!assessment) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assessment')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Assessment
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the assessment record.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              You are about to delete the assessment for{' '}
              <span className="font-semibold">{assessment.subject?.name || 'Unknown'}</span>
              {assessment.subject?.vayoId && (
                <span className="text-red-600"> ({assessment.subject.vayoId})</span>
              )}
              {' '}conducted on{' '}
              <span className="font-semibold">
                {new Date(assessment.assessedAt).toLocaleDateString()}
              </span>.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Assessment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
