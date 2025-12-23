'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore, useHydration, getRiskLevelStyles, RiskLevel } from '@/store'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { getFamilyElders } from '@/services/users'
import { createElderly, type ElderlyFormData } from '@/services/elderly'
import { ElderlyForm } from '@/components/elderly'
import type { SafeUser, Assessment, Intervention, FollowUp } from '@/types'
import {
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Plus,
  Loader2,
  HeartPulse,
  ArrowRight,
  ChevronRight,
  BarChart3,
  HandHeart,
  FileText,
} from 'lucide-react'

// Elder with extended data
interface ElderWithData extends SafeUser {
  assessments?: Assessment[]
  interventions?: Intervention[]
  followUps?: FollowUp[]
  latestAssessment?: Assessment | null
  assignedVolunteerData?: SafeUser | null
}

// Helper to calculate assessment stats
const enhanceAssessment = (assessment: Assessment): Assessment => {
  const domains = assessment.domains || []
  return {
    ...assessment,
    totalScore: assessment.cumulativeScore || 0,
    domainsHealthy: domains.filter(d => d.riskLevel === 'healthy').length,
    domainsAtRisk: domains.filter(d => d.riskLevel === 'at_risk').length,
    domainsIntervention: domains.filter(d => d.riskLevel === 'intervention').length,
  }
}

export default function MyEldersPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="My Elders" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    }>
      <MyEldersPageContent />
    </Suspense>
  )
}

function MyEldersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const hydrated = useHydration()

  const [elders, setElders] = useState<ElderWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedElder, setSelectedElder] = useState<ElderWithData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Fetch elders and their data
  const fetchElders = useCallback(async () => {
    if (!hydrated || !user) return

    try {
      const result = await getFamilyElders()
      if (result.success && result.data) {
        // Fetch additional data for each elder
        const eldersWithData = await Promise.all(
          result.data.map(async (elder) => {
            const [assessmentsRes, interventionsRes, followUpsRes] = await Promise.all([
              fetch(`/api/assessments?elderlyId=${elder.id}&limit=10`).then(r => r.json()),
              fetch(`/api/interventions?elderlyId=${elder.id}`).then(r => r.json()),
              fetch(`/api/followups?elderlyId=${elder.id}`).then(r => r.json()),
            ])

            let volunteerData = null
            if (elder.assignedVolunteer) {
              const volRes = await fetch(`/api/users/${elder.assignedVolunteer}`).then(r => r.json())
              if (volRes.success) volunteerData = volRes.data
            }

            const rawAssessments = assessmentsRes.success ? assessmentsRes.data?.assessments || [] : []
            const assessments = rawAssessments.map(enhanceAssessment)

            return {
              ...elder,
              assessments,
              interventions: interventionsRes.success ? interventionsRes.data?.interventions || [] : [],
              followUps: followUpsRes.success ? followUpsRes.data?.followUps || [] : [],
              latestAssessment: assessments[0] || null,
              assignedVolunteerData: volunteerData,
            }
          })
        )
        setElders(eldersWithData)

        // Check if we should open a specific elder from URL
        const elderId = searchParams.get('elder')
        if (elderId) {
          const elder = eldersWithData.find(e => e.id === elderId)
          if (elder) {
            setSelectedElder(elder)
            setDetailsOpen(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch elders:', error)
    } finally {
      setLoading(false)
    }
  }, [hydrated, user, searchParams])

  // Initial fetch
  useEffect(() => {
    fetchElders()
  }, [fetchElders])

  // Handle URL action parameter
  useEffect(() => {
    const action = searchParams.get('action')
    if (hydrated && action === 'add') {
      setIsFormOpen(true)
    }
  }, [hydrated, searchParams])

  // Handle form submission
  const handleFormSubmit = async (data: ElderlyFormData) => {
    try {
      // Auto-assign family member
      const createData = { ...data }
      if (user?.role === 'family') {
        createData.assignedFamily = user.id
      }

      const result = await createElderly(createData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to register elder')
      }

      // Refresh the list
      setLoading(true)
      await fetchElders()
    } catch (err) {
      throw err
    }
  }

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false)
    // Clear URL params
    const action = searchParams.get('action')
    if (action) {
      router.replace('/dashboard/my-elders')
    }
  }

  const handleAddElder = () => {
    setIsFormOpen(true)
  }

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

  const getUpcomingFollowUps = (elder: ElderWithData) => {
    return elder.followUps?.filter(f =>
      f.status === 'scheduled' && new Date(f.scheduledDate) >= new Date()
    ).slice(0, 3) || []
  }

  const getActiveInterventions = (elder: ElderWithData) => {
    return elder.interventions?.filter(i =>
      i.status === 'pending' || i.status === 'in_progress'
    ).slice(0, 3) || []
  }

  const handleViewElder = (elder: ElderWithData) => {
    setSelectedElder(elder)
    setDetailsOpen(true)
    setActiveTab('overview')
  }

  if (!hydrated || loading) {
    return (
      <DashboardLayout title="My Elders" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="My Elders"
      subtitle="Monitor and manage your family members' health"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {elders.length} Elder{elders.length !== 1 ? 's' : ''} Linked
          </Badge>
        </div>
        <Button onClick={handleAddElder}>
          <Plus className="w-4 h-4 mr-2" />
          Add Elder
        </Button>
      </div>

      {/* Elders List */}
      {elders.length === 0 ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Elders Linked</h3>
            <p className="text-muted-foreground mb-6">
              You haven't added any elderly family members yet. Add an elder to start monitoring their health.
            </p>
            <Button onClick={handleAddElder}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Elder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elders.map((elder) => {
            const riskLevel = getRiskLevel(elder.latestAssessment)
            const upcomingFollowUps = getUpcomingFollowUps(elder)
            const activeInterventions = getActiveInterventions(elder)

            return (
              <Card
                key={elder.id}
                className={cn(
                  "border-0 shadow-soft hover:shadow-soft-md transition-all cursor-pointer group",
                  riskLevel === 'intervention' && "ring-2 ring-intervention/30",
                  riskLevel === 'at_risk' && "ring-2 ring-at-risk/30"
                )}
                onClick={() => handleViewElder(elder)}
              >
                <CardContent className="p-5">
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14 ring-2 ring-background">
                        <AvatarFallback className={cn(
                          "text-lg font-semibold",
                          riskLevel === 'healthy' && "bg-healthy/20 text-healthy-dark",
                          riskLevel === 'at_risk' && "bg-at-risk/20 text-at-risk-dark",
                          riskLevel === 'intervention' && "bg-intervention/20 text-intervention-dark"
                        )}>
                          {getInitials(elder.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {elder.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {elder.age && <span>{elder.age} years</span>}
                          {elder.gender && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {elder.gender}
                            </Badge>
                          )}
                        </div>
                        {elder.vayoId && (
                          <span className="text-xs text-muted-foreground">{elder.vayoId}</span>
                        )}
                      </div>
                    </div>
                    {getRiskBadge(riskLevel)}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{elder.assessments?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Assessments</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-lg font-bold text-foreground">{upcomingFollowUps.length}</p>
                      <p className="text-xs text-muted-foreground">Follow-ups</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{activeInterventions.length}</p>
                      <p className="text-xs text-muted-foreground">Active Care</p>
                    </div>
                  </div>

                  {/* Volunteer Info */}
                  {elder.assignedVolunteerData && (
                    <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg mb-3">
                      <HandHeart className="w-4 h-4 text-teal-600" />
                      <span className="text-sm text-teal-700">
                        Volunteer: {elder.assignedVolunteerData.name}
                      </span>
                    </div>
                  )}

                  {/* Alerts */}
                  {riskLevel === 'intervention' && (
                    <div className="flex items-center gap-2 p-2 bg-intervention/10 rounded-lg mb-3">
                      <AlertTriangle className="w-4 h-4 text-intervention" />
                      <span className="text-sm text-intervention-dark">Requires immediate attention</span>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button variant="outline" className="w-full mt-2 group-hover:bg-primary group-hover:text-white transition-colors">
                    View Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Elder Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              {selectedElder && (
                <>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedElder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{selectedElder.name}</span>
                    {selectedElder.vayoId && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({selectedElder.vayoId})
                      </span>
                    )}
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              View health details, assessments, and care plans
            </DialogDescription>
          </DialogHeader>

          {selectedElder && (
            <div className="flex-1 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                  <TabsTrigger value="interventions">Care Plans</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Elder Info */}
                  <Card className="border-0 shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {selectedElder.age && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{selectedElder.age} years old</span>
                            {selectedElder.gender && (
                              <Badge variant="outline" className="capitalize">{selectedElder.gender}</Badge>
                            )}
                          </div>
                        )}
                        {selectedElder.phone && (
                          <a href={`tel:${selectedElder.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <Phone className="w-4 h-4" />
                            {selectedElder.phone}
                          </a>
                        )}
                        {selectedElder.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {selectedElder.email}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(selectedElder.villageName || selectedElder.districtName) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {[selectedElder.villageName, selectedElder.talukName, selectedElder.districtName]
                              .filter(Boolean).join(', ')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Registered: {formatDate(selectedElder.createdAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Status */}
                  <Card className="border-0 shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Current Health Status</span>
                        {getRiskBadge(getRiskLevel(selectedElder.latestAssessment))}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedElder.latestAssessment ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Last assessed on {formatDate(selectedElder.latestAssessment.assessedAt || selectedElder.latestAssessment.createdAt)}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-muted/50 rounded-lg text-center">
                              <p className="text-2xl font-bold text-primary">
                                {selectedElder.latestAssessment.totalScore || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Total Score</p>
                            </div>
                            <div className="p-3 bg-healthy/10 rounded-lg text-center">
                              <p className="text-2xl font-bold text-healthy-dark">
                                {selectedElder.latestAssessment.domainsHealthy || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Healthy</p>
                            </div>
                            <div className="p-3 bg-at-risk/10 rounded-lg text-center">
                              <p className="text-2xl font-bold text-at-risk-dark">
                                {selectedElder.latestAssessment.domainsAtRisk || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">At Risk</p>
                            </div>
                            <div className="p-3 bg-intervention/10 rounded-lg text-center">
                              <p className="text-2xl font-bold text-intervention-dark">
                                {selectedElder.latestAssessment.domainsIntervention || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Need Care</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No assessments recorded yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Volunteer Info */}
                  {selectedElder.assignedVolunteerData && (
                    <Card className="border-0 shadow-soft">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Assigned Volunteer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-teal-100 text-teal-700">
                              {getInitials(selectedElder.assignedVolunteerData.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{selectedElder.assignedVolunteerData.name}</p>
                            {selectedElder.assignedVolunteerData.phone && (
                              <a href={`tel:${selectedElder.assignedVolunteerData.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {selectedElder.assignedVolunteerData.phone}
                              </a>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${selectedElder.assignedVolunteerData.phone}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Assessments Tab */}
                <TabsContent value="assessments" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Assessment History</CardTitle>
                      <CardDescription>
                        {selectedElder.assessments?.length || 0} assessments recorded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedElder.assessments && selectedElder.assessments.length > 0 ? (
                        <div className="space-y-3">
                          {selectedElder.assessments.map((assessment, index) => {
                            const riskLevel = getRiskLevel(assessment)
                            const prevAssessment = selectedElder.assessments?.[index + 1]
                            const scoreDiff = prevAssessment
                              ? (assessment.totalScore || 0) - (prevAssessment.totalScore || 0)
                              : 0

                            return (
                              <div
                                key={assessment.id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center",
                                      riskLevel === 'healthy' && "bg-healthy/20",
                                      riskLevel === 'at_risk' && "bg-at-risk/20",
                                      riskLevel === 'intervention' && "bg-intervention/20"
                                    )}>
                                      <ClipboardCheck className={cn(
                                        "w-5 h-5",
                                        riskLevel === 'healthy' && "text-healthy",
                                        riskLevel === 'at_risk' && "text-at-risk",
                                        riskLevel === 'intervention' && "text-intervention"
                                      )} />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Assessment #{selectedElder.assessments!.length - index}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {formatDate(assessment.assessedAt || assessment.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {scoreDiff !== 0 && (
                                      <div className={cn(
                                        "flex items-center gap-1 text-sm",
                                        scoreDiff < 0 ? "text-healthy" : "text-intervention"
                                      )}>
                                        {scoreDiff < 0 ? (
                                          <TrendingDown className="w-4 h-4" />
                                        ) : (
                                          <TrendingUp className="w-4 h-4" />
                                        )}
                                        {Math.abs(scoreDiff)} pts
                                      </div>
                                    )}
                                    {getRiskBadge(riskLevel)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                  <span className="text-muted-foreground">
                                    Score: <strong>{assessment.totalScore || 0}</strong>
                                  </span>
                                  <span className="text-healthy">
                                    {assessment.domainsHealthy || 0} healthy
                                  </span>
                                  <span className="text-at-risk">
                                    {assessment.domainsAtRisk || 0} at risk
                                  </span>
                                  <span className="text-intervention">
                                    {assessment.domainsIntervention || 0} need care
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No assessments recorded yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Follow-ups Tab */}
                <TabsContent value="followups" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Scheduled Follow-ups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedElder.followUps && selectedElder.followUps.length > 0 ? (
                        <div className="space-y-3">
                          {selectedElder.followUps.map((followUp) => (
                            <div
                              key={followUp.id}
                              className="p-4 border rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    followUp.status === 'completed' && "bg-healthy/20",
                                    followUp.status === 'scheduled' && "bg-primary/20",
                                    followUp.status === 'missed' && "bg-intervention/20"
                                  )}>
                                    <Calendar className={cn(
                                      "w-5 h-5",
                                      followUp.status === 'completed' && "text-healthy",
                                      followUp.status === 'scheduled' && "text-primary",
                                      followUp.status === 'missed' && "text-intervention"
                                    )} />
                                  </div>
                                  <div>
                                    <p className="font-medium">{followUp.type || 'Follow-up'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(followUp.scheduledDate)}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                  followUp.status === 'completed' && "bg-healthy/10 text-healthy border-healthy/30",
                                  followUp.status === 'scheduled' && "bg-primary/10 text-primary border-primary/30",
                                  followUp.status === 'missed' && "bg-intervention/10 text-intervention border-intervention/30"
                                )}>
                                  {followUp.status}
                                </Badge>
                              </div>
                              {followUp.notes && (
                                <p className="text-sm text-muted-foreground mt-2">{followUp.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No follow-ups scheduled</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Interventions Tab */}
                <TabsContent value="interventions" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Care Plans & Interventions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedElder.interventions && selectedElder.interventions.length > 0 ? (
                        <div className="space-y-3">
                          {selectedElder.interventions.map((intervention) => (
                            <div
                              key={intervention.id}
                              className="p-4 border rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    intervention.priority === 'high' && "bg-intervention/20",
                                    intervention.priority === 'medium' && "bg-at-risk/20",
                                    intervention.priority === 'low' && "bg-healthy/20"
                                  )}>
                                    <Activity className={cn(
                                      "w-5 h-5",
                                      intervention.priority === 'high' && "text-intervention",
                                      intervention.priority === 'medium' && "text-at-risk",
                                      intervention.priority === 'low' && "text-healthy"
                                    )} />
                                  </div>
                                  <div>
                                    <p className="font-medium">{intervention.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {intervention.domain && `${intervention.domain} • `}
                                      {formatDate(intervention.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={cn(
                                    intervention.priority === 'high' && "bg-intervention/10 text-intervention",
                                    intervention.priority === 'medium' && "bg-at-risk/10 text-at-risk",
                                    intervention.priority === 'low' && "bg-healthy/10 text-healthy"
                                  )}>
                                    {intervention.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {intervention.status}
                                  </Badge>
                                </div>
                              </div>
                              {intervention.description && (
                                <p className="text-sm text-muted-foreground mt-2">{intervention.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No interventions recorded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Summary Tab with Charts */}
                <TabsContent value="summary" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Health Progress Summary
                      </CardTitle>
                      <CardDescription>
                        Assessment trends and comparison over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedElder.assessments && selectedElder.assessments.length > 1 ? (
                        <div className="space-y-6">
                          {/* Score Trend */}
                          <div>
                            <h4 className="text-sm font-medium mb-3">Score Trend</h4>
                            <div className="flex items-end gap-2 h-32">
                              {selectedElder.assessments.slice(0, 10).reverse().map((assessment, index) => {
                                const maxScore = 40 // Assuming max score
                                const height = ((assessment.totalScore || 0) / maxScore) * 100
                                const riskLevel = getRiskLevel(assessment)
                                return (
                                  <div key={assessment.id} className="flex-1 flex flex-col items-center">
                                    <div
                                      className={cn(
                                        "w-full rounded-t transition-all",
                                        riskLevel === 'healthy' && "bg-healthy",
                                        riskLevel === 'at_risk' && "bg-at-risk",
                                        riskLevel === 'intervention' && "bg-intervention"
                                      )}
                                      style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                    <span className="text-xs text-muted-foreground mt-1">
                                      #{index + 1}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Assessment History (oldest to newest)
                            </p>
                          </div>

                          {/* Comparison */}
                          <div>
                            <h4 className="text-sm font-medium mb-3">Latest vs Previous</h4>
                            {selectedElder.assessments.length >= 2 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Previous</p>
                                  <p className="text-2xl font-bold">
                                    {selectedElder.assessments[1]?.totalScore || 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(selectedElder.assessments[1]?.assessedAt || selectedElder.assessments[1]?.createdAt)}
                                  </p>
                                </div>
                                <div className="p-4 bg-primary/10 rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Latest</p>
                                  <p className="text-2xl font-bold text-primary">
                                    {selectedElder.assessments[0]?.totalScore || 0}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(selectedElder.assessments[0]?.assessedAt || selectedElder.assessments[0]?.createdAt)}
                                  </p>
                                </div>
                              </div>
                            )}
                            {(() => {
                              const latest = selectedElder.assessments[0]?.totalScore || 0
                              const previous = selectedElder.assessments[1]?.totalScore || 0
                              const diff = latest - previous
                              if (diff === 0) return (
                                <div className="flex items-center justify-center gap-2 mt-3 text-muted-foreground">
                                  <Minus className="w-4 h-4" />
                                  No change
                                </div>
                              )
                              return (
                                <div className={cn(
                                  "flex items-center justify-center gap-2 mt-3",
                                  diff < 0 ? "text-healthy" : "text-intervention"
                                )}>
                                  {diff < 0 ? (
                                    <>
                                      <TrendingDown className="w-4 h-4" />
                                      Improved by {Math.abs(diff)} points
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="w-4 h-4" />
                                      Increased by {diff} points
                                    </>
                                  )}
                                </div>
                              )
                            })()}
                          </div>

                          {/* Domain Distribution */}
                          <div>
                            <h4 className="text-sm font-medium mb-3">Current Domain Status</h4>
                            {selectedElder.latestAssessment && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                                    <div
                                      className="bg-healthy h-full"
                                      style={{ width: `${((selectedElder.latestAssessment.domainsHealthy || 0) / 20) * 100}%` }}
                                    />
                                    <div
                                      className="bg-at-risk h-full"
                                      style={{ width: `${((selectedElder.latestAssessment.domainsAtRisk || 0) / 20) * 100}%` }}
                                    />
                                    <div
                                      className="bg-intervention h-full"
                                      style={{ width: `${((selectedElder.latestAssessment.domainsIntervention || 0) / 20) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-healthy rounded" />
                                    <span>Healthy ({selectedElder.latestAssessment.domainsHealthy || 0})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-at-risk rounded" />
                                    <span>At Risk ({selectedElder.latestAssessment.domainsAtRisk || 0})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-intervention rounded" />
                                    <span>Need Care ({selectedElder.latestAssessment.domainsIntervention || 0})</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            Need at least 2 assessments to show comparison
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Elder Form Dialog */}
      <ElderlyForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        elderly={null}
      />
    </DashboardLayout>
  )
}
