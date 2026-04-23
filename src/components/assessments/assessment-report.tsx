'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  ClipboardList,
  FlagTriangleRight,
  Siren,
  Sparkles,
} from 'lucide-react'
import {
  type AssessmentAction,
  type AssessmentResult,
  type ClinicalScale,
  type RiskFlag,
} from '@/lib/assessment-scoring'

interface AssessmentReportProps {
  result: AssessmentResult
  /** Suppress the emergency banner (e.g. when already shown higher up the page). */
  hideEmergencyBanner?: boolean
}

/**
 * Renders the PDF section-6 output: Patient Summary, Recommended Scales,
 * Risk Flags, Action — plus an emergency banner for self-harm.
 */
export function AssessmentReport({ result, hideEmergencyBanner }: AssessmentReportProps) {
  return (
    <div className="space-y-6">
      {result.emergency && !hideEmergencyBanner && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Siren className="w-6 h-6 text-red-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-bold text-red-700">🚨 EMERGENCY — Self-harm risk reported</p>
              <p className="text-sm text-red-700 mt-1">
                Arrange an immediate psychiatric evaluation. Do not leave the person alone.
                Contact emergency services or the local crisis team now.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Summary: Domains affected */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Patient Summary
          </CardTitle>
          <CardDescription>Domains flagged by ICOPE screening</CardDescription>
        </CardHeader>
        <CardContent>
          {result.affectedDomains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No domains flagged — overall healthy screening.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.affectedDomains.map(d => (
                <Badge key={d} variant="outline" className="text-sm px-3 py-1 bg-primary/5 border-primary/30">
                  {d}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Scales */}
      {result.recommendedScales.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Recommended Scales
            </CardTitle>
            <CardDescription>Targeted clinical scales to administer next</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.recommendedScales.map(scale => (
                <ScaleCard key={scale.code} scale={scale} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Flags */}
      {result.riskFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FlagTriangleRight className="w-5 h-5 text-primary" />
              Risk Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.riskFlags.map(flag => (
                <li key={flag.id} className="flex items-start gap-2 text-sm">
                  <Badge className={`${getFlagBadgeClass(flag.severity)} shrink-0`}>
                    {flag.severity}
                  </Badge>
                  <span>{flag.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {result.actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Action
            </CardTitle>
            <CardDescription>Recommended next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.actions.map(action => (
                <li key={action.id} className="flex items-start gap-2 text-sm">
                  <Badge className={`${getActionBadgeClass(action.priority)} shrink-0`}>
                    {action.priority}
                  </Badge>
                  <span>{action.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ScaleCard({ scale }: { scale: ClinicalScale }) {
  return (
    <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2">
        <Badge className="bg-primary text-primary-foreground font-semibold">{scale.code}</Badge>
        <span className="font-medium text-sm">{scale.name}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{scale.purpose}</p>
    </div>
  )
}

function getFlagBadgeClass(severity: RiskFlag['severity']): string {
  switch (severity) {
    case 'low':       return 'bg-green-100 text-green-700'
    case 'moderate':  return 'bg-yellow-100 text-yellow-700'
    case 'high':      return 'bg-orange-100 text-orange-700'
    case 'emergency': return 'bg-red-100 text-red-700 animate-pulse'
  }
}

function getActionBadgeClass(priority: AssessmentAction['priority']): string {
  switch (priority) {
    case 'routine':   return 'bg-green-100 text-green-700'
    case 'soon':      return 'bg-yellow-100 text-yellow-700'
    case 'urgent':    return 'bg-orange-100 text-orange-700'
    case 'emergency': return 'bg-red-100 text-red-700 animate-pulse'
  }
}
