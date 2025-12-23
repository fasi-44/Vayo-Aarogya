'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Loader2,
  Play,
  Trash2,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react'
import { getDraftAssessments, deleteAssessment } from '@/services/assessments'
import { type Assessment } from '@/types'
import { ASSESSMENT_DOMAINS } from '@/lib/assessment-scoring'

interface DraftAssessmentsListProps {
  onResumeDraft: (draft: Assessment) => void
  onDraftsChange?: () => void
}

export function DraftAssessmentsList({ onResumeDraft, onDraftsChange }: DraftAssessmentsListProps) {
  const [drafts, setDrafts] = useState<Assessment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<Assessment | null>(null)

  const loadDrafts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getDraftAssessments()
      if (result.success && result.data) {
        setDrafts(result.data.drafts)
      } else {
        setError(result.error || 'Failed to load drafts')
      }
    } catch (err) {
      setError('Failed to load drafts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDrafts()
  }, [])

  const calculateProgress = (draft: Assessment): number => {
    if (!draft.domainScores) return 0

    const domainData = draft.domainScores as Record<string, { answers: Record<string, number> }>
    let totalQuestions = 0
    let answeredQuestions = 0

    ASSESSMENT_DOMAINS.forEach(domain => {
      totalQuestions += domain.questions.length
      const domainAnswers = domainData[domain.id]?.answers || {}
      answeredQuestions += Object.keys(domainAnswers).length
    })

    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  const handleDeleteClick = (draft: Assessment) => {
    setDraftToDelete(draft)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return

    setDeletingId(draftToDelete.id)
    setDeleteDialogOpen(false)

    try {
      const result = await deleteAssessment(draftToDelete.id)
      if (result.success) {
        setDrafts(prev => prev.filter(d => d.id !== draftToDelete.id))
        if (onDraftsChange) {
          onDraftsChange()
        }
      } else {
        setError(result.error || 'Failed to delete draft')
      }
    } catch (err) {
      setError('Failed to delete draft')
    } finally {
      setDeletingId(null)
      setDraftToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-amber-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading drafts...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadDrafts} className="ml-auto">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (drafts.length === 0) {
    return null // Don't show anything if no drafts
  }

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-800">Incomplete Assessments</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            You have {drafts.length} draft{drafts.length > 1 ? 's' : ''} that can be resumed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {drafts.map((draft) => {
            const progress = calculateProgress(draft)
            const subject = draft.subject as { id: string; name: string; vayoId?: string; age?: number; villageName?: string } | undefined

            return (
              <div
                key={draft.id}
                className="bg-white rounded-lg border border-amber-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{subject?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {subject?.vayoId && (
                          <Badge variant="outline" className="text-xs">
                            {subject.vayoId}
                          </Badge>
                        )}
                        {subject?.age && <span>{subject.age} yrs</span>}
                        {subject?.villageName && <span>• {subject.villageName}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(draft.updatedAt)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-amber-700">{progress}% complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(draft)}
                    disabled={deletingId === draft.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === draft.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onResumeDraft(draft)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft Assessment?</DialogTitle>
            <DialogDescription>
              This will permanently delete the draft assessment for{' '}
              <strong>{(draftToDelete?.subject as { name?: string })?.name || 'this person'}</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
