'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  Eye,
  Ear,
  Footprints,
  Moon,
  Utensils,
  Scale,
  Droplets,
  Users,
  Home,
  Pill,
  Stethoscope,
  Cigarette,
  Hospital,
  Smile,
  Zap,
} from 'lucide-react'
import { type Assessment, type AssessmentDomain, type RiskLevel } from '@/types'
import { getRiskLevelDisplay } from '@/lib/assessment-scoring'

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

  const overallDisplay = getRiskLevelDisplay(assessment.overallRisk)
  const domains = assessment.domains || []

  // Calculate stats
  const domainCounts = {
    healthy: domains.filter(d => d.riskLevel === 'healthy').length,
    at_risk: domains.filter(d => d.riskLevel === 'at_risk').length,
    intervention: domains.filter(d => d.riskLevel === 'intervention').length,
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Assessment Details
          </DialogTitle>
          <DialogDescription>
            Assessment conducted on {new Date(assessment.assessedAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Info */}
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Elderly</p>
                    <p className="font-medium">{assessment.subject?.name || '-'}</p>
                    {assessment.subject?.vayoId && (
                      <p className="text-xs text-muted-foreground">{assessment.subject.vayoId}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessor Info */}
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assessor</p>
                    <p className="font-medium">{assessment.assessor?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {assessment.assessor?.role || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Level */}
            <Card className={`border-2 ${getBorderColor(assessment.overallRisk)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${overallDisplay.bgColor} flex items-center justify-center`}>
                    {assessment.overallRisk === 'healthy' && <CheckCircle2 className={`w-5 h-5 ${overallDisplay.color}`} />}
                    {assessment.overallRisk === 'at_risk' && <AlertCircle className={`w-5 h-5 ${overallDisplay.color}`} />}
                    {assessment.overallRisk === 'intervention' && <AlertTriangle className={`w-5 h-5 ${overallDisplay.color}`} />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Risk</p>
                    <p className={`font-semibold ${overallDisplay.color}`}>{overallDisplay.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Summary */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Domain Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">{domainCounts.healthy} Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">{domainCounts.at_risk} At Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">{domainCounts.intervention} Intervention</span>
                </div>
              </div>

              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {domains.map((domain) => (
                      <DomainCard key={domain.id} domain={domain} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                  <div className="space-y-2">
                    {domains.map((domain) => (
                      <DomainListItem key={domain.id} domain={domain} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Notes */}
          {assessment.notes && (
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assessment.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DomainCardProps {
  domain: AssessmentDomain
}

function DomainCard({ domain }: DomainCardProps) {
  const display = getRiskLevelDisplay(domain.riskLevel)
  const Icon = getDomainIcon(domain.domain)

  return (
    <div className={`p-3 rounded-lg border ${display.bgColor} ${getBorderColorLight(domain.riskLevel)}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${display.color}`} />
        <span className="text-sm font-medium truncate">{getDomainName(domain.domain)}</span>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`${display.bgColor} ${display.color} text-xs`}>
          {display.label}
        </Badge>
        {domain.score !== undefined && (
          <span className="text-xs text-muted-foreground">
            {domain.score}
          </span>
        )}
      </div>
    </div>
  )
}

interface DomainListItemProps {
  domain: AssessmentDomain
}

function DomainListItem({ domain }: DomainListItemProps) {
  const display = getRiskLevelDisplay(domain.riskLevel)
  const Icon = getDomainIcon(domain.domain)
  const maxScore = getMaxScore(domain.domain)
  const percentage = domain.score !== undefined ? ((maxScore - domain.score) / maxScore) * 100 : 0

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
      <div className={`w-8 h-8 rounded-lg ${display.bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${display.color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm">{getDomainName(domain.domain)}</span>
          <Badge variant="outline" className={`${display.bgColor} ${display.color} text-xs`}>
            {display.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={percentage} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground w-12 text-right">
            {domain.score ?? '-'}/{maxScore}
          </span>
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

function getDomainIcon(domain: string) {
  const icons: Record<string, typeof Activity> = {
    cognition: Brain,
    depression: Heart,
    mobility: Footprints,
    vision: Eye,
    hearing: Ear,
    falls: AlertTriangle,
    sleep: Moon,
    nutrition: Utensils,
    weight: Scale,
    incontinence: Droplets,
    social: Users,
    loneliness: Home,
    iadl: Home,
    adl: Activity,
    diabetes: Pill,
    hypertension: Stethoscope,
    substance: Cigarette,
    healthcare: Hospital,
    oral: Smile,
    pain: Zap,
  }
  return icons[domain] || Activity
}

function getDomainName(domain: string): string {
  const names: Record<string, string> = {
    cognition: 'Cognition',
    depression: 'Depression',
    mobility: 'Mobility',
    vision: 'Vision',
    hearing: 'Hearing',
    falls: 'Falls Risk',
    sleep: 'Sleep',
    nutrition: 'Nutrition',
    weight: 'Weight',
    incontinence: 'Incontinence',
    social: 'Social',
    loneliness: 'Loneliness',
    iadl: 'IADL',
    adl: 'ADL',
    diabetes: 'Diabetes',
    hypertension: 'Hypertension',
    substance: 'Substance',
    healthcare: 'Healthcare',
    oral: 'Oral Health',
    pain: 'Pain',
  }
  return names[domain] || domain
}

function getMaxScore(domain: string): number {
  const questionCounts: Record<string, number> = {
    cognition: 3,
    depression: 3,
    mobility: 3,
    vision: 2,
    hearing: 2,
    falls: 3,
    sleep: 2,
    nutrition: 3,
    weight: 2,
    incontinence: 2,
    social: 2,
    loneliness: 2,
    iadl: 5,
    adl: 4,
    diabetes: 3,
    hypertension: 3,
    substance: 2,
    healthcare: 3,
    oral: 2,
    pain: 2,
  }
  return (questionCounts[domain] || 2) * 2
}
