'use client'

// Clinical assessment PDF generator — A4 portrait, jsPDF + autoTable.
// Imported dynamically so jsPDF is never bundled for SSR.
//
// Usage:
//   import { printAssessmentPDF } from '@/lib/print/assessment-pdf'
//   await printAssessmentPDF({ assessment, reportResult, domains })
//
// Opens the generated PDF as a blob URL in a new browser tab
// (browser's native PDF viewer — no HTML page, no extra button).

import type { Assessment, AssessmentDomain } from '@/types'
import type { AssessmentResult } from '@/lib/assessment-scoring'
import { formatDate, formatTime } from '@/lib/utils'

const DOMAIN_NAMES: Record<string, string> = {
  cognitive: 'Cognitive',
  psychological: 'Psychological',
  locomotor: 'Locomotor',
  sensory: 'Sensory',
  vitality: 'Vitality',
  social: 'Social',
}

const SCALE_NAMES: Record<string, string> = {
  HMSE: 'Hindi Mental State Examination (HMSE)',
  MoCA: 'Montreal Cognitive Assessment (MoCA)',
  CAM: 'Confusion Assessment Method (CAM)',
  'PHQ-9': 'Patient Health Questionnaire-9 (PHQ-9)',
  GDS: 'Geriatric Depression Scale — Short Form (GDS-15)',
  BSS: "Beck's Suicide Intent Scale (BSS)",
  'HAM-A': 'Hamilton Anxiety Rating Scale (HAM-A)',
  BPRS: 'Brief Psychiatric Rating Scale (BPRS)',
  MNA: 'Mini Nutritional Assessment (MNA®)',
  UCLA: 'Three-Item Loneliness Scale (UCLA)',
}

const RISK_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  at_risk: 'At Risk',
  intervention: 'Needs Intervention',
}

const RISK_RGB: Record<string, [number, number, number]> = {
  healthy: [22, 163, 74],
  at_risk: [217, 119, 6],
  intervention: [220, 38, 38],
}

export interface PrintAssessmentPDFParams {
  assessment: Assessment
  reportResult: AssessmentResult | null
  domains: AssessmentDomain[]
}

