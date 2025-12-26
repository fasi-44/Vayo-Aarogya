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
  Ear,
  Footprints,
  Moon,
  Utensils,
  Droplets,
  Users,
  Home,
  Hospital,
  Printer,
  Plus,
  Loader2,
  ClipboardList,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Assessment, type AssessmentDomain, type RiskLevel, type Intervention } from '@/types'
import { getRiskLevelDisplay } from '@/lib/assessment-scoring'
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

  // Generate print HTML content
  const generatePrintHTML = () => {
    const riskColorMap: Record<string, string> = {
      healthy: '#22c55e',
      at_risk: '#eab308',
      intervention: '#ef4444',
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Assessment Summary - ${assessment.subject?.name || 'Unknown'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 24px;
              color: #1a1a1a;
              font-size: 14px;
              line-height: 1.5;
              background: #fff;
            }
            .header { text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
            .header h1 { font-size: 24px; color: #111827; margin-bottom: 6px; font-weight: 700; }
            .header p { color: #6b7280; font-size: 14px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
            .info-card { padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; }
            .info-card label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; display: block; font-weight: 500; }
            .info-card .value { font-size: 15px; font-weight: 600; margin-top: 6px; color: #111827; }
            .info-card .sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
            .risk-card { border-left: 5px solid ${riskColorMap[assessment.overallRisk]}; }
            .risk-value { color: ${riskColorMap[assessment.overallRisk]} !important; font-size: 16px !important; }
            .domains-section { margin-top: 28px; }
            .domains-section h2 { font-size: 17px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827; }
            .domain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .domain-item { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .domain-item.healthy { background: #ecfdf5; border-color: #6ee7b7; }
            .domain-item.at_risk { background: #fffbeb; border-color: #fcd34d; }
            .domain-item.intervention { background: #fef2f2; border-color: #fca5a5; }
            .domain-name { font-weight: 600; font-size: 13px; margin-bottom: 5px; color: #111827; }
            .domain-status { font-size: 12px; color: #374151; font-weight: 500; }
            .domain-score { font-size: 11px; color: #6b7280; margin-top: 3px; }
            .notes-section { margin-top: 28px; padding: 18px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; }
            .notes-section h3 { font-size: 15px; margin-bottom: 10px; font-weight: 600; color: #111827; }
            .notes-section p { font-size: 13px; color: #4b5563; white-space: pre-wrap; line-height: 1.6; }
            .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }

            /* Print-specific styles */
            @media print {
              body { padding: 12px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              .info-card { break-inside: avoid; }
              .domain-item { break-inside: avoid; }
              .domain-item.healthy { background-color: #ecfdf5 !important; -webkit-print-color-adjust: exact !important; }
              .domain-item.at_risk { background-color: #fffbeb !important; -webkit-print-color-adjust: exact !important; }
              .domain-item.intervention { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact !important; }
            }

            /* Responsive for iPad and mobile */
            @media (max-width: 768px) {
              body { padding: 16px; }
              .info-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
              .domain-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
            }
            @media (max-width: 480px) {
              .info-grid { grid-template-columns: 1fr; }
              .domain-grid { grid-template-columns: 1fr 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Assessment Summary</h1>
            <p>Vayo Aarogya - Healthy Ageing Assessment Report</p>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <label>Elderly Name</label>
              <div class="value">${assessment.subject?.name || '-'}</div>
              ${assessment.subject?.vayoId ? `<div class="sub">${assessment.subject.vayoId}</div>` : ''}
            </div>
            <div class="info-card">
              <label>Assessment Date</label>
              <div class="value">${formatDate(assessment.assessedAt)}</div>
              <div class="sub">${formatTime(assessment.assessedAt)}</div>
            </div>
            <div class="info-card">
              <label>Assessor</label>
              <div class="value">${assessment.assessor?.name || '-'}</div>
              <div class="sub" style="text-transform: capitalize;">${assessment.assessor?.role || ''}</div>
            </div>
            <div class="info-card risk-card">
              <label>Overall Risk Level</label>
              <div class="value risk-value">${overallDisplay.label}</div>
            </div>
          </div>

          <div class="domains-section">
            <h2>Domain Assessment Results (${domains.length} domains assessed)</h2>
            <div class="domain-grid">
              ${domains.map(d => {
                const display = getRiskLevelDisplay(d.riskLevel)
                return `
                  <div class="domain-item ${d.riskLevel}">
                    <div class="domain-name">${getDomainName(d.domain)}</div>
                    <div class="domain-status">${display.label}</div>
                    ${d.score !== undefined ? `<div class="domain-score">Score: ${d.score}</div>` : ''}
                  </div>
                `
              }).join('')}
            </div>
          </div>

          ${assessment.notes ? `
            <div class="notes-section">
              <h3>Assessment Notes</h3>
              <p>${assessment.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Vayo Aarogya Platform</p>
          </div>
        </body>
      </html>
    `
  }

  // Print functionality - works on iOS, iPadOS, macOS, Windows, Android
  const handlePrint = async () => {
    const htmlContent = generatePrintHTML()

    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isMac = /Macintosh/.test(navigator.userAgent)
    const isIPad = /iPad/.test(navigator.userAgent) || (isMac && navigator.maxTouchPoints > 1)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    // Method 1: Try using a new window (works best on desktop browsers including macOS Safari)
    if (!isIOS && !isIPad) {
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()

        // Wait for styles to load
        setTimeout(() => {
          printWindow.print()
          // Don't close immediately on macOS to allow print dialog
          if (!isMac) {
            setTimeout(() => printWindow.close(), 500)
          }
        }, 300)
        return
      }
    }

    // Method 2: Hidden iframe (works on iOS Safari, iPadOS, and as fallback)
    const printFrame = document.createElement('iframe')
    printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    document.body.appendChild(printFrame)

    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document
    if (!frameDoc) {
      document.body.removeChild(printFrame)
      // Method 3: Fallback - open as blob URL
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      return
    }

    frameDoc.open()
    frameDoc.write(htmlContent)
    frameDoc.close()

    // Wait for iframe to fully load
    const triggerPrint = () => {
      try {
        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()
      } catch (e) {
        console.error('Print failed:', e)
        // Last resort fallback
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      }

      // Cleanup after print dialog closes
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame)
        }
      }, 2000)
    }

    // iOS/iPadOS needs more time to render
    if (isIOS || isIPad) {
      setTimeout(triggerPrint, 500)
    } else {
      printFrame.onload = () => setTimeout(triggerPrint, 100)
    }
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
                ? 'bg-green-50 border-green-200'
                : hasInterventions
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {isLoadingInterventions ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : allInterventionsCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
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
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
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
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs">{domainCounts.healthy} Healthy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-xs">{domainCounts.at_risk} At Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
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
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
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
                          ? 'bg-green-50/50 border-green-200'
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
                              <span className="flex items-center gap-1 text-green-600">
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
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
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
              <Progress value={percentage} className={compact ? 'h-1.5' : 'h-2'} />
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
    case 'healthy': return 'border-green-300'
    case 'at_risk': return 'border-yellow-300'
    case 'intervention': return 'border-red-300'
  }
}

function getBorderColorLight(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'border-green-200'
    case 'at_risk': return 'border-yellow-200'
    case 'intervention': return 'border-red-200'
  }
}

function getIconBgColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy': return 'bg-green-200'
    case 'at_risk': return 'bg-yellow-200'
    case 'intervention': return 'bg-red-200'
  }
}

function getDomainIcon(domain: string) {
  const icons: Record<string, typeof Activity> = {
    cognition: Brain,
    mood: Heart,
    mental_health: Heart,
    mobility: Footprints,
    vision: EyeIcon,
    hearing: Ear,
    vitality: Utensils,
    nutrition: Utensils,
    sleep: Moon,
    continence: Droplets,
    adl: Activity,
    iadl: Home,
    social: Users,
    healthcare: Hospital,
  }
  return icons[domain] || Activity
}

function getDomainName(domain: string): string {
  const names: Record<string, string> = {
    cognition: 'Memory & Thinking',
    mood: 'Mood & Feelings',
    mental_health: 'Mental Health',
    mobility: 'Walking & Falls',
    vision: 'Vision',
    hearing: 'Hearing',
    vitality: 'Appetite & Weight',
    nutrition: 'Nutrition',
    sleep: 'Sleep',
    continence: 'Bladder & Bowel',
    adl: 'Self-Care (ADL)',
    iadl: 'Daily Tasks (IADL)',
    social: 'Social & Loneliness',
    healthcare: 'Healthcare Access',
  }
  return names[domain] || domain
}

function getMaxScore(domain: string): number {
  const questionCounts: Record<string, number> = {
    cognition: 1,
    mood: 1,
    mental_health: 1,
    mobility: 2,
    vision: 1,
    hearing: 1,
    vitality: 2,
    nutrition: 2,
    sleep: 1,
    continence: 1,
    adl: 1,
    iadl: 1,
    social: 2,
    healthcare: 1,
  }
  return (questionCounts[domain] || 1) * 2
}
