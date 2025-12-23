'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-slate-500" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">You're Offline</h1>
          <p className="text-slate-600">
            It seems you don't have an internet connection right now. Please check your connection and try again.
          </p>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">VA</span>
            </div>
            <div className="text-left">
              <h2 className="font-semibold text-slate-800">Vayo Aarogya</h2>
              <p className="text-sm text-slate-500">Healthy Ageing Platform</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Some features require an internet connection. Once you're back online, your data will sync automatically.
          </p>
        </div>

        {/* Retry Button */}
        <Button onClick={handleRetry} size="lg" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>

        {/* Tips */}
        <div className="text-left bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h3 className="font-medium text-amber-800 mb-2">Tips:</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Check if Wi-Fi or mobile data is enabled</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Restart your device if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
