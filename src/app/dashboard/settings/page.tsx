'use client'

import React, { useRef, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, QrCode } from 'lucide-react'

export default function SettingsPage() {
  const qrRef = useRef<HTMLDivElement>(null)

  const siteUrl = typeof window !== 'undefined'
    ? window.location.origin
    : ''

  const handleDownload = useCallback(() => {
    const qrCanvas = qrRef.current?.querySelector('canvas')
    if (!qrCanvas) return

    const width = 480
    const height = 640
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Top accent bar
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, '#0d9488')
    gradient.addColorStop(1, '#0ea5e9')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, 6)

    // App name
    ctx.fillStyle = '#0d9488'
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Vayo Aarogya', width / 2, 60)

    // Tagline
    ctx.fillStyle = '#64748b'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillText('Healthy Ageing Platform', width / 2, 88)

    // Separator line
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, 110)
    ctx.lineTo(width - 40, 110)
    ctx.stroke()

    // "Scan to visit" text
    ctx.fillStyle = '#334155'
    ctx.font = '600 18px system-ui, -apple-system, sans-serif'
    ctx.fillText('Scan to visit our platform', width / 2, 145)

    // QR code - draw centered with white padding and border
    const qrSize = 260
    const qrX = (width - qrSize) / 2
    const qrY = 170

    // QR border
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.strokeRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32)

    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)

    // URL
    ctx.fillStyle = '#0d9488'
    ctx.font = '14px monospace'
    ctx.fillText(siteUrl, width / 2, qrY + qrSize + 50)

    // Instructions
    ctx.fillStyle = '#94a3b8'
    ctx.font = '13px system-ui, -apple-system, sans-serif'
    ctx.fillText('Open your phone camera and point it at the QR code', width / 2, qrY + qrSize + 80)
    ctx.fillText('to get started with Vayo Aarogya.', width / 2, qrY + qrSize + 100)

    // Bottom accent bar
    ctx.fillStyle = gradient
    ctx.fillRect(0, height - 6, width, 6)

    // Footer
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px system-ui, -apple-system, sans-serif'
    ctx.fillText(`© ${new Date().getFullYear()} Vayo Aarogya - WHO ICOPE Based Elderly Care`, width / 2, height - 20)

    // Download
    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = 'vayo-aarogya-qr-code.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [siteUrl])

  return (
    <DashboardLayout title="Settings" subtitle="Application settings and configuration">
      <Card className="border-0 shadow-soft max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Application QR Code
          </CardTitle>
          <CardDescription>
            Scan this QR code to visit the Vayo Aarogya home page. Download and share it with elders, volunteers, and staff.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div ref={qrRef} className="bg-white p-4 rounded-xl border">
            <QRCodeCanvas
              value={siteUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="text-sm text-muted-foreground font-mono break-all text-center">
            {siteUrl}
          </p>

          <Button onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
