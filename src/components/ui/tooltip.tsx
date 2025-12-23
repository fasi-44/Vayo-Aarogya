'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block group">{children}</div>
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  asChild?: boolean
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
      })
    }
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  }
)
TooltipTrigger.displayName = 'TooltipTrigger'

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, side = 'top', sideOffset = 4, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md',
        'absolute hidden group-hover:block',
        side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1',
        side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1',
        side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1',
        side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
