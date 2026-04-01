'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchableSelectOption {
  value: string
  label: string
  sublabel?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  allowNone?: boolean
  noneLabel?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
  disabled = false,
  allowNone = true,
  noneLabel = 'None',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(lower))
    )
  }, [options, search])

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (val: string) => {
    onValueChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Single input field - shows selected value or search text */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={open ? search : (selectedOption?.label || '')}
          placeholder={placeholder}
          readOnly={!open}
          onClick={() => { if (!disabled) { setOpen(true); setSearch('') } }}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-base',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !open && !selectedOption && 'text-muted-foreground',
            open && 'ring-2 ring-ring ring-offset-2',
          )}
        />
        {value && !open && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onValueChange('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-[200px] overflow-y-auto p-1">
            {allowNone && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                  !value && 'bg-accent'
                )}
              >
                <Check className={cn('w-4 h-4', value ? 'invisible' : 'visible')} />
                <span className="text-muted-foreground">{noneLabel}</span>
              </button>
            )}

            {filteredOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                  value === option.value && 'bg-accent'
                )}
              >
                <Check className={cn('w-4 h-4 flex-shrink-0', value === option.value ? 'visible' : 'invisible')} />
                <div className="text-left min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.sublabel && (
                    <span className="block text-xs text-muted-foreground truncate">{option.sublabel}</span>
                  )}
                </div>
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
