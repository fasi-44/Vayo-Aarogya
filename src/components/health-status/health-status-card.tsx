'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  Calendar,
  Phone,
} from 'lucide-react'
import type { RiskLevel } from '@/types'

interface HealthStatusCardProps {
  riskLevel: RiskLevel
  elderName?: string
  vayoId?: string
  lastAssessmentDate?: string
  recommendations?: string[]
  flaggedDomains?: string[]
  onScheduleFollowUp?: () => void
  onViewAssessment?: () => void
  onContact?: () => void
  compact?: boolean
}

const riskConfig = {
  healthy: {
    icon: CheckCircle2,
    title: 'Healthy',
    description: 'Continue current care plan',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    badgeBg: 'bg-green-100',
  },
  at_risk: {
    icon: AlertTriangle,
    title: 'At Risk',
    description: 'Schedule follow-up within 2 weeks',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600',
    badgeBg: 'bg-yellow-100',
  },
  intervention: {
    icon: AlertCircle,
    title: 'Needs Intervention',
    description: 'Immediate professional consultation required',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-100',
  },
}

export function HealthStatusCard({
  riskLevel,
  elderName,
  vayoId,
  lastAssessmentDate,
  recommendations = [],
  flaggedDomains = [],
  onScheduleFollowUp,
  onViewAssessment,
  onContact,
  compact = false,
}: HealthStatusCardProps) {
  const config = riskConfig[riskLevel]
  const Icon = config.icon

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          config.bgColor,
          config.borderColor
        )}
      >
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.badgeBg)}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', config.textColor)}>{config.title}</p>
          <p className="text-xs text-muted-foreground truncate">{config.description}</p>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('border-2', config.borderColor, config.bgColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', config.badgeBg)}>
              <Icon className={cn('w-6 h-6', config.iconColor)} />
            </div>
            <div>
              <CardTitle className={cn('text-lg', config.textColor)}>
                {config.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
            </div>
          </div>
          {elderName && (
            <div className="text-right">
              <p className="font-semibold text-foreground">{elderName}</p>
              {vayoId && (
                <Badge variant="outline" className="text-xs mt-1">
                  {vayoId}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {lastAssessmentDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last assessed: {lastAssessmentDate}</span>
          </div>
        )}

        {flaggedDomains.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Flagged Domains:</p>
            <div className="flex flex-wrap gap-2">
              {flaggedDomains.map((domain) => (
                <Badge
                  key={domain}
                  variant="outline"
                  className={cn('text-xs', config.badgeBg, config.textColor)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Recommendations:</p>
            <ul className="space-y-1">
              {recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
              {recommendations.length > 3 && (
                <li className="text-sm text-primary font-medium">
                  +{recommendations.length - 3} more recommendations
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {onViewAssessment && (
            <Button variant="outline" size="sm" onClick={onViewAssessment}>
              <ClipboardCheck className="w-4 h-4 mr-1" />
              View Assessment
            </Button>
          )}
          {onScheduleFollowUp && (
            <Button variant="outline" size="sm" onClick={onScheduleFollowUp}>
              <Calendar className="w-4 h-4 mr-1" />
              Schedule Follow-up
            </Button>
          )}
          {onContact && riskLevel === 'intervention' && (
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={onContact}>
              <Phone className="w-4 h-4 mr-1" />
              Contact Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function HealthStatusBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const config = riskConfig[riskLevel]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1',
        config.badgeBg,
        config.textColor,
        config.borderColor
      )}
    >
      <Icon className="w-3 h-3" />
      {config.title}
    </Badge>
  )
}
