'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  HandHeart,
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { type SafeUser, type Assessment } from '@/types'
import { getInitials, formatDate } from '@/lib/utils'
import { getElderlyAssessments } from '@/services/assessments'
import { getRiskLevelDisplay } from '@/lib/assessment-scoring'

interface ElderlyViewDialogProps {
  open: boolean
  onClose: () => void
  elderly: SafeUser | null
  volunteers?: SafeUser[]
  onEdit?: () => void
}

export function ElderlyViewDialog({
  open,
  onClose,
  elderly,
  volunteers = [],
  onEdit
}: ElderlyViewDialogProps) {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false)

  // Fetch assessments when dialog opens
  useEffect(() => {
    async function loadAssessments() {
      if (!elderly?.id || !open) return

      setIsLoadingAssessments(true)
      try {
        const result = await getElderlyAssessments(elderly.id)
        if (result.success && result.data) {
          setAssessments(result.data.assessments)
        }
      } catch (err) {
        console.error('Failed to load assessments:', err)
      } finally {
        setIsLoadingAssessments(false)
      }
    }

    loadAssessments()
  }, [elderly?.id, open])

  if (!elderly) return null

  const getVolunteerName = (volunteerId?: string) => {
    if (!volunteerId) return null
    const volunteer = volunteers.find(v => v.id === volunteerId)
    return volunteer?.name || 'Unknown Volunteer'
  }

  const handleViewAssessment = (assessmentId: string) => {
    onClose()
    router.push(`/dashboard/assessments/${assessmentId}`)
  }

  const handleEditAssessment = (assessmentId: string) => {
    onClose()
    router.push(`/dashboard/assessments/${assessmentId}/edit`)
  }

  const handleNewAssessment = () => {
    onClose()
    router.push(`/dashboard/assessments/new?elderlyId=${elderly.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Elder Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={elderly.avatar} alt={elderly.name} />
              <AvatarFallback className="bg-rose-100 text-rose-700 text-xl">
                {getInitials(elderly.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{elderly.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {elderly.isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <UserX className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{elderly.email}</span>
              </div>
              {elderly.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{elderly.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h4>
            <div className="grid gap-3">
              {(elderly.age || elderly.gender) && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {elderly.age && `${elderly.age} years`}
                    {elderly.age && elderly.gender && ' - '}
                    {elderly.gender && <span className="capitalize">{elderly.gender}</span>}
                  </span>
                </div>
              )}
              {elderly.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{elderly.address}</span>
                </div>
              )}
              {elderly.emergencyContact && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Emergency: {elderly.emergencyContact}</span>
                </div>
              )}
            </div>
          </div>

          {/* Volunteer Assignment */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Volunteer Assignment
            </h4>
            <div className="flex items-center gap-3">
              <HandHeart className="h-4 w-4 text-muted-foreground" />
              {elderly.assignedVolunteer ? (
                <span className="text-teal-700 font-medium">
                  {getVolunteerName(elderly.assignedVolunteer)}
                </span>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Unassigned
                </Badge>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Account Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Registered: {formatDate(elderly.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last Login: {elderly.lastLogin ? formatDate(elderly.lastLogin) : 'Never'}</span>
              </div>
            </div>
          </div>

          {/* Assessments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Assessments
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNewAssessment}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Assessment
              </Button>
            </div>

            {isLoadingAssessments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No assessments recorded yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {assessments.map((assessment) => {
                    const riskDisplay = getRiskLevelDisplay(assessment.overallRisk)
                    return (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${riskDisplay.bgColor} flex items-center justify-center`}>
                            {assessment.overallRisk === 'healthy' && (
                              <CheckCircle2 className={`w-4 h-4 ${riskDisplay.color}`} />
                            )}
                            {assessment.overallRisk === 'at_risk' && (
                              <AlertCircle className={`w-4 h-4 ${riskDisplay.color}`} />
                            )}
                            {assessment.overallRisk === 'intervention' && (
                              <AlertTriangle className={`w-4 h-4 ${riskDisplay.color}`} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(assessment.assessedAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${riskDisplay.bgColor} ${riskDisplay.color}`}
                              >
                                {riskDisplay.label}
                              </Badge>
                              {assessment.assessor?.name && (
                                <span className="text-xs text-muted-foreground">
                                  by {assessment.assessor.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewAssessment(assessment.id)}
                            className="h-7 w-7 p-0"
                            title="View Assessment"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditAssessment(assessment.id)}
                            className="h-7 w-7 p-0"
                            title="Edit Assessment"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button onClick={onEdit}>
                Edit Elder
              </Button>
            )}
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
