import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
