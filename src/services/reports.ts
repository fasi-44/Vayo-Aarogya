import type { Assessment, RiskLevel, ApiResponse } from '@/types'
import { getAssessments } from './assessments'
import { formatDate } from '@/lib/utils'

// Report data types
export interface ReportFilters {
  startDate?: string
  endDate?: string
  riskLevel?: RiskLevel
  stateName?: string
  districtName?: string
  talukName?: string
  villageName?: string
}

export interface ReportData {
  summary: {
    totalAssessments: number
    totalElderly: number
    healthyCount: number
    atRiskCount: number
    interventionCount: number
    averageScore: number
  }
  riskDistribution: {
    healthy: number
    at_risk: number
    intervention: number
  }
  domainBreakdown: {
    domain: string
    domainName: string
    avgScore: number
    atRiskCount: number
    interventionCount: number
  }[]
  trendData: {
    month: string
    healthy: number
    atRisk: number
    intervention: number
    total: number
  }[]
  assessments: Assessment[]
}

// Domain names mapping
const DOMAIN_NAMES: Record<string, string> = {
  cognition: 'Cognition',
  depression: 'Depression',
  mobility: 'Mobility',
  vision: 'Vision',
  hearing: 'Hearing',
  falls: 'Falls Risk',
  sleep: 'Sleep',
  nutrition: 'Appetite/Nutrition',
  weight: 'Weight Management',
  incontinence: 'Incontinence',
  social: 'Social Engagement',
  loneliness: 'Loneliness',
  iadl: 'Instrumental Activities',
  adl: 'Basic Activities',
  diabetes: 'Diabetes Management',
  hypertension: 'Hypertension Management',
  substance: 'Substance Use',
  healthcare: 'Healthcare Access',
  oral: 'Oral Health',
  pain: 'Pain Management',
}

// Generate report data
export async function generateReport(
  filters?: ReportFilters
): Promise<ApiResponse<ReportData>> {
  try {
    // Fetch assessments
    const result = await getAssessments({
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      overallRisk: filters?.riskLevel,
      limit: 10000,
    })

    if (!result.success || !result.data) {
      return { success: false, error: 'Failed to fetch assessments' }
    }

    const assessments = result.data.assessments

    // Calculate summary
    const uniqueElderly = new Set(assessments.map((a) => a.subjectId))
    const healthyCount = assessments.filter((a) => a.overallRisk === 'healthy').length
    const atRiskCount = assessments.filter((a) => a.overallRisk === 'at_risk').length
    const interventionCount = assessments.filter((a) => a.overallRisk === 'intervention').length

    // Calculate domain breakdown
    const domainStats: Record<string, { total: number; atRisk: number; intervention: number; scores: number[] }> = {}

    for (const assessment of assessments) {
      if (assessment.domains) {
        for (const domain of assessment.domains) {
          if (!domainStats[domain.domain]) {
            domainStats[domain.domain] = { total: 0, atRisk: 0, intervention: 0, scores: [] }
          }
          domainStats[domain.domain].total++
          if (domain.score !== undefined) {
            domainStats[domain.domain].scores.push(domain.score)
          }
          if (domain.riskLevel === 'at_risk') {
            domainStats[domain.domain].atRisk++
          }
          if (domain.riskLevel === 'intervention') {
            domainStats[domain.domain].intervention++
          }
        }
      }
    }

    const domainBreakdown = Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      domainName: DOMAIN_NAMES[domain] || domain,
      avgScore: stats.scores.length > 0
        ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length * 10) / 10
        : 0,
      atRiskCount: stats.atRisk,
      interventionCount: stats.intervention,
    }))

    // Calculate monthly trends
    const monthlyData: Record<string, { healthy: number; atRisk: number; intervention: number; total: number }> = {}

    for (const assessment of assessments) {
      const date = new Date(assessment.assessedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { healthy: 0, atRisk: 0, intervention: 0, total: 0 }
      }

      monthlyData[monthKey].total++
      if (assessment.overallRisk === 'healthy') monthlyData[monthKey].healthy++
      if (assessment.overallRisk === 'at_risk') monthlyData[monthKey].atRisk++
      if (assessment.overallRisk === 'intervention') monthlyData[monthKey].intervention++
    }

    const trendData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, data]) => ({
        month: formatMonth(month),
        ...data,
      }))

    return {
      success: true,
      data: {
        summary: {
          totalAssessments: assessments.length,
          totalElderly: uniqueElderly.size,
          healthyCount,
          atRiskCount,
          interventionCount,
          averageScore: 0,
        },
        riskDistribution: {
          healthy: healthyCount,
          at_risk: atRiskCount,
          intervention: interventionCount,
        },
        domainBreakdown,
        trendData,
        assessments,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to generate report' }
  }
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${month}/${year}`
}

// Generate CSV data
export function generateCSV(data: ReportData): string {
  const headers = [
    'Date',
    'Elder Name',
    'Vayo ID',
    'Overall Risk',
    'Assessor',
    'Notes',
  ]

  const rows = data.assessments.map((a) => [
    formatDate(a.assessedAt),
    a.subject?.name || '',
    a.subject?.vayoId || '',
    a.overallRisk,
    a.assessor?.name || '',
    (a.notes || '').replace(/"/g, '""'),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

// Generate detailed CSV with domain scores
export function generateDetailedCSV(data: ReportData): string {
  const domains = Object.keys(DOMAIN_NAMES)
  const headers = [
    'Date',
    'Elder Name',
    'Vayo ID',
    'Overall Risk',
    'Assessor',
    ...domains.map((d) => DOMAIN_NAMES[d]),
    'Notes',
  ]

  const rows = data.assessments.map((a) => {
    const domainScores = domains.map((domain) => {
      const domainData = a.domains?.find((d) => d.domain === domain)
      return domainData?.score?.toString() || ''
    })

    return [
      formatDate(a.assessedAt),
      a.subject?.name || '',
      a.subject?.vayoId || '',
      a.overallRisk,
      a.assessor?.name || '',
      ...domainScores,
      (a.notes || '').replace(/"/g, '""'),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

// Download CSV file
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Generate summary report text
export function generateSummaryText(data: ReportData): string {
  const total = data.summary.totalAssessments
  const healthyPct = total > 0 ? Math.round((data.summary.healthyCount / total) * 100) : 0
  const atRiskPct = total > 0 ? Math.round((data.summary.atRiskCount / total) * 100) : 0
  const interventionPct = total > 0 ? Math.round((data.summary.interventionCount / total) * 100) : 0

  return `
VAYO AAROGYA - HEALTH ASSESSMENT REPORT
Generated: ${formatDate(new Date())}

SUMMARY
-------
Total Assessments: ${data.summary.totalAssessments}
Unique Elders: ${data.summary.totalElderly}

RISK DISTRIBUTION
-----------------
Healthy: ${data.summary.healthyCount} (${healthyPct}%)
At Risk: ${data.summary.atRiskCount} (${atRiskPct}%)
Needs Intervention: ${data.summary.interventionCount} (${interventionPct}%)

TOP CONCERN DOMAINS
-------------------
${data.domainBreakdown
  .sort((a, b) => (b.atRiskCount + b.interventionCount) - (a.atRiskCount + a.interventionCount))
  .slice(0, 5)
  .map((d) => `- ${d.domainName}: ${d.atRiskCount + d.interventionCount} flagged (Avg Score: ${d.avgScore})`)
  .join('\n')}
`.trim()
}
