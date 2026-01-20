'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TrendData {
  month: string
  healthy: number
  atRisk: number
  intervention: number
  total: number
}

interface TrendChartProps {
  data: TrendData[]
  title?: string
  height?: number
}

export function TrendLineChart({ data, title = 'Assessment Trends', height = 250 }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6 text-center text-muted-foreground">
          No trend data available
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.total), 1)
  const chartWidth = 100
  const chartHeight = 100
  const padding = 10

  // Create SVG path for each line
  const createPath = (key: keyof TrendData) => {
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (chartWidth - 2 * padding)
      const y = chartHeight - padding - (((d[key] as number) / maxValue) * (chartHeight - 2 * padding))
      return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
  }

  const totalPath = createPath('total')

  // Y-axis labels
  const yLabels = [0, Math.round(maxValue / 2), maxValue]

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Monthly assessment volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-muted-foreground py-2">
            {yLabels.reverse().map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              ))}

              {/* Area fill */}
              <path
                d={`${totalPath} L ${chartWidth - padding},${chartHeight - padding} L ${padding},${chartHeight - padding} Z`}
                fill="url(#gradient)"
                opacity="0.3"
              />

              {/* Line */}
              <path
                d={totalPath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {data.map((d, i) => {
                const x = padding + (i / (data.length - 1 || 1)) * (chartWidth - 2 * padding)
                const y = chartHeight - padding - ((d.total / maxValue) * (chartHeight - 2 * padding))
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="hsl(var(--primary))"
                  />
                )
              })}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="ml-12 flex justify-between text-xs text-muted-foreground pt-2">
            {data.map((d, i) => (
              <span key={i} className="truncate max-w-[50px]">
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StackedBarChartProps {
  data: TrendData[]
  title?: string
  height?: number
}

export function TrendStackedBarChart({ data, title = 'Monthly Risk Breakdown', height = 250 }: StackedBarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6 text-center text-muted-foreground">
          No trend data available
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.total), 1)

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Risk distribution by month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-moss-500" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-smoked-500" />
              <span>At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-coral-500" />
              <span>Intervention</span>
            </div>
          </div>

          {/* Bars */}
          <div className="flex items-end justify-between gap-2" style={{ height: height - 80 }}>
            {data.map((d, i) => {
              const total = d.healthy + d.atRisk + d.intervention
              const barHeight = maxValue > 0 ? (total / maxValue) * 100 : 0
              const healthyHeight = total > 0 ? (d.healthy / total) * barHeight : 0
              const atRiskHeight = total > 0 ? (d.atRisk / total) * barHeight : 0
              const interventionHeight = total > 0 ? (d.intervention / total) * barHeight : 0

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full flex flex-col justify-end rounded-t overflow-hidden"
                    style={{ height: `${barHeight}%` }}
                  >
                    {interventionHeight > 0 && (
                      <div
                        className="w-full bg-coral-500"
                        style={{ height: `${(d.intervention / total) * 100}%` }}
                      />
                    )}
                    {atRiskHeight > 0 && (
                      <div
                        className="w-full bg-smoked-500"
                        style={{ height: `${(d.atRisk / total) * 100}%` }}
                      />
                    )}
                    {healthyHeight > 0 && (
                      <div
                        className="w-full bg-moss-500"
                        style={{ height: `${(d.healthy / total) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 truncate max-w-full">
                    {d.month.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
