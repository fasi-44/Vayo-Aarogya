'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
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
import { type AssessmentResult, type DomainScore, type RiskLevel, getRiskLevelDisplay } from '@/lib/assessment-scoring'

interface AssessmentSummaryProps {
  result: AssessmentResult
  elderlyName?: string
  assessorName?: string
  assessedAt?: string
}

export function AssessmentSummary({
  result,
  elderlyName,
  assessorName,
  assessedAt,
}: AssessmentSummaryProps) {
  const overallDisplay = getRiskLevelDisplay(result.overallRisk)
  const scorePercentage = (result.totalScore / result.maxTotalScore) * 100

  return (
    <div className="space-y-6">
      {/* Overall Risk Card */}
      <Card className={`border-2 ${getBorderColor(result.overallRisk)}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Assessment Result</CardTitle>
              {elderlyName && (
                <CardDescription className="mt-1">
                  Assessment for {elderlyName}
                  {assessedAt && ` on ${new Date(assessedAt).toLocaleDateString()}`}
                </CardDescription>
              )}
            </div>
            <Badge className={`${overallDisplay.bgColor} ${overallDisplay.color} text-base px-4 py-2`}>
              {overallDisplay.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{result.totalScore}</span>
                <span className="text-muted-foreground">/ {result.maxTotalScore}</span>
              </div>
              <Progress value={100 - scorePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Lower score indicates better health
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Domains Assessed</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{result.domainScores.length}</span>
                <span className="text-muted-foreground">domains</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {result.domainScores.filter(d => d.riskLevel === 'healthy').length} Healthy
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {result.domainScores.filter(d => d.riskLevel === 'at_risk').length} At Risk
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {result.domainScores.filter(d => d.riskLevel === 'intervention').length} Intervention
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Flagged for Action</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{result.flaggedDomains.length}</span>
                <span className="text-muted-foreground">domains</span>
              </div>
              {result.flaggedDomains.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.flaggedDomains.map(domain => (
                    <Badge key={domain} variant="destructive" className="text-xs">
                      {domain}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1 ${getRecommendationColor(rec)}`}>
                    {getRecommendationIcon(rec)}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Domain Scores Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Domain-wise Scores</CardTitle>
          <CardDescription>Detailed breakdown by health domain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {result.domainScores.map((domain) => (
              <DomainScoreCard key={domain.domain} domainScore={domain} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface DomainScoreCardProps {
  domainScore: DomainScore
}

function DomainScoreCard({ domainScore }: DomainScoreCardProps) {
  const display = getRiskLevelDisplay(domainScore.riskLevel)
  const Icon = getDomainIcon(domainScore.domain)
  const percentage = (domainScore.score / domainScore.maxScore) * 100

  return (
    <div className={`p-4 rounded-lg border ${display.bgColor} ${getBorderColorLight(domainScore.riskLevel)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconBgColor(domainScore.riskLevel)}`}>
            <Icon className={`w-4 h-4 ${display.color}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{domainScore.domainName}</p>
            <p className={`text-xs ${display.color}`}>{display.label}</p>
          </div>
        </div>
        {domainScore.flagTriggered && (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Score</span>
          <span>{domainScore.score}/{domainScore.maxScore}</span>
        </div>
        <Progress value={100 - percentage} className="h-1.5" />
      </div>
      {domainScore.triggerAction && (
        <p className="text-xs text-red-600 mt-2 line-clamp-2">{domainScore.triggerAction}</p>
      )}
    </div>
  )
}

function getBorderColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy':
      return 'border-green-300'
    case 'at_risk':
      return 'border-yellow-300'
    case 'intervention':
      return 'border-red-300'
  }
}

function getBorderColorLight(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy':
      return 'border-green-200'
    case 'at_risk':
      return 'border-yellow-200'
    case 'intervention':
      return 'border-red-200'
  }
}

function getIconBgColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'healthy':
      return 'bg-green-200'
    case 'at_risk':
      return 'bg-yellow-200'
    case 'intervention':
      return 'bg-red-200'
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

function getRecommendationIcon(rec: string) {
  if (rec.includes('URGENT') || rec.includes('Immediate')) {
    return <AlertTriangle className="w-4 h-4" />
  }
  if (rec.includes('Schedule') || rec.includes('follow-up')) {
    return <AlertCircle className="w-4 h-4" />
  }
  return <CheckCircle2 className="w-4 h-4" />
}

function getRecommendationColor(rec: string): string {
  if (rec.includes('URGENT') || rec.includes('Immediate')) {
    return 'text-red-500'
  }
  if (rec.includes('Schedule') || rec.includes('follow-up')) {
    return 'text-yellow-600'
  }
  return 'text-green-600'
}

// Comparison component for showing changes between assessments
interface AssessmentComparisonProps {
  previous: DomainScore[]
  current: DomainScore[]
}

export function AssessmentComparison({ previous, current }: AssessmentComparisonProps) {
  const previousMap = new Map(previous.map(d => [d.domain, d]))
  const currentMap = new Map(current.map(d => [d.domain, d]))

  const allDomains = new Set([...Array.from(previousMap.keys()), ...Array.from(currentMap.keys())])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Progress Comparison</CardTitle>
        <CardDescription>Changes since last assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from(allDomains).map(domain => {
            const prev = previousMap.get(domain)
            const curr = currentMap.get(domain)

            if (!curr) return null

            const change = prev ? prev.score - curr.score : 0
            const trend = change > 0 ? 'improved' : change < 0 ? 'declined' : 'same'

            return (
              <div key={domain} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {React.createElement(getDomainIcon(domain), { className: "w-4 h-4 text-primary" })}
                  </div>
                  <span className="font-medium">{curr.domainName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm">
                      {prev ? (
                        <>
                          <span className="text-muted-foreground">{prev.score}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{curr.score}</span>
                        </>
                      ) : (
                        <span className="font-medium">{curr.score}</span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
                    {trend === 'improved' && <TrendingDown className="w-4 h-4" />}
                    {trend === 'declined' && <TrendingUp className="w-4 h-4" />}
                    {trend === 'same' && <Minus className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                      {trend === 'improved' && `+${Math.abs(change)} better`}
                      {trend === 'declined' && `${Math.abs(change)} worse`}
                      {trend === 'same' && 'No change'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function getTrendColor(trend: 'improved' | 'declined' | 'same'): string {
  switch (trend) {
    case 'improved':
      return 'text-green-600'
    case 'declined':
      return 'text-red-600'
    case 'same':
      return 'text-gray-500'
  }
}

// Need to import React for createElement
import React from 'react'
