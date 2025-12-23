'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RiskChartProps {
  data: {
    healthy: number
    at_risk: number
    intervention: number
  }
  title?: string
  showLegend?: boolean
}

export function RiskPieChart({ data, title = 'Risk Distribution', showLegend = true }: RiskChartProps) {
  const total = data.healthy + data.at_risk + data.intervention

  if (total === 0) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6 text-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    )
  }

  const healthyPct = Math.round((data.healthy / total) * 100)
  const atRiskPct = Math.round((data.at_risk / total) * 100)
  const interventionPct = 100 - healthyPct - atRiskPct

  // Calculate SVG pie chart segments
  const radius = 80
  const circumference = 2 * Math.PI * radius

  const healthyLength = (healthyPct / 100) * circumference
  const atRiskLength = (atRiskPct / 100) * circumference
  const interventionLength = (interventionPct / 100) * circumference

  const healthyOffset = 0
  const atRiskOffset = -healthyLength
  const interventionOffset = -(healthyLength + atRiskLength)

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Total: {total} assessments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          {/* Pie Chart */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Healthy segment */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#22c55e"
                strokeWidth="40"
                strokeDasharray={`${healthyLength} ${circumference}`}
                strokeDashoffset={healthyOffset}
                transform="rotate(-90 100 100)"
              />
              {/* At Risk segment */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#eab308"
                strokeWidth="40"
                strokeDasharray={`${atRiskLength} ${circumference}`}
                strokeDashoffset={atRiskOffset}
                transform="rotate(-90 100 100)"
              />
              {/* Intervention segment */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="40"
                strokeDasharray={`${interventionLength} ${circumference}`}
                strokeDashoffset={interventionOffset}
                transform="rotate(-90 100 100)"
              />
              {/* Center circle */}
              <circle cx="100" cy="100" r="50" fill="white" />
              <text
                x="100"
                y="95"
                textAnchor="middle"
                className="text-2xl font-bold fill-foreground"
              >
                {total}
              </text>
              <text
                x="100"
                y="115"
                textAnchor="middle"
                className="text-sm fill-muted-foreground"
              >
                Total
              </text>
            </svg>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium">Healthy</p>
                  <p className="text-sm text-muted-foreground">{data.healthy} ({healthyPct}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <div>
                  <p className="font-medium">At Risk</p>
                  <p className="text-sm text-muted-foreground">{data.at_risk} ({atRiskPct}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <div>
                  <p className="font-medium">Intervention</p>
                  <p className="text-sm text-muted-foreground">{data.intervention} ({interventionPct}%)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface RiskBarChartProps {
  data: {
    healthy: number
    at_risk: number
    intervention: number
  }
  title?: string
}

export function RiskBarChart({ data, title = 'Risk Distribution' }: RiskBarChartProps) {
  const total = data.healthy + data.at_risk + data.intervention
  const maxValue = Math.max(data.healthy, data.at_risk, data.intervention, 1)

  const items = [
    { label: 'Healthy', value: data.healthy, color: 'bg-green-500' },
    { label: 'At Risk', value: data.at_risk, color: 'bg-yellow-500' },
    { label: 'Intervention', value: data.intervention, color: 'bg-red-500' },
  ]

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.value} ({pct}%)
                </span>
              </div>
              <div className="h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', item.color)}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
