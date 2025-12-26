'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
} from 'lucide-react'
import type { FollowUp } from '@/types'
import { FOLLOW_UP_TYPES, FOLLOW_UP_STATUS_COLORS } from '@/services/followups'

interface FollowUpCalendarProps {
  followUps: FollowUp[]
  onDateSelect?: (date: Date) => void
  onFollowUpClick?: (followUp: FollowUp) => void
}

export function FollowUpCalendar({
  followUps,
  onDateSelect,
  onFollowUpClick,
}: FollowUpCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    return { daysInMonth, startingDay, year, month }
  }

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getFollowUpsForDay = (day: number) => {
    const date = new Date(year, month, day)
    return followUps.filter((f) => {
      const followUpDate = new Date(f.scheduledDate)
      return (
        followUpDate.getFullYear() === date.getFullYear() &&
        followUpDate.getMonth() === date.getMonth() &&
        followUpDate.getDate() === date.getDate()
      )
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  const renderDay = (day: number) => {
    const dayFollowUps = getFollowUpsForDay(day)
    const hasScheduled = dayFollowUps.some((f) => f.status === 'scheduled')
    const hasCompleted = dayFollowUps.some((f) => f.status === 'completed')
    const hasOverdue = dayFollowUps.some(
      (f) =>
        f.status === 'scheduled' && new Date(f.scheduledDate) < new Date()
    )

    return (
      <div
        key={day}
        className={cn(
          'min-h-[80px] p-1 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors',
          isToday(day) && 'bg-primary/5'
        )}
        onClick={() => onDateSelect?.(new Date(year, month, day))}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
              isToday(day) && 'bg-primary text-white'
            )}
          >
            {day}
          </span>
          {dayFollowUps.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {dayFollowUps.length}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          {dayFollowUps.slice(0, 2).map((followUp) => {
            const statusColors =
              FOLLOW_UP_STATUS_COLORS[
                followUp.status as keyof typeof FOLLOW_UP_STATUS_COLORS
              ]
            return (
              <div
                key={followUp.id}
                className={cn(
                  'text-xs px-1 py-0.5 rounded truncate cursor-pointer',
                  statusColors?.bg,
                  statusColors?.text
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onFollowUpClick?.(followUp)
                }}
              >
                {followUp.title}
              </div>
            )
          })}
          {dayFollowUps.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{dayFollowUps.length - 2} more
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderEmptyDay = (index: number) => (
    <div
      key={`empty-${index}`}
      className="min-h-[80px] p-1 border-b border-r bg-muted/20"
    />
  )

  const days: React.ReactNode[] = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    days.push(renderEmptyDay(i))
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(renderDay(day))
  }

  // Add empty cells to complete the last week
  const remainingDays = 7 - ((startingDay + daysInMonth) % 7)
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      days.push(renderEmptyDay(daysInMonth + i))
    }
  }

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-t border-l">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-r bg-muted/30"
            >
              {day}
            </div>
          ))}
          {days}
        </div>
      </CardContent>
    </Card>
  )
}

interface FollowUpDayViewProps {
  date: Date
  followUps: FollowUp[]
  onFollowUpClick?: (followUp: FollowUp) => void
}

export function FollowUpDayView({
  date,
  followUps,
  onFollowUpClick,
}: FollowUpDayViewProps) {
  const dayFollowUps = followUps.filter((f) => {
    const followUpDate = new Date(f.scheduledDate)
    return (
      followUpDate.getFullYear() === date.getFullYear() &&
      followUpDate.getMonth() === date.getMonth() &&
      followUpDate.getDate() === date.getDate()
    )
  })

  const formatTime = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {formatDate(date)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dayFollowUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No follow-ups scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayFollowUps.map((followUp) => {
              const statusColors =
                FOLLOW_UP_STATUS_COLORS[
                  followUp.status as keyof typeof FOLLOW_UP_STATUS_COLORS
                ]

              return (
                <div
                  key={followUp.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onFollowUpClick?.(followUp)}
                >
                  <div
                    className={cn(
                      'w-2 h-full min-h-[40px] rounded-full',
                      statusColors?.bg?.replace('bg-', 'bg-')
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{followUp.title}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          statusColors?.bg,
                          statusColors?.text
                        )}
                      >
                        {followUp.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(followUp.scheduledDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {followUp.elderly?.name || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {FOLLOW_UP_TYPES[
                          followUp.type as keyof typeof FOLLOW_UP_TYPES
                        ] || followUp.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