export async function printAssessmentPDF({
  assessment,
  reportResult,
  domains,
}: PrintAssessmentPDFParams): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const ML = 15
  const MR = 15
  const CW = PW - ML - MR
  let y = 18

  // ── Helpers ────────────────────────────────────────────────
  const addPageIfNeeded = (needed = 12) => {
    if (y + needed > 277) { doc.addPage(); y = 18 }
  }

  const sectionTitle = (title: string) => {
    addPageIfNeeded(14)
    doc.setFillColor(230, 230, 230)
    doc.rect(ML, y, CW, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    doc.text(title.toUpperCase(), ML + 2, y + 5)
    y += 12
  }

  const labelValue = (lbl: string, val: string, x: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(lbl.toUpperCase(), x, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.text(val || '—', x, y + 5.5)
  }

  // ── Letterhead ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(30, 58, 95)
  doc.text('VAYO AAROGYA', ML, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Healthy Ageing Programme — WHO ICOPE Framework', ML, y + 5)
  doc.setFontSize(8)
  doc.text(
    `Report Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    PW - MR, y, { align: 'right' }
  )
  doc.text(
    `Assessment ID: ${assessment.id?.slice(-8).toUpperCase() ?? '—'}`,
    PW - MR, y + 5, { align: 'right' }
  )
  y += 10
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.6)
  doc.line(ML, y, PW - MR, y)
  y += 6

  // ── Report Title ───────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(20, 20, 20)
  doc.text('CLINICAL ASSESSMENT REPORT', PW / 2, y, { align: 'center' })
  y += 4
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - MR, y)
  y += 6

  // ── Patient Information ────────────────────────────────────
  sectionTitle('Patient Information')
  const half = CW / 2
  labelValue('Patient Name', assessment.subject?.name ?? '—', ML)
  labelValue('Vayo ID', (assessment.subject as { vayoId?: string })?.vayoId ?? '—', ML + half)
  y += 13
  labelValue('Assessment Date', `${formatDate(assessment.assessedAt)} at ${formatTime(assessment.assessedAt)}`, ML)
  labelValue('Status', (assessment.status ?? '—').charAt(0).toUpperCase() + (assessment.status ?? '').slice(1), ML + half)
  y += 13
  labelValue('Assessed By', assessment.assessor?.name ?? '—', ML)
  y += 13

  // ── Overall Assessment ─────────────────────────────────────
  sectionTitle('Overall Assessment')
  const rgb = RISK_RGB[assessment.overallRisk] ?? [100, 100, 100]
  doc.setDrawColor(...rgb)
  doc.setLineWidth(1)
  doc.line(ML, y, ML, y + 12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...rgb)
  doc.text(RISK_LABEL[assessment.overallRisk] ?? assessment.overallRisk, ML + 4, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  const riskDesc =
    assessment.overallRisk === 'healthy'
      ? 'No significant concerns identified across assessed domains.'
      : assessment.overallRisk === 'at_risk'
      ? 'One or more domains require monitoring and follow-up care.'
      : 'One or more domains require immediate clinical intervention.'
  doc.text(riskDesc, ML + 4, y + 11)
  y += 16

  // ── ICOPE Domain Assessment ────────────────────────────────
  sectionTitle(`ICOPE Domain Assessment (${domains.length} domains)`)
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Domain', 'Score', 'Risk Level', 'Notes']],
    body: domains.map(d => [
      DOMAIN_NAMES[d.domain] ?? d.domain,
      d.score !== undefined && d.score !== null ? String(d.score) : '—',
      RISK_LABEL[d.riskLevel] ?? d.riskLevel,
      d.notes ?? '',
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 36 },
      3: { cellWidth: CW - 40 - 18 - 36 },
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const val = data.cell.raw as string
        if (val === 'Healthy') data.cell.styles.textColor = [22, 163, 74]
        else if (val === 'At Risk') data.cell.styles.textColor = [217, 119, 6]
        else if (val === 'Needs Intervention') data.cell.styles.textColor = [220, 38, 38]
      }
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ── Clinical Scales Administered ───────────────────────────
  const savedScales = Object.entries(
    (assessment.scaleResults ?? {}) as Record<string, {
      result: { total?: number; maxTotal?: number; bandLabel?: string; delirium?: boolean }
      savedAt: string
    }>
  )
  if (savedScales.length > 0) {
    addPageIfNeeded(20)
    sectionTitle(`Clinical Scales Administered (${savedScales.length})`)
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['Scale', 'Score', 'Outcome / Interpretation', 'Date']],
      body: savedScales.map(([code, entry]) => {
        const r = entry.result
        const score =
          r.total !== undefined && r.maxTotal !== undefined
            ? `${r.total} / ${r.maxTotal}`
            : r.delirium !== undefined
            ? r.delirium ? 'Positive' : 'Negative'
            : '—'
        const outcome =
          r.bandLabel ??
          (r.delirium !== undefined ? (r.delirium ? 'Delirium positive' : 'Delirium negative') : '—')
        const date = entry.savedAt
          ? new Date(entry.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'
        return [SCALE_NAMES[code] ?? code, score, outcome, date]
      }),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 72 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: CW - 72 - 20 - 28 },
        3: { cellWidth: 28 },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ── Risk Flags ─────────────────────────────────────────────
  const riskFlags = reportResult?.riskFlags ?? []
  if (riskFlags.length > 0) {
    addPageIfNeeded(20)
    sectionTitle('Clinical Risk Flags')
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['Severity', 'Flag']],
      body: riskFlags.map(f => [
        f.severity.charAt(0).toUpperCase() + f.severity.slice(1),
        f.label,
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: CW - 30 } },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ── Clinical Recommendations ───────────────────────────────
  const actions = reportResult?.actions ?? []
  if (actions.length > 0) {
    addPageIfNeeded(20)
    sectionTitle('Clinical Recommendations')
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['Priority', 'Action']],
      body: actions.map(a => [
        a.priority.charAt(0).toUpperCase() + a.priority.slice(1),
        a.label,
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: CW - 30 } },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ── Assessment Notes ───────────────────────────────────────
  if (assessment.notes) {
    addPageIfNeeded(20)
    sectionTitle('Assessment Notes')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(assessment.notes, CW - 4)
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(250, 250, 250)
    doc.rect(ML, y, CW, Math.max(lines.length * 5 + 4, 16), 'FD')
    doc.text(lines, ML + 2, y + 5)
    y += lines.length * 5 + 8
  }

  // ── Footer on every page ───────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(ML, 287, PW - MR, 287)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')} · Vayo Aarogya Platform`, ML, 292)
    doc.text('CONFIDENTIAL — For clinical use only', PW - MR, 292, { align: 'right' })
    doc.text(`Page ${i} of ${pageCount}`, PW / 2, 292, { align: 'center' })
  }

  // ── Open in browser PDF viewer ─────────────────────────────
  const url = doc.output('bloburl')
  window.open(url as unknown as string, '_blank')
}
