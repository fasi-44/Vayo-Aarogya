'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Brain,
  Heart,
  Footprints,
  Eye,
  Ear,
  AlertTriangle,
  Moon,
  Utensils,
  Scale,
  Droplets,
  Users,
  UserX,
  Home,
  Bath,
  Pill,
  HeartPulse,
  Wine,
  Hospital,
  Smile,
  Activity,
} from 'lucide-react'
import type { RiskLevel } from '@/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DomainScore {
  domain: string
  domainName: string
  score: number
  maxScore: number
  riskLevel: RiskLevel
  flagTriggered?: boolean
}

interface DomainIndicatorsProps {
  domainScores: DomainScore[]
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  layout?: 'grid' | 'inline'
}

const domainIcons: Record<string, React.ElementType> = {
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
  loneliness: UserX,
  iadl: Home,
  adl: Bath,
  diabetes: Pill,
  hypertension: HeartPulse,
  substance: Wine,
  healthcare: Hospital,
  oral: Smile,
  pain: Activity,
}

const riskColors = {
  healthy: {
    bg: 'bg-moss-100',
    border: 'border-moss-300',
    text: 'text-moss-700',
    icon: 'text-moss-600',
    ring: 'ring-moss-400',
  },
  at_risk: {
    bg: 'bg-smoked-100',
    border: 'border-smoked-300',
    text: 'text-smoked-700',
    icon: 'text-smoked-600',
    ring: 'ring-smoked-400',
  },
  intervention: {
    bg: 'bg-coral-100',
    border: 'border-coral-300',
    text: 'text-coral-700',
    icon: 'text-coral-600',
    ring: 'ring-coral-400',
  },
}

const sizeClasses = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    label: 'text-xs',
  },
  md: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    label: 'text-sm',
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    label: 'text-base',
  },
}

export function DomainIndicators({
  domainScores,
  showLabels = false,
  size = 'md',
  layout = 'grid',
}: DomainIndicatorsProps) {
  const sizeClass = sizeClasses[size]

  return (
    <TooltipProvider>
      <div
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-5 md:grid-cols-10 gap-2'
            : 'flex flex-wrap gap-2'
        )}
      >
        {domainScores.map((domain) => {
          const Icon = domainIcons[domain.domain] || Activity
          const colors = riskColors[domain.riskLevel]

          return (
            <Tooltip key={domain.domain}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-110',
                    showLabels && 'p-2'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-full flex items-center justify-center border-2 transition-all',
                      sizeClass.container,
                      colors.bg,
                      colors.border,
                      domain.flagTriggered && 'ring-2 ring-offset-1',
                      domain.flagTriggered && colors.ring
                    )}
                  >
                    <Icon className={cn(sizeClass.icon, colors.icon)} />
                  </div>
                  {showLabels && (
                    <span className={cn(sizeClass.label, 'text-center text-muted-foreground truncate max-w-[60px]')}>
                      {domain.domainName.split(' ')[0]}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="space-y-1">
                  <p className="font-semibold">{domain.domainName}</p>
                  <p className="text-sm">
                    Score: {domain.score}/{domain.maxScore}
                  </p>
                  <p className={cn('text-sm font-medium', colors.text)}>
                    {domain.riskLevel === 'healthy' && 'Healthy'}
                    {domain.riskLevel === 'at_risk' && 'At Risk'}
                    {domain.riskLevel === 'intervention' && 'Needs Intervention'}
                  </p>
                  {domain.flagTriggered && (
                    <p className="text-xs text-red-600 font-medium">
                      Flagged for attention
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export function DomainIndicatorLegend() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-moss-500" />
        <span className="text-muted-foreground">Healthy</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-smoked-500" />
        <span className="text-muted-foreground">At Risk</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-coral-500" />
        <span className="text-muted-foreground">Intervention</span>
      </div>
    </div>
  )
}

interface DomainSummaryGridProps {
  domainScores: DomainScore[]
}

export function DomainSummaryGrid({ domainScores }: DomainSummaryGridProps) {
  const healthyCount = domainScores.filter(d => d.riskLevel === 'healthy').length
  const atRiskCount = domainScores.filter(d => d.riskLevel === 'at_risk').length
  const interventionCount = domainScores.filter(d => d.riskLevel === 'intervention').length

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-moss-50 border border-moss-200 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-moss-700">{healthyCount}</p>
        <p className="text-sm text-moss-600">Healthy</p>
      </div>
      <div className="bg-smoked-50 border border-smoked-200 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-smoked-700">{atRiskCount}</p>
        <p className="text-sm text-smoked-600">At Risk</p>
      </div>
      <div className="bg-coral-50 border border-coral-200 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-coral-700">{interventionCount}</p>
        <p className="text-sm text-coral-600">Intervention</p>
      </div>
    </div>
  )
}
