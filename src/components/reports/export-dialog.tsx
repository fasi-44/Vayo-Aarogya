'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, FileText, Table, Loader2 } from 'lucide-react'
import type { ReportData } from '@/services/reports'
import { generateCSV, generateDetailedCSV, downloadCSV, generateSummaryText } from '@/services/reports'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportData: ReportData | null
}

export function ExportDialog({ open, onOpenChange, reportData }: ExportDialogProps) {
  const [exportType, setExportType] = useState<'csv' | 'detailed-csv' | 'summary'>('csv')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!reportData) return

    setLoading(true)
    try {
      const timestamp = new Date().toISOString().split('T')[0]

      switch (exportType) {
        case 'csv':
          const csv = generateCSV(reportData)
          downloadCSV(csv, `vayo-aarogya-report-${timestamp}.csv`)
          break
        case 'detailed-csv':
          const detailedCsv = generateDetailedCSV(reportData)
          downloadCSV(detailedCsv, `vayo-aarogya-detailed-report-${timestamp}.csv`)
          break
        case 'summary':
          const summary = generateSummaryText(reportData)
          const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `vayo-aarogya-summary-${timestamp}.txt`
          link.click()
          break
      }

      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose the format for your report export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={exportType} onValueChange={(v) => setExportType(v as typeof exportType)}>
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="csv" id="csv" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="csv" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Table className="w-4 h-4" />
                    Basic CSV
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export assessment list with basic information (date, name, risk level)
                  </p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="detailed-csv" id="detailed-csv" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="detailed-csv" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Table className="w-4 h-4" />
                    Detailed CSV
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export with all 20 domain scores for comprehensive analysis
                  </p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="summary" id="summary" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="summary" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="w-4 h-4" />
                    Text Summary
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export a text summary with key statistics and insights
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {reportData && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <strong>{reportData.summary.totalAssessments}</strong> assessments will be exported
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading || !reportData}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
