import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date as dd/mm/yyyy
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Format time as HH:MM
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Format date and time as dd/mm/yyyy HH:MM
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRiskLevelColor(level: 'healthy' | 'at_risk' | 'intervention') {
  const colors = {
    healthy: {
      bg: 'bg-healthy-light',
      text: 'text-healthy-dark',
      border: 'border-healthy',
      fill: 'fill-healthy',
    },
    'at_risk': {
      bg: 'bg-at-risk-light',
      text: 'text-at-risk-dark',
      border: 'border-at-risk',
      fill: 'fill-at-risk',
    },
    intervention: {
      bg: 'bg-intervention-light',
      text: 'text-intervention-dark',
      border: 'border-intervention',
      fill: 'fill-intervention',
    },
  }
  return colors[level]
}
