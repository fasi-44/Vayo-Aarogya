'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { getRiskLevelStyles, RiskLevel } from '@/store'
import {
  User,
  Users,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  Activity,
  Phone,
  Heart,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye,
  UserPlus,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  HandHeart,
  Clock,
  HeartPulse,
  Loader2,
} from 'lucide-react'
import type { SafeUser, Assessment, FollowUp, Intervention } from '@/types'
import { getFamilyElders } from '@/services/users'

// Extended type for elder with relations
interface ElderWithData extends SafeUser {
  assessments?: Assessment[]
  interventions?: Intervention[]
  followUps?: FollowUp[]
  latestAssessment?: Assessment | null
  assignedVolunteerData?: SafeUser | null
}

interface FamilyDashboardProps {
  familyMember: SafeUser
  linkedElderly?: SafeUser | null
  linkedElders?: ElderWithData[]
  latestAssessment?: Assessment | null
  upcomingFollowUps?: FollowUp[]
  activeInterventions?: Intervention[]
  assignedVolunteer?: SafeUser | null
}

export function FamilyDashboard({
  familyMember,
  linkedElderly,
  linkedElders: propLinkedElders,
}: FamilyDashboardProps) {
  const router = useRouter()
  const [elders, setElders] = useState<ElderWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [allFollowUps, setAllFollowUps] = useState<(FollowUp & { elderName: string })[]>([])
  const [allInterventions, setAllInterventions] = useState<(Intervention & { elderName: string })[]>([])

  // Fetch elders and their data
  useEffect(() => {
    async function loadElders() {
      setLoading(true)
      try {
        let eldersList: SafeUser[] = []

        if (propLinkedElders && propLinkedElders.length > 0) {
          eldersList = propLinkedElders
        } else if (linkedElderly) {
          eldersList = [linkedElderly]
        } else {
          const result = await getFamilyElders()
          if (result.success && result.data) {
            eldersList = result.data
          }
        }

        // Fetch additional data for each elder
        const eldersWithData = await Promise.all(
          eldersList.map(async (elder) => {
            try {
              const [assessmentsRes, interventionsRes, followUpsRes] = await Promise.all([
                fetch(`/api/assessments?elderlyId=${elder.id}&limit=5`).then(r => r.json()),
                fetch(`/api/interventions?elderlyId=${elder.id}`).then(r => r.json()),
                fetch(`/api/followups?elderlyId=${elder.id}`).then(r => r.json()),
              ])

              let volunteerData = null
              if (elder.assignedVolunteer) {
                const volRes = await fetch(`/api/users/${elder.assignedVolunteer}`).then(r => r.json())
                if (volRes.success) volunteerData = volRes.data
              }

              return {
                ...elder,
                assessments: assessmentsRes.success ? assessmentsRes.data?.assessments || [] : [],
                interventions: interventionsRes.success ? interventionsRes.data?.interventions || [] : [],
                followUps: followUpsRes.success ? followUpsRes.data?.followUps || [] : [],
                latestAssessment: assessmentsRes.success ? assessmentsRes.data?.assessments?.[0] || null : null,
                assignedVolunteerData: volunteerData,
              }
            } catch {
              return { ...elder, assessments: [], interventions: [], followUps: [], latestAssessment: null }
            }
          })
        )

        setElders(eldersWithData)

        // Aggregate follow-ups and interventions
        const followUps: (FollowUp & { elderName: string })[] = []
        const interventions: (Intervention & { elderName: string })[] = []

        eldersWithData.forEach(elder => {
          elder.followUps?.forEach((f: FollowUp) => {
            if (f.status === 'scheduled' && new Date(f.scheduledDate) >= new Date()) {
              followUps.push({ ...f, elderName: elder.name })
            }
          })
          elder.interventions?.forEach((i: Intervention) => {
            if (i.status === 'pending' || i.status === 'in_progress') {
              interventions.push({ ...i, elderName: elder.name })
            }
          })
        })

        // Sort by date
        followUps.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        interventions.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
        })

        setAllFollowUps(followUps)
        setAllInterventions(interventions)
      } catch (error) {
        console.error('Error loading elders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadElders()
  }, [propLinkedElders, linkedElderly])

  const getRiskLevel = (assessment: Assessment | null | undefined): RiskLevel => {
    if (!assessment) return 'healthy'
    const riskLevel = assessment.overallRisk
    if (riskLevel === 'at_risk') return 'at_risk'
    if (riskLevel === 'intervention') return 'intervention'
    return 'healthy'
  }

  const getRiskBadge = (riskLevel: RiskLevel) => {
    const styles = getRiskLevelStyles(riskLevel)
    const labels: Record<RiskLevel, string> = {
      healthy: 'Healthy',
      at_risk: 'At Risk',
      intervention: 'Needs Care',
    }
    const icons: Record<RiskLevel, React.ReactNode> = {
      healthy: <CheckCircle2 className="w-3 h-3 mr-1" />,
      at_risk: <AlertCircle className="w-3 h-3 mr-1" />,
      intervention: <AlertTriangle className="w-3 h-3 mr-1" />,
    }
    return (
      <Badge variant="outline" className={cn('border flex items-center', styles?.badge)}>
        {icons[riskLevel]}
        {labels[riskLevel]}
      </Badge>
    )
  }

  // Calculate stats
  const stats = {
    totalElders: elders.length,
    healthyElders: elders.filter(e => getRiskLevel(e.latestAssessment) === 'healthy').length,
    atRiskElders: elders.filter(e => getRiskLevel(e.latestAssessment) === 'at_risk').length,
    interventionElders: elders.filter(e => getRiskLevel(e.latestAssessment) === 'intervention').length,
    upcomingFollowUps: allFollowUps.length,
    activeInterventions: allInterventions.length,
  }

  // Get elders needing attention (at-risk or intervention)
  const eldersNeedingAttention = elders.filter(e => {
    const risk = getRiskLevel(e.latestAssessment)
    return risk === 'at_risk' || risk === 'intervention'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (elders.length === 0) {
    return (
      <Card className="border-0 shadow-soft">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Welcome, {familyMember.name}!</h2>
          <p className="text-muted-foreground mb-6">
            You haven't added any elderly family members yet.
            Add your family member to start tracking their health journey.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/my-elders?action=add">
              <UserPlus className="w-5 h-5 mr-2" />
              Add Elder Record
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-0 shadow-soft bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-blue-200 text-blue-700 text-xl">
                  {getInitials(familyMember.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <h2 className="text-xl font-bold text-foreground">{familyMember.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Caring for {elders.length} elder{elders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/my-elders">
                  <Users className="w-4 h-4 mr-2" />
                  View All Elders
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/my-elders?action=add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Elder
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalElders}</p>
                <p className="text-xs text-muted-foreground">Total Elders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-healthy/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-healthy" />
              </div>
              <div>
                <p className="text-2xl font-bold text-healthy-dark">{stats.healthyElders}</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-at-risk/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-at-risk" />
              </div>
              <div>
                <p className="text-2xl font-bold text-at-risk-dark">{stats.atRiskElders}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-intervention/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-intervention" />
              </div>
              <div>
                <p className="text-2xl font-bold text-intervention-dark">{stats.interventionElders}</p>
                <p className="text-xs text-muted-foreground">Need Care</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.upcomingFollowUps}</p>
                <p className="text-xs text-muted-foreground">Follow-ups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.activeInterventions}</p>
                <p className="text-xs text-muted-foreground">Active Care</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts - Elders Needing Attention */}
      {eldersNeedingAttention.length > 0 && (
        <Card className="border-0 shadow-soft border-l-4 border-l-intervention">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-intervention-dark">
              <AlertTriangle className="w-5 h-5" />
              Elders Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {eldersNeedingAttention.map((elder) => {
                const riskLevel = getRiskLevel(elder.latestAssessment)
                return (
                  <div
                    key={elder.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all",
                      riskLevel === 'intervention' && "bg-intervention/5 border-intervention/30",
                      riskLevel === 'at_risk' && "bg-at-risk/5 border-at-risk/30"
                    )}
                    onClick={() => router.push(`/dashboard/my-elders?elder=${elder.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn(
                            "text-sm",
                            riskLevel === 'intervention' && "bg-intervention/20 text-intervention-dark",
                            riskLevel === 'at_risk' && "bg-at-risk/20 text-at-risk-dark"
                          )}>
                            {getInitials(elder.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{elder.name}</p>
                          {elder.age && (
                            <p className="text-xs text-muted-foreground">{elder.age} years</p>
                          )}
                        </div>
                      </div>
                      {getRiskBadge(riskLevel)}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Elders Quick View */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">My Elders</CardTitle>
                <CardDescription>Quick overview of all your family members</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/my-elders">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {elders.slice(0, 4).map((elder) => {
                  const riskLevel = getRiskLevel(elder.latestAssessment)
                  const upcomingCount = elder.followUps?.filter(f =>
                    f.status === 'scheduled' && new Date(f.scheduledDate) >= new Date()
                  ).length || 0
                  const activeCount = elder.interventions?.filter(i =>
                    i.status === 'pending' || i.status === 'in_progress'
                  ).length || 0

                  return (
                    <div
                      key={elder.id}
                      className="p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group"
                      onClick={() => router.push(`/dashboard/my-elders?elder=${elder.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className={cn(
                              "text-lg",
                              riskLevel === 'healthy' && "bg-healthy/20 text-healthy-dark",
                              riskLevel === 'at_risk' && "bg-at-risk/20 text-at-risk-dark",
                              riskLevel === 'intervention' && "bg-intervention/20 text-intervention-dark"
                            )}>
                              {getInitials(elder.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold group-hover:text-primary transition-colors">
                              {elder.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {elder.vayoId && <span>{elder.vayoId}</span>}
                              {elder.age && <span>• {elder.age} years</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {upcomingCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              {activeCount}
                            </span>
                          </div>
                          {getRiskBadge(riskLevel)}
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      {/* Volunteer Info */}
                      {elder.assignedVolunteerData && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <HandHeart className="w-4 h-4 text-teal-600" />
                            <span className="text-muted-foreground">Volunteer:</span>
                            <span className="font-medium">{elder.assignedVolunteerData.name}</span>
                          </div>
                          {elder.assignedVolunteerData.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a href={`tel:${elder.assignedVolunteerData.phone}`}>
                                <Phone className="w-4 h-4 mr-1" />
                                Call
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {elders.length > 4 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/my-elders">
                      View All {elders.length} Elders
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Follow-ups */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Upcoming Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allFollowUps.length > 0 ? (
                <div className="space-y-3">
                  {allFollowUps.slice(0, 5).map((followUp) => (
                    <div
                      key={followUp.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/my-elders`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{followUp.elderName}</span>
                        <Badge variant="outline" className="text-xs">{followUp.type || 'Follow-up'}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(followUp.scheduledDate)}
                      </div>
                    </div>
                  ))}
                  {allFollowUps.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{allFollowUps.length - 5} more scheduled
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-healthy/50" />
                  <p className="text-sm">No upcoming follow-ups</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Interventions */}
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Active Care Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allInterventions.length > 0 ? (
                <div className="space-y-3">
                  {allInterventions.slice(0, 5).map((intervention) => (
                    <div
                      key={intervention.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/my-elders`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{intervention.elderName}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            intervention.priority === 'high' && 'bg-intervention/10 text-intervention border-intervention/30',
                            intervention.priority === 'medium' && 'bg-at-risk/10 text-at-risk border-at-risk/30',
                            intervention.priority === 'low' && 'bg-healthy/10 text-healthy border-healthy/30'
                          )}
                        >
                          {intervention.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{intervention.title}</p>
                      {intervention.domain && (
                        <p className="text-xs text-muted-foreground mt-1">{intervention.domain}</p>
                      )}
                    </div>
                  ))}
                  {allInterventions.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{allInterventions.length - 5} more active
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-healthy/50" />
                  <p className="text-sm">No active care plans</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/my-elders">
                <Users className="w-4 h-4 mr-2" />
                Manage Elders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/my-elders?tab=assessments">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                View Assessments
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/profile">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
