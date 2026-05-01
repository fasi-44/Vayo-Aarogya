'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  ClipboardList,
  FlagTriangleRight,
  Siren,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import {
  type AssessmentAction,
  type AssessmentResult,
  type ClinicalScale,
  type ClinicalScaleCode,
  type RiskFlag,
} from '@/lib/assessment-scoring'
import { HMSEDialog } from './scales/hmse-dialog'
import { MoCADialog } from './scales/moca-dialog'
import { CAMDialog } from './scales/cam-dialog'
import { PHQ9Dialog } from './scales/phq9-dialog'
import { GDSDialog } from './scales/gds-dialog'
import { BSSDialog } from './scales/bss-dialog'
import { HAMADialog } from './scales/hama-dialog'
import { BPRSDialog } from './scales/bprs-dialog'
import { MNADialog } from './scales/mna-dialog'
import { UCLADialog } from './scales/ucla-dialog'
import type { HMSEAnswers, HMSEResult } from '@/lib/clinical-scales/hmse'
import type { MoCAAnswers, MoCAResult } from '@/lib/clinical-scales/moca'
import type { CAMAnswers, CAMResult } from '@/lib/clinical-scales/cam'
import type { PHQ9Answers, PHQ9Result } from '@/lib/clinical-scales/phq9'
import type { GDSAnswers, GDSResult } from '@/lib/clinical-scales/gds'
import type { BSSAnswers, BSSResult } from '@/lib/clinical-scales/bss'
import type { HAMAAnswers, HAMAResult } from '@/lib/clinical-scales/hama'
import type { BPRSAnswers, BPRSResult } from '@/lib/clinical-scales/bprs'
import type { MNAAnswers, MNAResult } from '@/lib/clinical-scales/mna'
import type { UCLAAnswers, UCLAResult } from '@/lib/clinical-scales/ucla'

/** Scales that have a working in-app administration dialog. */
const IMPLEMENTED_SCALES: ClinicalScaleCode[] = ['HMSE', 'MoCA', 'CAM', 'PHQ-9', 'GDS', 'BSS', 'HAM-A', 'BPRS', 'MNA', 'UCLA']

/** Minimal shape needed by the scale card to display a saved result. */
interface ScaleResultSummary {
  total: number
  maxTotal: number
  bandLabel: string
}

/** Shape of one saved scale entry inside the scaleResults JSON blob. */
export interface SavedScaleEntry {
  result: ScaleResultSummary
  answers: Record<string, unknown>
  savedAt: string
  lowEducation?: boolean  // MoCA only
}

interface AssessmentReportProps {
  result: AssessmentResult
  hideEmergencyBanner?: boolean
  subjectName?: string
  /** Pre-populated scale results loaded from the database (view & edit pages). */
  initialScaleResults?: Record<string, SavedScaleEntry>
  /** Called whenever a scale is saved — parent should persist this. */
  onScaleResultsChange?: (scaleResults: Record<string, SavedScaleEntry>) => void
  /** When false (default) scale cards show saved results but dialogs cannot be opened. */
  editable?: boolean
}

