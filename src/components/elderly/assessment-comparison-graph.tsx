'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { type Assessment } from '@/types'

interface AssessmentComparisonGraphProps {
  assessments: Assessment[]
  isLoading: boolean
}

const DOMAIN_NAMES: Record<string, string> = {
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

const DOMAIN_COLORS: Record<string, string> = {
  cognition: '#8884d8',
  depression: '#e91e63',
  mobility: '#00bcd4',
  vision: '#4caf50',
  hearing: '#ff9800',
  falls: '#f44336',
  sleep: '#9c27b0',
  nutrition: '#795548',
  weight: '#607d8b',
  incontinence: '#3f51b5',
  social: '#009688',
  loneliness: '#673ab7',
  iadl: '#2196f3',
  adl: '#ff5722',
  diabetes: '#ffc107',
  hypertension: '#e91e63',
  substance: '#9e9e9e',
  healthcare: '#03a9f4',
  oral: '#8bc34a',
  pain: '#ff6f00',
}

export function AssessmentComparisonGraph({
  assessments,
  isLoading,
}: AssessmentComparisonGraphProps) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'cognition',
    'depression',
    'mobility',
    'falls',
  ])
  const [chartType, setChartType] = useState<'line' | 'radar'>('line')

  // Filter only completed assessments for comparison
  const completedAssessments = useMemo(() => {
    return assessments
      .filter((a) => a.status === 'completed')
      .sort((a, b) => new Date(a.assessedAt).getTime() - new Date(b.assessedAt).getTime())
  }, [assessments])

  // Transform data for line chart
  const lineChartData = useMemo(() => {
    return completedAssessments.map((assessment, index) => {
      const dataPoint: Record<string, string | number> = {
        name: `#${index + 1}`,
        date: new Date(assessment.assessedAt).toLocaleDateString(),
        fullDate: new Date(assessment.assessedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      }

      assessment.domains?.forEach((domain) => {
        dataPoint[domain.domain] = domain.score ?? 0
      })

      return dataPoint
    })
  }, [completedAssessments])

  // Transform data for radar chart (comparing latest vs previous)
  const radarChartData = useMemo(() => {
    if (completedAssessments.length < 1) return []

    const latest = completedAssessments[completedAssessments.length - 1]
    const previous = completedAssessments.length > 1
      ? completedAssessments[completedAssessments.length - 2]
      : null

    const allDomains = Object.keys(DOMAIN_NAMES)

    return allDomains.map((domainKey) => {
      const latestDomain = latest.domains?.find((d) => d.domain === domainKey)
      const previousDomain = previous?.domains?.find((d) => d.domain === domainKey)

      return {
        domain: DOMAIN_NAMES[domainKey],
        latest: latestDomain?.score ?? 0,
        previous: previousDomain?.score ?? 0,
      }
    })
  }, [completedAssessments])

  // Calculate trends for each domain
  const domainTrends = useMemo(() => {
    if (completedAssessments.length < 2) return {}

    const trends: Record<string, { change: number; trend: 'improved' | 'declined' | 'same' }> = {}
    const latest = completedAssessments[completedAssessments.length - 1]
    const previous = completedAssessments[completedAssessments.length - 2]

    Object.keys(DOMAIN_NAMES).forEach((domainKey) => {
      const latestScore = latest.domains?.find((d) => d.domain === domainKey)?.score ?? 0
      const previousScore = previous.domains?.find((d) => d.domain === domainKey)?.score ?? 0
      const change = latestScore - previousScore

      // Lower score is better (0=healthy, 2=intervention)
      let trend: 'improved' | 'declined' | 'same' = 'same'
      if (change < 0) trend = 'improved'
      else if (change > 0) trend = 'declined'

      trends[domainKey] = { change: Math.abs(change), trend }
    })

    return trends
  }, [completedAssessments])

  // Get all available domains from assessments
  const availableDomains = useMemo(() => {
    const domains = new Set<string>()
    completedAssessments.forEach((assessment) => {
      assessment.domains?.forEach((domain) => {
        domains.add(domain.domain)
      })
    })
    return Array.from(domains)
  }, [completedAssessments])

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (completedAssessments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No completed assessments to compare</p>
        <p className="text-sm mt-1">Complete at least one assessment to see trends</p>
      </div>
    )
  }

  if (completedAssessments.length === 1) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Only one completed assessment</p>
        <p className="text-sm mt-1">Complete another assessment to compare trends</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      {/* Trend Summary Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trend Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(domainTrends).map(([domain, { trend }]) => (
              <Badge
                key={domain}
                variant="outline"
                className={`text-xs ${
                  trend === 'improved'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : trend === 'declined'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {trend === 'improved' && <TrendingDown className="w-3 h-3 mr-1" />}
                {trend === 'declined' && <TrendingUp className="w-3 h-3 mr-1" />}
                {trend === 'same' && <Minus className="w-3 h-3 mr-1" />}
                {DOMAIN_NAMES[domain]}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Comparing latest assessment with previous. Lower scores indicate better health.
          </p>
        </CardContent>
      </Card>

      {/* Chart Type Selection */}
      <div className="flex items-center justify-between">
        <Select value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'radar')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line Chart (Trends)</SelectItem>
            <SelectItem value="radar">Radar Chart (Compare)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Domain Selection for Line Chart */}
      {chartType === 'line' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Select Domains to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableDomains.map((domain) => (
                <Badge
                  key={domain}
                  variant={selectedDomains.includes(domain) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedDomains.includes(domain)
                      ? DOMAIN_COLORS[domain]
                      : undefined,
                    borderColor: DOMAIN_COLORS[domain],
                    color: selectedDomains.includes(domain) ? 'white' : DOMAIN_COLORS[domain],
                  }}
                  onClick={() => toggleDomain(domain)}
                >
                  {DOMAIN_NAMES[domain]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {chartType === 'line' ? 'Score Trends Over Time' : 'Latest vs Previous Assessment'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            {chartType === 'line' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    label={{
                      value: 'Score',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload?.[0]?.payload?.fullDate) {
                        return `Assessment on ${payload[0].payload.fullDate}`
                      }
                      return ''
                    }}
                  />
                  <Legend />
                  {selectedDomains.map((domain) => (
                    <Line
                      key={domain}
                      type="monotone"
                      dataKey={domain}
                      name={DOMAIN_NAMES[domain]}
                      stroke={DOMAIN_COLORS[domain]}
                      strokeWidth={2}
                      dot={{ fill: DOMAIN_COLORS[domain], strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <PolarGrid />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 10]}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Previous"
                    dataKey="previous"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Latest"
                    dataKey="latest"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart Legend/Help */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Understanding the Scores</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><span className="text-green-600 font-medium">0</span> = No difficulty (Healthy)</li>
                  <li><span className="text-yellow-600 font-medium">1</span> = Some difficulty (At Risk)</li>
                  <li><span className="text-red-600 font-medium">2</span> = Severe difficulty (Needs Intervention)</li>
                </ul>
                <p className="mt-2">Lower scores indicate better health outcomes. A decreasing trend is positive.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Assessment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {completedAssessments.map((assessment, index) => {
              const prevAssessment = index > 0 ? completedAssessments[index - 1] : null
              const currentTotal = assessment.domains?.reduce((sum, d) => sum + (d.score ?? 0), 0) ?? 0
              const prevTotal = prevAssessment?.domains?.reduce((sum, d) => sum + (d.score ?? 0), 0) ?? 0
              const diff = prevAssessment ? currentTotal - prevTotal : 0

              return (
                <div
                  key={assessment.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(assessment.assessedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Score: {currentTotal}
                    </p>
                  </div>
                  {prevAssessment && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        diff < 0
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : diff > 0
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {diff < 0 && <TrendingDown className="w-3 h-3 mr-1" />}
                      {diff > 0 && <TrendingUp className="w-3 h-3 mr-1" />}
                      {diff === 0 && <Minus className="w-3 h-3 mr-1" />}
                      {diff > 0 ? '+' : ''}{diff}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
