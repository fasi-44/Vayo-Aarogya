'use client'

// Elder Summary PDF — A4 portrait, jsPDF + autoTable.
// One PDF per elder covering all their completed assessments.
// Usage:
//   import { printElderSummaryPDF } from '@/lib/print/elder-summary-pdf'
//   await printElderSummaryPDF({ elder, assessments })

import type { Assessment } from '@/types'
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

export interface ElderInfo {
  id: string
  name: string
  vayoId?: string
  age?: number
  gender?: string
  email?: string
  phone?: string
  villageName?: string
  talukName?: string
  districtName?: string
  stateName?: string
}

export interface PrintElderSummaryPDFParams {
  elder: ElderInfo
  assessments: Assessment[]
}

export async function printElderSummaryPDF({
  elder,
  assessments,
}: PrintElderSummaryPDFParams): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const ML = 15
  const MR = 15
  const CW = PW - ML - MR
  let y = 18

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

  const labelValue = (lbl: string, val: string, x: number, colW?: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(lbl.toUpperCase(), x, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    if (colW) {
      const lines = doc.splitTextToSize(val || '—', colW - 2)
      doc.text(lines[0] || '—', x, y + 5.5)
    } else {
      doc.text(val || '—', x, y + 5.5)
    }
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
  doc.text(`Patient Summary Report`, PW - MR, y + 5, { align: 'right' })
  y += 10
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.6)
  doc.line(ML, y, PW - MR, y)
  y += 6

  // ── Report Title ───────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(20, 20, 20)
  doc.text('PATIENT ASSESSMENT SUMMARY', PW / 2, y, { align: 'center' })
  y += 4
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - MR, y)
  y += 6

  // ── Patient Information ────────────────────────────────────
  sectionTitle('Patient Information')
  const half = CW / 2
  labelValue('Patient Name', elder.name ?? '—', ML)
  labelValue('Vayo ID', elder.vayoId ?? '—', ML + half)
  y += 13
  const ageGender = [elder.age ? `${elder.age} years` : '', elder.gender ? elder.gender.charAt(0).toUpperCase() + elder.gender.slice(1) : ''].filter(Boolean).join(' · ')
  labelValue('Age / Gender', ageGender || '—', ML)
  const location = [elder.villageName, elder.talukName, elder.districtName, elder.stateName].filter(Boolean).join(', ')
  labelValue('Location', location || '—', ML + half, half)
  y += 13

  // ── Assessment Overview ────────────────────────────────────
  const completed = assessments.filter(a => a.status === 'completed')
  sectionTitle(`Assessment History (${completed.length} completed assessments)`)

  if (completed.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('No completed assessments on record.', ML + 2, y)
    y += 10
  }

  // ── Each Assessment ────────────────────────────────────────
  const sorted = [...completed].sort(
    (a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime()
  )

  sorted.forEach((assessment, idx) => {
    addPageIfNeeded(30)

    // Assessment header bar — two-row layout to prevent overlap
    const rgb = RISK_RGB[assessment.overallRisk] ?? [100, 100, 100]
    const riskText = RISK_LABEL[assessment.overallRisk] ?? assessment.overallRisk
    doc.setFillColor(30, 58, 95)
    doc.rect(ML, y, CW, 13, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    // Row 1: assessment number (left) · risk level (right)
    doc.text(`Assessment #${sorted.length - idx}`, ML + 3, y + 5)
    doc.text(riskText, PW - MR - 3, y + 5, { align: 'right' })
    // Row 2: date + time (left) · assessor (right)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${formatDate(assessment.assessedAt)} at ${formatTime(assessment.assessedAt)}`, ML + 3, y + 10.5)
    doc.text(`By: ${assessment.assessor?.name ?? '—'}  |  ID: ${assessment.id?.slice(-8).toUpperCase() ?? '—'}`, PW - MR - 3, y + 10.5, { align: 'right' })
    y += 17

    // Domain table
    const domains = assessment.domains || []
    if (domains.length > 0) {
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
        styles: { fontSize: 8.5, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        columnStyles: {
          0: { cellWidth: 38 },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 36 },
          3: { cellWidth: CW - 38 - 16 - 36 },
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
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
    }

    // Scales table
    const savedScales = Object.entries(
      (assessment.scaleResults ?? {}) as Record<string, {
        result: { total?: number; maxTotal?: number; bandLabel?: string; delirium?: boolean }
        savedAt: string
      }>
    )
    if (savedScales.length > 0) {
      addPageIfNeeded(18)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      doc.text('Clinical Scales', ML + 1, y)
      y += 4
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
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [60, 90, 130], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: CW - 70 - 18 - 26 },
          3: { cellWidth: 26 },
        },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
    }

    // Notes
    if (assessment.notes) {
      addPageIfNeeded(14)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      const lines = doc.splitTextToSize(`Notes: ${assessment.notes}`, CW - 4)
      doc.text(lines, ML + 2, y)
      y += lines.length * 4.5 + 4
    }

    // Divider between assessments
    if (idx < sorted.length - 1) {
      addPageIfNeeded(6)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(ML, y, PW - MR, y)
      y += 6
    }
  })

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

  const url = doc.output('bloburl')
  window.open(url as unknown as string, '_blank')
}