export function AssessmentReport({
  result,
  hideEmergencyBanner,
  subjectName,
  initialScaleResults,
  onScaleResultsChange,
  editable = false,
}: AssessmentReportProps) {
  const [activeScale, setActiveScale] = useState<ClinicalScaleCode | null>(null)
  const [hmseResult, setHmseResult] = useState<HMSEResult | undefined>(undefined)
  const [mocaResult, setMocaResult] = useState<MoCAResult | undefined>(undefined)
  const [camResult, setCamResult] = useState<CAMResult | undefined>(undefined)
  const [phq9Result, setPhq9Result] = useState<PHQ9Result | undefined>(undefined)
  const [gdsResult, setGdsResult] = useState<GDSResult | undefined>(undefined)
  const [bssResult, setBssResult] = useState<BSSResult | undefined>(undefined)
  const [hamaResult, setHamaResult] = useState<HAMAResult | undefined>(undefined)
  const [bprsResult, setBprsResult] = useState<BPRSResult | undefined>(undefined)
  const [mnaResult, setMnaResult] = useState<MNAResult | undefined>(undefined)
  const [uclaResult, setUclaResult] = useState<UCLAResult | undefined>(undefined)

  // Pre-fill result state from saved database values on mount
  useEffect(() => {
    if (!initialScaleResults) return
    const r = initialScaleResults
    if (r.HMSE)    setHmseResult(r.HMSE.result as HMSEResult)
    if (r.MoCA)    setMocaResult(r.MoCA.result as MoCAResult)
    if (r.CAM)     setCamResult(r.CAM.result as CAMResult)
    if (r['PHQ-9']) setPhq9Result(r['PHQ-9'].result as PHQ9Result)
    if (r.GDS)     setGdsResult(r.GDS.result as GDSResult)
    if (r.BSS)     setBssResult(r.BSS.result as BSSResult)
    if (r['HAM-A']) setHamaResult(r['HAM-A'].result as HAMAResult)
    if (r.BPRS)    setBprsResult(r.BPRS.result as BPRSResult)
    if (r.MNA)     setMnaResult(r.MNA.result as unknown as MNAResult)
    if (r.UCLA)    setUclaResult(r.UCLA.result as UCLAResult)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Build an updated scaleResults blob and call the parent handler. */
  const notifyChange = (code: string, entry: SavedScaleEntry) => {
    if (!onScaleResultsChange) return
    const current: Record<string, SavedScaleEntry> = { ...(initialScaleResults ?? {}) }
    current[code] = entry
    onScaleResultsChange(current)
  }

  const handleOpenScale = (code: ClinicalScaleCode) => {
    if (editable && IMPLEMENTED_SCALES.includes(code)) setActiveScale(code)
  }

  const handleHMSEComplete = (res: HMSEResult, answers: HMSEAnswers) => {
    setHmseResult(res)
    notifyChange('HMSE', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleMoCAComplete = (res: MoCAResult, answers: MoCAAnswers, lowEducation: boolean) => {
    setMocaResult(res)
    notifyChange('MoCA', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString(), lowEducation })
  }

  const handleCAMComplete = (res: CAMResult, answers: CAMAnswers) => {
    setCamResult(res)
    notifyChange('CAM', { result: res as unknown as ScaleResultSummary, answers: answers as unknown as Record<string, unknown>, savedAt: new Date().toISOString() })
  }

  const handlePHQ9Complete = (res: PHQ9Result, answers: PHQ9Answers) => {
    setPhq9Result(res)
    notifyChange('PHQ-9', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleGDSComplete = (res: GDSResult, answers: GDSAnswers) => {
    setGdsResult(res)
    notifyChange('GDS', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleBSSComplete = (res: BSSResult, answers: BSSAnswers) => {
    setBssResult(res)
    notifyChange('BSS', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleHAMAComplete = (res: HAMAResult, answers: HAMAAnswers) => {
    setHamaResult(res)
    notifyChange('HAM-A', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleBPRSComplete = (res: BPRSResult, answers: BPRSAnswers) => {
    setBprsResult(res)
    notifyChange('BPRS', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleMNAComplete = (res: MNAResult, answers: MNAAnswers) => {
    setMnaResult(res)
    notifyChange('MNA', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const handleUCLAComplete = (res: UCLAResult, answers: UCLAAnswers) => {
    setUclaResult(res)
    notifyChange('UCLA', { result: res as unknown as ScaleResultSummary, answers, savedAt: new Date().toISOString() })
  }

  const getScaleResult = (code: ClinicalScaleCode): ScaleResultSummary | undefined => {
    if (code === 'HMSE') return hmseResult
    if (code === 'MoCA') return mocaResult
    if (code === 'CAM') return camResult
    if (code === 'PHQ-9') return phq9Result
    if (code === 'GDS') return gdsResult
    if (code === 'BSS') return bssResult
    if (code === 'HAM-A') return hamaResult
    if (code === 'BPRS') return bprsResult
    if (code === 'MNA' && mnaResult) return { total: mnaResult.total, maxTotal: mnaResult.totalMax, bandLabel: mnaResult.bandLabel }
    if (code === 'UCLA') return uclaResult
    return undefined
  }

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
                <ScaleCard
                  key={scale.code}
                  scale={scale}
                  available={IMPLEMENTED_SCALES.includes(scale.code)}
                  result={getScaleResult(scale.code)}
                  editable={editable}
                  onClick={() => handleOpenScale(scale.code)}
                />
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

      {/* Scale dialogs */}
      <HMSEDialog
        open={activeScale === 'HMSE'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleHMSEComplete}
      />
      <MoCADialog
        open={activeScale === 'MoCA'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleMoCAComplete}
      />
      <CAMDialog
        open={activeScale === 'CAM'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleCAMComplete}
      />
      <PHQ9Dialog
        open={activeScale === 'PHQ-9'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handlePHQ9Complete}
      />
      <GDSDialog
        open={activeScale === 'GDS'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleGDSComplete}
      />
      <BSSDialog
        open={activeScale === 'BSS'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleBSSComplete}
      />
      <HAMADialog
        open={activeScale === 'HAM-A'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleHAMAComplete}
      />
      <BPRSDialog
        open={activeScale === 'BPRS'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleBPRSComplete}
      />
      <MNADialog
        open={activeScale === 'MNA'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleMNAComplete}
      />
      <UCLADialog
        open={activeScale === 'UCLA'}
        onOpenChange={(open) => !open && setActiveScale(null)}
        subjectName={subjectName}
        onComplete={handleUCLAComplete}
      />
    </div>
  )
}

interface ScaleCardProps {
  scale: ClinicalScale
  available: boolean
  result?: ScaleResultSummary
  editable?: boolean
  onClick: () => void
}

function ScaleCard({ scale, available, result, editable, onClick }: ScaleCardProps) {
  const canClick = available && (editable || false)
  const hasResult = !!result

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        !available
          ? 'bg-muted/30 border-border cursor-not-allowed opacity-70'
          : canClick
            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 cursor-pointer'
            : 'bg-muted/20 border-border cursor-default'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge className="bg-primary text-primary-foreground font-semibold shrink-0">
            {scale.code}
          </Badge>
          <span className="font-medium text-sm truncate">{scale.name}</span>
        </div>
        {available && hasResult && (
          <Badge variant="outline" className="text-xs shrink-0">
            {result.total}/{result.maxTotal}
          </Badge>
        )}
        {available && !hasResult && canClick && (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{scale.purpose}</p>
      {!available && (
        <p className="text-[11px] mt-1 text-muted-foreground italic">Coming soon</p>
      )}
      {available && hasResult && (
        <p className="text-[11px] mt-1 text-foreground">
          {result.bandLabel}
          {canClick && ' — tap to re-administer'}
        </p>
      )}
      {available && !hasResult && canClick && (
        <p className="text-[11px] mt-1 text-primary font-medium">Tap to administer →</p>
      )}
      {available && !hasResult && !canClick && (
        <p className="text-[11px] mt-1 text-muted-foreground italic">Not yet administered</p>
      )}
    </button>
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
