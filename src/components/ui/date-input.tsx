'use client'

import * as React from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative">
        <div
          className={cn(
            'relative flex h-10 w-full items-center rounded-md border border-input bg-background ring-offset-background',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            error && 'border-destructive focus-within:ring-destructive',
            className
          )}
        >
          <input
            type="date"
            ref={ref}
            className={cn(
              'flex-1 h-full bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground',
              'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'cursor-pointer',
              // Make the native calendar picker indicator cover the full width but invisible
              '[&::-webkit-calendar-picker-indicator]:absolute',
              '[&::-webkit-calendar-picker-indicator]:right-0',
              '[&::-webkit-calendar-picker-indicator]:left-0',
              '[&::-webkit-calendar-picker-indicator]:top-0',
              '[&::-webkit-calendar-picker-indicator]:bottom-0',
              '[&::-webkit-calendar-picker-indicator]:w-full',
              '[&::-webkit-calendar-picker-indicator]:h-full',
              '[&::-webkit-calendar-picker-indicator]:opacity-0',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
            {...props}
          />
          {/* Custom calendar icon at right - pointer-events-none so clicks pass through */}
          <div className="absolute right-3 text-muted-foreground pointer-events-none">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
DateInput.displayName = 'DateInput'

export { DateInput }
