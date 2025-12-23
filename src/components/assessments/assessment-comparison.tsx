'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
  User,
} from 'lucide-react'
import type { Assessment, RiskLevel } from '@/types'
import { DomainComparison } from '@/services/assessments'

interface AssessmentComparisonProps {
  previous: Assessment
  current: Assessment
  comparison: DomainComparison[]
}

const riskColors = {
  healthy: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  at_risk: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  intervention: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
}

const riskLabels = {
  healthy: 'Healthy',
  at_risk: 'At Risk',
  intervention: 'Intervention',
}

export function AssessmentComparison({
  previous,
  current,
  comparison,
}: AssessmentComparisonProps) {
  const getTrendIcon = (trend: DomainComparison['trend']) => {
    switch (trend) {
      case 'improved':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declined':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'same':
        return <Minus className="w-4 h-4 text-gray-500" />
      case 'new':
        return <ArrowRight className="w-4 h-4 text-blue-500" />
    }
  }

  const getTrendLabel = (trend: DomainComparison['trend']) => {
    switch (trend) {
      case 'improved':
        return 'Improved'
      case 'declined':
        return 'Declined'
      case 'same':
        return 'No Change'
      case 'new':
        return 'New'
    }
  }

  const getTrendColor = (trend: DomainComparison['trend']) => {
    switch (trend) {
      case 'improved':
        return 'text-green-600 bg-green-50'
      case 'declined':
        return 'text-red-600 bg-red-50'
      case 'same':
        return 'text-gray-600 bg-gray-50'
      case 'new':
        return 'text-blue-600 bg-blue-50'
    }
  }

  // Calculate summary stats
  const improved = comparison.filter((c) => c.trend === 'improved').length
  const declined = comparison.filter((c) => c.trend === 'declined').length
  const same = comparison.filter((c) => c.trend === 'same').length

  return (
    <div className="space-y-6">
      {/* Header with Assessment Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Previous Assessment</CardDescription>
              <Badge
                variant="outline"
                className={cn(
                  riskColors[previous.overallRisk]?.bg,
                  riskColors[previous.overallRisk]?.text,
                  riskColors[previous.overallRisk]?.border
                )}
              >
                {riskLabels[previous.overallRisk]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(previous.assessedAt)}
              </div>
              {previous.assessor && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  Assessed by {previous.assessor.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Current Assessment</CardDescription>
              <Badge
                variant="outline"
                className={cn(
                  riskColors[current.overallRisk]?.bg,
                  riskColors[current.overallRisk]?.text,
                  riskColors[current.overallRisk]?.border
                )}
              >
                {riskLabels[current.overallRisk]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(current.assessedAt)}
              </div>
              {current.assessor && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  Assessed by {current.assessor.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{improved}</p>
              <p className="text-sm text-green-600">Improved</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <Minus className="w-6 h-6 text-gray-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-700">{same}</p>
              <p className="text-sm text-gray-600">No Change</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{declined}</p>
              <p className="text-sm text-red-600">Declined</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Comparison Table */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Domain Comparison</CardTitle>
          <CardDescription>
            Side-by-side comparison of all health domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Domain</th>
                  <th className="text-center p-3 text-sm font-medium">Previous</th>
                  <th className="text-center p-3 text-sm font-medium">Current</th>
                  <th className="text-center p-3 text-sm font-medium">Change</th>
                  <th className="text-center p-3 text-sm font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((item, index) => (
                  <tr
                    key={item.domain}
                    className={cn(
                      'border-t',
                      index % 2 === 0 ? 'bg-white' : 'bg-muted/20'
                    )}
                  >
                    <td className="p-3">
                      <span className="font-medium text-sm">{item.domainName}</span>
                    </td>
                    <td className="p-3 text-center">
                      {item.previousScore !== undefined ? (
                        <div className="space-y-1">
                          <span className="text-sm">{item.previousScore}</span>
                          {item.previousRisk && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs ml-1',
                                riskColors[item.previousRisk]?.bg,
                                riskColors[item.previousRisk]?.text
                              )}
                            >
                              {riskLabels[item.previousRisk]}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.currentScore !== undefined ? (
                        <div className="space-y-1">
                          <span className="text-sm">{item.currentScore}</span>
                          {item.currentRisk && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs ml-1',
                                riskColors[item.currentRisk]?.bg,
                                riskColors[item.currentRisk]?.text
                              )}
                            >
                              {riskLabels[item.currentRisk]}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          item.change < 0 && 'text-green-600',
                          item.change > 0 && 'text-red-600',
                          item.change === 0 && 'text-gray-500'
                        )}
                      >
                        {item.change > 0 && '+'}
                        {item.change}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                          getTrendColor(item.trend)
                        )}
                      >
                        {getTrendIcon(item.trend)}
                        {getTrendLabel(item.trend)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Trend Chart */}
      <Card className="border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Visual Comparison</CardTitle>
          <CardDescription>
            Domain scores comparison (lower is better)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparison.map((item) => (
              <div key={item.domain} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.domainName}</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(item.trend)}
                    <span className="text-muted-foreground">
                      {item.previousScore ?? '-'} → {item.currentScore ?? '-'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Previous Score Bar */}
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full transition-all"
                      style={{
                        width: `${((item.previousScore ?? 0) / 10) * 100}%`,
                      }}
                    />
                  </div>
                  {/* Current Score Bar */}
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        item.trend === 'improved' && 'bg-green-500',
                        item.trend === 'declined' && 'bg-red-500',
                        item.trend === 'same' && 'bg-blue-500',
                        item.trend === 'new' && 'bg-blue-500'
                      )}
                      style={{
                        width: `${((item.currentScore ?? 0) / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Previous</span>
                  <span>Current</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
