'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type SafeUser } from '@/types'
import { ElderlyAssessmentsAccordion } from './elderly-assessments-accordion'

interface ElderlyAssessmentsSheetProps {
  open: boolean
  onClose: () => void
  elderly: SafeUser | null
}

export function ElderlyAssessmentsSheet({
  open,
  onClose,
  elderly,
}: ElderlyAssessmentsSheetProps) {
  if (!elderly) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle>Assessments for {elderly.name}</DialogTitle>
        </DialogHeader>

        <div className="pr-4">
          <ElderlyAssessmentsAccordion elderly={elderly} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
