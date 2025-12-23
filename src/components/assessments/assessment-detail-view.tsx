'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Droplets,
  Users,
  Home,
  Hospital,
} from 'lucide-react'
import { type Assessment, type AssessmentDomain, type RiskLevel } from '@/types'
import { getRiskLevelDisplay } from '@/lib/assessment-scoring'

interface AssessmentDetailViewProps {
  assessment: Assessment
  compact?: boolean // For use inside accordions - hides some elements
  showSubject?: boolean // Whether to show subject info card
}

export function AssessmentDetailView({
  assessment,
  compact = false,
  showSubject = true,
}: AssessmentDetailViewProps) {
  const overallDisplay = getRiskLevelDisplay(assessment.overallRisk)
  const domains = assessment.domains || []

  const domainCounts = {
    healthy: domains.filter(d => d.riskLevel === 'healthy').length,
    at_risk: domains.filter(d => d.riskLevel === 'at_risk').length,
    intervention: domains.filter(d => d.riskLevel === 'intervention').length,
  }

  return (
    <div className="space-y-4">
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
                  {new Date(assessment.assessedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(assessment.assessedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
              <div className={`grid gap-2 ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'}`}>
                {domains.map((domain) => (
                  <DomainCard key={domain.id} domain={domain} compact={compact} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="mt-3">
              <div className="space-y-2">
                {domains.map((domain) => (
                  <DomainDetailRow key={domain.id} domain={domain} compact={compact} />
                ))}
              </div>
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
        <div className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-lg ${getIconBgColor(domain.riskLevel)} flex items-center justify-center`}>
          <Icon className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${display.color}`} />
        </div>
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium truncate`}>{getDomainName(domain.domain)}</span>
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
    mobility: Footprints,
    vision: Eye,
    hearing: Ear,
    vitality: Utensils,
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
    mobility: 'Walking & Falls',
    vision: 'Vision',
    hearing: 'Hearing',
    vitality: 'Appetite & Weight',
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
    mobility: 2,
    vision: 1,
    hearing: 1,
    vitality: 2,
    sleep: 1,
    continence: 1,
    adl: 1,
    iadl: 1,
    social: 2,
    healthcare: 1,
  }
  return (questionCounts[domain] || 1) * 2
}
