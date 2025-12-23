/**
 * Recommendations Engine for Vayo Aarogya
 *
 * Auto-generates next-step recommendations based on:
 * - Overall risk level
 * - Specific domain flags
 * - Previous assessment trends
 */

import type { RiskLevel } from '@/types'
import { DomainScore } from './assessment-scoring'

export interface Recommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'follow-up' | 'referral' | 'intervention' | 'monitoring' | 'lifestyle'
  title: string
  description: string
  domain?: string
  timeframe?: string
}

// Domain-specific recommendations
const domainRecommendations: Record<string, Record<RiskLevel, Recommendation[]>> = {
  cognition: {
    healthy: [],
    at_risk: [
      {
        id: 'cog_monitor',
        priority: 'medium',
        category: 'monitoring',
        title: 'Cognitive Monitoring',
        description: 'Monitor for signs of memory decline. Consider cognitive exercises.',
        timeframe: 'Monthly',
      },
    ],
    intervention: [
      {
        id: 'cog_referral',
        priority: 'high',
        category: 'referral',
        title: 'Cognitive Specialist Referral',
        description: 'Refer to neurologist or geriatric psychiatrist for comprehensive evaluation.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  depression: {
    healthy: [],
    at_risk: [
      {
        id: 'dep_phq9',
        priority: 'medium',
        category: 'follow-up',
        title: 'PHQ-9 Screening',
        description: 'Administer PHQ-9 for detailed depression assessment.',
        timeframe: 'Within 2 weeks',
      },
    ],
    intervention: [
      {
        id: 'dep_mental',
        priority: 'urgent',
        category: 'referral',
        title: 'Mental Health Referral',
        description: 'Urgent referral to mental health professional. Assess for suicide risk.',
        timeframe: 'Within 48 hours',
      },
    ],
  },
  mobility: {
    healthy: [],
    at_risk: [
      {
        id: 'mob_exercise',
        priority: 'medium',
        category: 'lifestyle',
        title: 'Mobility Exercises',
        description: 'Recommend light walking and balance exercises. Consider assistive devices.',
        timeframe: 'Start immediately',
      },
    ],
    intervention: [
      {
        id: 'mob_physio',
        priority: 'high',
        category: 'referral',
        title: 'Physiotherapy Referral',
        description: 'Refer to physiotherapist for mobility assessment and rehabilitation.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  vision: {
    healthy: [],
    at_risk: [
      {
        id: 'vis_screen',
        priority: 'medium',
        category: 'follow-up',
        title: 'Vision Screening',
        description: 'Schedule comprehensive vision screening.',
        timeframe: 'Within 1 month',
      },
    ],
    intervention: [
      {
        id: 'vis_ophth',
        priority: 'high',
        category: 'referral',
        title: 'Ophthalmology Referral',
        description: 'Urgent referral to ophthalmologist for evaluation.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  hearing: {
    healthy: [],
    at_risk: [
      {
        id: 'hear_screen',
        priority: 'medium',
        category: 'follow-up',
        title: 'Hearing Assessment',
        description: 'Schedule hearing evaluation. Consider hearing aids if needed.',
        timeframe: 'Within 1 month',
      },
    ],
    intervention: [
      {
        id: 'hear_audio',
        priority: 'high',
        category: 'referral',
        title: 'Audiology Referral',
        description: 'Refer to audiologist for comprehensive hearing evaluation.',
        timeframe: 'Within 2 weeks',
      },
    ],
  },
  falls: {
    healthy: [],
    at_risk: [
      {
        id: 'falls_home',
        priority: 'high',
        category: 'intervention',
        title: 'Home Safety Assessment',
        description: 'Conduct home safety evaluation. Remove hazards, add grab bars.',
        timeframe: 'Within 1 week',
      },
    ],
    intervention: [
      {
        id: 'falls_urgent',
        priority: 'urgent',
        category: 'intervention',
        title: 'Falls Prevention Program',
        description: 'Enroll in falls prevention program. Consider 24/7 supervision.',
        timeframe: 'Immediately',
      },
    ],
  },
  nutrition: {
    healthy: [],
    at_risk: [
      {
        id: 'nut_counsel',
        priority: 'medium',
        category: 'lifestyle',
        title: 'Nutritional Counseling',
        description: 'Provide dietary guidance. Monitor food intake.',
        timeframe: 'Within 2 weeks',
      },
    ],
    intervention: [
      {
        id: 'nut_diet',
        priority: 'high',
        category: 'referral',
        title: 'Dietitian Referral',
        description: 'Refer to registered dietitian for nutritional assessment.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  weight: {
    healthy: [],
    at_risk: [
      {
        id: 'wt_monitor',
        priority: 'medium',
        category: 'monitoring',
        title: 'Weight Monitoring',
        description: 'Weekly weight monitoring. Track changes.',
        timeframe: 'Weekly',
      },
    ],
    intervention: [
      {
        id: 'wt_assess',
        priority: 'high',
        category: 'referral',
        title: 'Weight Loss Investigation',
        description: 'Investigate cause of unintentional weight loss. Rule out underlying conditions.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  adl: {
    healthy: [],
    at_risk: [
      {
        id: 'adl_assist',
        priority: 'medium',
        category: 'intervention',
        title: 'ADL Support Assessment',
        description: 'Assess need for personal care assistance.',
        timeframe: 'Within 2 weeks',
      },
    ],
    intervention: [
      {
        id: 'adl_care',
        priority: 'high',
        category: 'intervention',
        title: 'Personal Care Support',
        description: 'Arrange personal care support services.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  iadl: {
    healthy: [],
    at_risk: [
      {
        id: 'iadl_support',
        priority: 'medium',
        category: 'intervention',
        title: 'IADL Support Planning',
        description: 'Assess need for help with shopping, cooking, finances.',
        timeframe: 'Within 2 weeks',
      },
    ],
    intervention: [
      {
        id: 'iadl_services',
        priority: 'high',
        category: 'intervention',
        title: 'Community Support Services',
        description: 'Connect with community support services for daily living assistance.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  loneliness: {
    healthy: [],
    at_risk: [
      {
        id: 'lone_social',
        priority: 'medium',
        category: 'lifestyle',
        title: 'Social Engagement',
        description: 'Connect with senior center or community programs.',
        timeframe: 'Within 2 weeks',
      },
    ],
    intervention: [
      {
        id: 'lone_urgent',
        priority: 'high',
        category: 'intervention',
        title: 'Social Support Intervention',
        description: 'Arrange regular visitor program. Assess for depression.',
        timeframe: 'Within 1 week',
      },
    ],
  },
  pain: {
    healthy: [],
    at_risk: [
      {
        id: 'pain_assess',
        priority: 'medium',
        category: 'follow-up',
        title: 'Pain Assessment',
        description: 'Detailed pain assessment and management plan.',
        timeframe: 'Within 2 weeks',
      },
    ],
    intervention: [
      {
        id: 'pain_mgmt',
        priority: 'high',
        category: 'referral',
        title: 'Pain Management Consultation',
        description: 'Refer to pain management specialist.',
        timeframe: 'Within 1 week',
      },
    ],
  },
}

// Overall risk recommendations
const overallRecommendations: Record<RiskLevel, Recommendation[]> = {
  healthy: [
    {
      id: 'overall_healthy',
      priority: 'low',
      category: 'follow-up',
      title: 'Annual Reassessment',
      description: 'Continue current care plan. Schedule annual comprehensive assessment.',
      timeframe: '12 months',
    },
  ],
  at_risk: [
    {
      id: 'overall_atrisk',
      priority: 'medium',
      category: 'follow-up',
      title: 'Follow-up Assessment',
      description: 'Schedule follow-up assessment to monitor at-risk domains.',
      timeframe: 'Within 2 weeks',
    },
    {
      id: 'overall_plan',
      priority: 'medium',
      category: 'intervention',
      title: 'Care Plan Review',
      description: 'Review and update care plan based on assessment findings.',
      timeframe: 'Within 1 week',
    },
  ],
  intervention: [
    {
      id: 'overall_urgent',
      priority: 'urgent',
      category: 'referral',
      title: 'Comprehensive Geriatric Assessment',
      description: 'Urgent referral for comprehensive geriatric assessment.',
      timeframe: 'Within 48 hours',
    },
    {
      id: 'overall_multidis',
      priority: 'high',
      category: 'intervention',
      title: 'Multidisciplinary Team Review',
      description: 'Convene multidisciplinary team to develop intervention plan.',
      timeframe: 'Within 1 week',
    },
  ],
}

/**
 * Generate recommendations based on assessment results
 */
export function generateRecommendations(
  overallRisk: RiskLevel,
  domainScores: DomainScore[],
  flaggedDomains: string[] = []
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Add overall recommendations
  recommendations.push(...overallRecommendations[overallRisk])

  // Add domain-specific recommendations
  for (const domain of domainScores) {
    const domainRecs = domainRecommendations[domain.domain]
    if (domainRecs && domainRecs[domain.riskLevel]) {
      recommendations.push(
        ...domainRecs[domain.riskLevel].map(rec => ({
          ...rec,
          domain: domain.domainName,
        }))
      )
    }
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Remove duplicates by id
  const seen = new Set<string>()
  return recommendations.filter(rec => {
    if (seen.has(rec.id)) return false
    seen.add(rec.id)
    return true
  })
}

/**
 * Generate interventions from recommendations
 */
export function recommendationsToInterventions(
  recommendations: Recommendation[],
  elderlyId: string,
  assessmentId?: string
) {
  return recommendations
    .filter(rec => rec.priority === 'urgent' || rec.priority === 'high')
    .map(rec => ({
      userId: elderlyId,
      assessmentId,
      title: rec.title,
      description: rec.description,
      domain: rec.domain || 'general',
      priority: rec.priority,
      status: 'pending' as const,
      dueDate: calculateDueDate(rec.timeframe),
    }))
}

function calculateDueDate(timeframe?: string): Date | undefined {
  if (!timeframe) return undefined

  const now = new Date()

  if (timeframe.includes('48 hours') || timeframe === 'Immediately') {
    return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  }
  if (timeframe.includes('1 week')) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
  if (timeframe.includes('2 weeks')) {
    return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  }
  if (timeframe.includes('1 month')) {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }

  return undefined
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: Recommendation['priority']) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200'
  }
}

/**
 * Get category icon name
 */
export function getCategoryIcon(category: Recommendation['category']) {
  switch (category) {
    case 'follow-up':
      return 'Calendar'
    case 'referral':
      return 'UserPlus'
    case 'intervention':
      return 'Activity'
    case 'monitoring':
      return 'Eye'
    case 'lifestyle':
      return 'Heart'
  }
}
