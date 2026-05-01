'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Calendar,
  UserCircle,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Brain,
  Heart,
  Eye as EyeIcon,
  Footprints,
  Utensils,
  Users,
  Printer,
  Plus,
  Loader2,
  ClipboardList,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Assessment, type AssessmentDomain, type RiskLevel, type Intervention } from '@/types'
import { getRiskLevelDisplay, buildResultFromStored } from '@/lib/assessment-scoring'
import { AssessmentReport } from './assessment-report'
import { createIntervention, getAssessmentInterventions, DOMAIN_NAMES, STATUS_COLORS, PRIORITY_COLORS } from '@/services/interventions'
import { formatDate, formatTime } from '@/lib/utils'

interface AssessmentDetailViewProps {
  assessment: Assessment
  compact?: boolean // For use inside accordions - hides some elements
  showSubject?: boolean // Whether to show subject info card
  showPrintButton?: boolean // Whether to show print button
}

export function AssessmentDetailView({
  assessment,
  compact = false,
  showSubject = true,
  showPrintButton = true,
}: AssessmentDetailViewProps) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const overallDisplay = getRiskLevelDisplay(assessment.overallRisk)

  // Intervention data state
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoadingInterventions, setIsLoadingInterventions] = useState(false)
  const [showViewInterventionsDialog, setShowViewInterventionsDialog] = useState(false)

  // Intervention dialog state
  const [showInterventionDialog, setShowInterventionDialog] = useState(false)
  const [isCreatingIntervention, setIsCreatingIntervention] = useState(false)
  const [interventionForm, setInterventionForm] = useState({
    title: '',
    description: '',
    domain: '',
    priority: 'high' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
    notes: '',
  })
  const [interventionError, setInterventionError] = useState<string | null>(null)
  const [interventionSuccess, setInterventionSuccess] = useState(false)

  // Get domains that need intervention
  const interventionDomains = (assessment.domains || []).filter(
    d => d.riskLevel === 'intervention'
  )

  // Rebuild the PDF-section-6 report from stored answers
  const reportResult = buildResultFromStored(
    (assessment.domains || []) as Array<{ domain: string; answers?: unknown; notes?: string | null }>,
    assessment.domainScores,
  )

  // Calculate intervention status
  const hasInterventions = interventions.length > 0
  const completedInterventions = interventions.filter(i => i.status === 'completed')
  const pendingInterventions = interventions.filter(i => i.status === 'pending' || i.status === 'in_progress')
  const allInterventionsCompleted = hasInterventions && pendingInterventions.length === 0

  // Fetch interventions for this assessment
  useEffect(() => {
    async function fetchInterventions() {
      if (!assessment.id) return

      setIsLoadingInterventions(true)
      try {
        const result = await getAssessmentInterventions(assessment.id)
        if (result.success && result.data) {
          setInterventions(result.data.interventions)
        }
      } catch (err) {
        console.error('Failed to load interventions:', err)
      } finally {
        setIsLoadingInterventions(false)
      }
    }

    fetchInterventions()
  }, [assessment.id])

  // Handle opening intervention dialog with pre-filled domain
  const handleAddIntervention = (domain?: AssessmentDomain) => {
    setInterventionForm({
      title: domain ? `Intervention for ${getDomainName(domain.domain)}` : '',
      description: domain ? `Based on assessment dated ${formatDate(assessment.assessedAt)}. Risk level: Intervention required.` : '',
      domain: domain?.domain || '',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      notes: domain?.notes || '',
    })
    setInterventionError(null)
    setInterventionSuccess(false)
    setShowInterventionDialog(true)
  }

  // Handle creating intervention
  const handleCreateIntervention = async () => {
    if (!interventionForm.title.trim()) {
      setInterventionError('Title is required')
      return
    }
    if (!interventionForm.domain) {
      setInterventionError('Please select a domain')
      return
    }

    setIsCreatingIntervention(true)
    setInterventionError(null)

    try {
      const result = await createIntervention({
        userId: assessment.subjectId,
        assessmentId: assessment.id,
        title: interventionForm.title,
        description: interventionForm.description,
        domain: interventionForm.domain,
        priority: interventionForm.priority,
        dueDate: interventionForm.dueDate || undefined,
        notes: interventionForm.notes,
      })

      if (result.success) {
        setInterventionSuccess(true)
        // Refetch interventions to update the list
        const updatedResult = await getAssessmentInterventions(assessment.id)
        if (updatedResult.success && updatedResult.data) {
          setInterventions(updatedResult.data.interventions)
        }
        setTimeout(() => {
          setShowInterventionDialog(false)
          setInterventionSuccess(false)
        }, 1500)
      } else {
        setInterventionError(result.error || 'Failed to create intervention')
      }
    } catch (err) {
      setInterventionError('Failed to create intervention')
    } finally {
      setIsCreatingIntervention(false)
    }
  }

  // Generate and open the clinical PDF report.
  const handlePrint = async () => {
    const { printAssessmentPDF } = await import('@/lib/print/assessment-pdf')
    await printAssessmentPDF({ assessment, reportResult, domains })
  }
  // Filter out domains that weren't actually assessed (no answers or empty answers)
  const allDomains = assessment.domains || []
  const domains = allDomains.filter(d => {
    // Check if domain has actual answers with numeric values (0, 1, or 2 are valid)
    const answers = d.answers as Record<string, unknown> | undefined
    if (answers && typeof answers === 'object') {
      // Check if any answer has an actual numeric value (including 0)
      const hasActualAnswers = Object.values(answers).some(
        val => typeof val === 'number'
      )
      if (hasActualAnswers) {
        return true
      }
    }
    return false
  })

  const domainCounts = {
    healthy: domains.filter(d => d.riskLevel === 'healthy').length,
    at_risk: domains.filter(d => d.riskLevel === 'at_risk').length,
    intervention: domains.filter(d => d.riskLevel === 'intervention').length,
  }

  return (
    <div className="space-y-4" ref={printRef}>
      {/* Action Buttons */}
      {!compact && (
        <div className="flex flex-col gap-3">
          {/* Intervention Status Banner */}
          {(assessment.overallRisk === 'intervention' || interventionDomains.length > 0) && (
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              allInterventionsCompleted
                ? 'bg-moss-50 border-moss-200'
                : hasInterventions
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-coral-50 border-coral-200'
            }`}>
              <div className="flex items-center gap-2">
                {isLoadingInterventions ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : allInterventionsCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-moss-600" />
                    <span className="text-sm font-medium text-moss-700">
                      All Interventions Completed ({completedInterventions.length})
                    </span>
                  </>
                ) : hasInterventions ? (
                  <>
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {pendingInterventions.length} Intervention{pendingInterventions.length !== 1 ? 's' : ''} Pending
                      {completedInterventions.length > 0 && ` · ${completedInterventions.length} Completed`}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-coral-600" />
                    <span className="text-sm font-medium text-coral-700">
                      Intervention Required - No interventions created yet
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View Interventions Button - show when there are interventions */}
                {hasInterventions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowViewInterventionsDialog(true)}
                    className="text-xs"
                  >
                    <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                    View ({interventions.length})
                  </Button>
                )}

                {/* Add Intervention Button - hide when all completed */}
                {!allInterventionsCompleted && (
                  <Button
                    variant={hasInterventions ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => handleAddIntervention(interventionDomains[0])}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Intervention
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Print Button Row */}
          {showPrintButton && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print Summary
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Overview Cards */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
        {/* Subject Info - only show if showSubject is true */}
        {showSubject && (
          <Card className="border shadow-soft">
            <CardContent className={compact ? 'p-3' : 'p-4'}>
              <div className="flex items-center gap-3">
                <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-primary/10 flex items-center justify-center`}>
                  <User className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-primary`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Elderly</p>
                  <p className={`font-semibold ${compact ? 'text-sm' : ''}`}>{assessment.subject?.name || '-'}</p>
                  {assessment.subject?.vayoId && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {assessment.subject.vayoId}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date */}
        <Card className="border shadow-soft">
          <CardContent className={compact ? 'p-3' : 'p-4'}>
            <div className="flex items-center gap-3">
              <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-blue-100 flex items-center justify-center`}>
                <Calendar className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assessment Date</p>
                <p className={`font-semibold ${compact ? 'text-sm' : ''}`}>
                  {formatDate(assessment.assessedAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(assessment.assessedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessor */}
        <Card className="border shadow-soft">
          <CardContent className={compact ? 'p-3' : 'p-4'}>
            <div className="flex items-center gap-3">
              <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-purple-100 flex items-center justify-center`}>
                <UserCircle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-purple-600`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assessor</p>
                <p className={`font-semibold ${compact ? 'text-sm' : ''}`}>{assessment.assessor?.name || '-'}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {assessment.assessor?.role || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card className={`border-2 shadow-soft ${getBorderColor(assessment.overallRisk)}`}>
          <CardContent className={compact ? 'p-3' : 'p-4'}>
            <div className="flex items-center gap-3">
              <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full ${overallDisplay.bgColor} flex items-center justify-center`}>
                {assessment.overallRisk === 'healthy' && <CheckCircle2 className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${overallDisplay.color}`} />}
                {assessment.overallRisk === 'at_risk' && <AlertCircle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${overallDisplay.color}`} />}
                {assessment.overallRisk === 'intervention' && <AlertTriangle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${overallDisplay.color}`} />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall Risk</p>
                <p className={`font-bold ${compact ? 'text-base' : 'text-lg'} ${overallDisplay.color}`}>{overallDisplay.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ICOPE Report: Patient Summary / Recommended Scales / Risk Flags / Actions */}
      {reportResult && (
        <AssessmentReport
          result={reportResult}
          subjectName={assessment.subject?.name}
          initialScaleResults={assessment.scaleResults as Record<string, import('./assessment-report').SavedScaleEntry> | undefined}
          editable={false}
        />
      )}

      {/* Domain Summary */}
      <Card className="border shadow-soft">
        <CardHeader className={compact ? 'pb-2 pt-3 px-3' : 'pb-2'}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className={compact ? 'text-base' : 'text-lg'}>Domain Assessment Results</CardTitle>
              <CardDescription className="text-xs">
                {domains.length} domains assessed (ICOPE screening)
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-moss-500" />
                <span className="text-xs">{domainCounts.healthy} Healthy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-smoked-500" />
                <span className="text-xs">{domainCounts.at_risk} At Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-coral-500" />
                <span className="text-xs">{domainCounts.intervention} Intervention</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={compact ? 'px-3 pb-3' : ''}>
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className={`grid w-full max-w-xs grid-cols-2 ${compact ? 'h-8' : ''}`}>
              <TabsTrigger value="grid" className={compact ? 'text-xs py-1' : ''}>Grid</TabsTrigger>
              <TabsTrigger value="detailed" className={compact ? 'text-xs py-1' : ''}>Detailed</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="mt-3">
              {domains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No domain assessments recorded yet.</p>
                  <p className="text-sm mt-1">Domain data will appear here once the assessment is completed.</p>
                </div>
              ) : (
                <div className={`grid gap-3 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                  {domains.map((domain) => (
                    <DomainCard key={domain.id} domain={domain} compact={compact} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="detailed" className="mt-3">
              {domains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No domain assessments recorded yet.</p>
                  <p className="text-sm mt-1">Domain data will appear here once the assessment is completed.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <DomainDetailRow key={domain.id} domain={domain} compact={compact} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notes */}
      {assessment.notes && (
        <Card className="border shadow-soft">
          <CardHeader className={compact ? 'pb-2 pt-3 px-3' : 'pb-2'}>
            <CardTitle className={`${compact ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
              <FileText className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              Assessment Notes
            </CardTitle>
          </CardHeader>
          <CardContent className={compact ? 'px-3 pb-3' : ''}>
            <p className={`text-muted-foreground whitespace-pre-wrap ${compact ? 'text-sm' : ''}`}>
              {assessment.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Intervention Dialog */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Add Intervention
            </DialogTitle>
            <DialogDescription>
              Create an intervention for {assessment.subject?.name || 'this elderly person'} based on the assessment results.
            </DialogDescription>
          </DialogHeader>

          {interventionSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-lg font-medium text-green-700">Intervention Created!</p>
            </div>
          ) : (
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="intervention-title">Title *</Label>
                <Input
                  id="intervention-title"
                  value={interventionForm.title}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Cognitive assessment follow-up"
                />
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label>Domain *</Label>
                <Select
                  value={interventionForm.domain}
                  onValueChange={(value) => setInterventionForm(prev => ({ ...prev, domain: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {interventionDomains.length > 0 ? (
                      interventionDomains.map(d => (
                        <SelectItem key={d.domain} value={d.domain}>
                          {getDomainName(d.domain)} (Intervention Required)
                        </SelectItem>
                      ))
                    ) : (
                      Object.entries(DOMAIN_NAMES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={interventionForm.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                    setInterventionForm(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="intervention-due">Due Date</Label>
                <Input
                  id="intervention-due"
                  type="date"
                  value={interventionForm.dueDate}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="intervention-desc">Description</Label>
                <Textarea
                  id="intervention-desc"
                  value={interventionForm.description}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the intervention needed..."
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="intervention-notes">Notes</Label>
                <Textarea
                  id="intervention-notes"
                  value={interventionForm.notes}
                  onChange={(e) => setInterventionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              {/* Error */}
              {interventionError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {interventionError}
                </div>
              )}
            </div>
          )}

          {!interventionSuccess && (
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowInterventionDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateIntervention}
                disabled={isCreatingIntervention}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCreatingIntervention ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Intervention
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* View Interventions Dialog */}
      <Dialog open={showViewInterventionsDialog} onOpenChange={setShowViewInterventionsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Interventions for {assessment.subject?.name || 'Assessment'}
            </DialogTitle>
            <DialogDescription>
              {interventions.length} intervention{interventions.length !== 1 ? 's' : ''} linked to this assessment
              {allInterventionsCompleted && (
                <Badge variant="outline" className="ml-2 bg-moss-100 text-moss-700 border-moss-200">
                  All Completed
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            <div className="space-y-3 py-2">
              {interventions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No interventions found</p>
                </div>
              ) : (
                interventions.map((intervention) => {
                  const statusColors = STATUS_COLORS[intervention.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending
                  const priorityColors = PRIORITY_COLORS[intervention.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium

                  return (
                    <div
                      key={intervention.id}
                      className={`p-4 rounded-lg border ${
                        intervention.status === 'completed'
                          ? 'bg-moss-50/50 border-moss-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h4 className="font-semibold text-sm">{intervention.title}</h4>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                            >
                              {intervention.status === 'in_progress' ? 'In Progress' :
                               intervention.status.charAt(0).toUpperCase() + intervention.status.slice(1)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}
                            >
                              {intervention.priority.charAt(0).toUpperCase() + intervention.priority.slice(1)}
                            </Badge>
                          </div>

                          {intervention.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {intervention.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {DOMAIN_NAMES[intervention.domain] || intervention.domain}
                            </span>
                            {intervention.createdAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Created: {formatDate(intervention.createdAt)}
                              </span>
                            )}
                            {intervention.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {formatDate(intervention.dueDate)}
                              </span>
                            )}
                            {intervention.completedAt && (
                              <span className="flex items-center gap-1 text-moss-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed: {formatDate(intervention.completedAt)}
                              </span>
                            )}
                          </div>

                          {intervention.notes && (
                            <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                              <span className="font-medium">Notes:</span> {intervention.notes}
                            </div>
                          )}
                        </div>

                        {intervention.status === 'completed' && (
                          <CheckCircle2 className="w-5 h-5 text-moss-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowViewInterventionsDialog(false)
                router.push('/dashboard/interventions')
              }}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              View All Interventions
            </Button>
            <Button variant="outline" onClick={() => setShowViewInterventionsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DomainCardProps {
  domain: AssessmentDomain
  compact?: boolean
}

function DomainCard({ domain, compact = false }: DomainCardProps) {
  const display = getRiskLevelDisplay(domain.riskLevel)
  const Icon = getDomainIcon(domain.domain)

  return (
    <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg border ${display.bgColor} ${getBorderColorLight(domain.riskLevel)}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg ${getIconBgColor(domain.riskLevel)} flex items-center justify-center shrink-0`}>
          <Icon className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${display.color}`} />
        </div>
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium leading-tight`}>{getDomainName(domain.domain)}</span>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`${display.bgColor} ${display.color} ${compact ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
          {display.label}
        </Badge>
        {domain.score !== undefined && (
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
            {domain.score}
          </span>
        )}
      </div>
    </div>
  )
}

interface DomainDetailRowProps {
  domain: AssessmentDomain
  compact?: boolean
}

// Tailwind progress-bar classes per risk level. Track gets a tinted
// background, indicator (immediate child) gets the solid risk colour.
const RISK_PROGRESS_CLASSES: Record<RiskLevel, string> = {
  healthy: 'bg-healthy/20 [&>*]:bg-healthy',
  at_risk: 'bg-at-risk/20 [&>*]:bg-at-risk',
  intervention: 'bg-intervention/20 [&>*]:bg-intervention',
}

function DomainDetailRow({ domain, compact = false }: DomainDetailRowProps) {
  const display = getRiskLevelDisplay(domain.riskLevel)
  const Icon = getDomainIcon(domain.domain)
  const maxScore = getMaxScore(domain.domain)
  const percentage = domain.score !== undefined ? ((maxScore - domain.score) / maxScore) * 100 : 0

  return (
    <div className={`${compact ? 'p-2' : 'p-3'} rounded-lg border ${getBorderColorLight(domain.riskLevel)} bg-background`}>
      <div className="flex items-start gap-3">
        <div className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg ${display.bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`${compact ? 'w-4 h-4' : 'w-4.5 h-4.5'} ${display.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className={`font-semibold ${compact ? 'text-sm' : ''}`}>{getDomainName(domain.domain)}</h3>
            <Badge variant="outline" className={`${display.bgColor} ${display.color} ${compact ? 'text-xs' : ''}`}>
              {display.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress
                value={percentage}
                className={`${compact ? 'h-1.5' : 'h-2'} ${RISK_PROGRESS_CLASSES[domain.riskLevel]}`}
              />
            </div>
            <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground w-12 text-right`}>
              {domain.score ?? '-'}/{maxScore}
            </span>
          </div>
          {domain.notes && (
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1.5`}>{domain.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getBorderColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'border-moss-300'
    case 'at_risk': return 'border-smoked-300'
    case 'intervention': return 'border-coral-300'
  }
}

function getBorderColorLight(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'border-moss-200'
    case 'at_risk': return 'border-smoked-200'
    case 'intervention': return 'border-coral-200'
  }
}

function getIconBgColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'bg-moss-200'
    case 'at_risk': return 'bg-smoked-200'
    case 'intervention': return 'bg-coral-200'
  }
}

function getDomainIcon(domain: string) {
  const icons: Record<string, typeof Activity> = {
    cognitive: Brain,
    psychological: Heart,
    locomotor: Footprints,
    sensory: EyeIcon,
    vitality: Utensils,
    social: Users,
  }
  return icons[domain] || Activity
}

function getDomainName(domain: string): string {
  const names: Record<string, string> = {
    cognitive: 'Cognitive',
    psychological: 'Psychological',
    locomotor: 'Locomotor',
    sensory: 'Sensory',
    vitality: 'Vitality',
    social: 'Social',
  }
  return names[domain] || domain
}

function getMaxScore(domain: string): number {
  const questionCounts: Record<string, number> = {
    cognitive: 4,
    psychological: 5,
    locomotor: 3,
    sensory: 3,
    vitality: 3,
    social: 4,
  }
  return (questionCounts[domain] || 1) * 2
}
