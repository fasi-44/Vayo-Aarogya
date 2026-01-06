'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateInput } from '@/components/ui/date-input'
import { Loader2, FileUp, AlertCircle } from 'lucide-react'
import { type SafeUser } from '@/types'
import { uploadDocument } from '@/services/documents'

interface ElderlyDocumentsDialogProps {
  open: boolean
  onClose: () => void
  elderly: SafeUser | null
  onSuccess?: () => void
}

export function ElderlyDocumentsDialog({
  open,
  onClose,
  elderly,
  onSuccess,
}: ElderlyDocumentsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    type: 'prescription' as const,
    fileUrl: '',
    fileName: '',
    mimeType: '',
    fileSize: 0,
    description: '',
    documentDate: '',
  })

  if (!elderly) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }))
      // In a real app, you would upload the file to storage (S3, GCS, etc.)
      // and get the fileUrl back. For now, we'll use a placeholder.
      const fileUrl = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        fileUrl,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!formData.title.trim()) {
        throw new Error('Document title is required')
      }
      if (!formData.fileName) {
        throw new Error('Please select a file')
      }

      const result = await uploadDocument(elderly.id, {
        title: formData.title,
        type: formData.type,
        fileUrl: formData.fileUrl,
        fileName: formData.fileName,
        mimeType: formData.mimeType,
        fileSize: formData.fileSize,
        description: formData.description || undefined,
        documentDate: formData.documentDate || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document')
      }

      setFormData({
        title: '',
        type: 'prescription',
        fileUrl: '',
        fileName: '',
        mimeType: '',
        fileSize: 0,
        description: '',
        documentDate: '',
      })

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload prescriptions, lab reports, or other medical documents for {elderly.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Prescription for Diabetes"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="lab_report">Lab Report</SelectItem>
                <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                <SelectItem value="insurance">Insurance Document</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload File *</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required
            />
            {formData.fileName && (
              <p className="text-sm text-muted-foreground">
                Selected: {formData.fileName} ({(formData.fileSize / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Document Date */}
          <div className="space-y-2">
            <Label htmlFor="documentDate">Document Date</Label>
            <DateInput
              id="documentDate"
              value={formData.documentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, documentDate: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional notes or details about this document"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
