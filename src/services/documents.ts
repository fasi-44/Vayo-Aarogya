export interface DocumentInput {
  title: string
  type: 'prescription' | 'lab_report' | 'medical_certificate' | 'insurance' | 'other'
  fileUrl: string
  fileName: string
  mimeType: string
  fileSize: number
  description?: string
  documentDate?: string
}

export async function getElderlyDocuments(elderlyId: string) {
  try {
    const response = await fetch(
      `/api/elderly/${elderlyId}/documents`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }

    const data = await response.json()
    return { success: true, data: data.documents }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function uploadDocument(elderlyId: string, data: DocumentInput) {
  try {
    const response = await fetch(
      `/api/elderly/${elderlyId}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload document')
    }

    const result = await response.json()
    return { success: true, data: result.document }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function deleteDocument(documentId: string) {
  try {
    const response = await fetch(
      `/api/documents/${documentId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      throw new Error('Failed to delete document')
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
