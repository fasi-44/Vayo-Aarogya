'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CareTeamTable } from '@/components/care-team/care-team-table'
import { CareTeamCard } from '@/components/care-team/care-team-card'
import { AssignmentDialog } from '@/components/care-team/assignment-dialog'
import { BulkAssignDialog } from '@/components/care-team/bulk-assign-dialog'
import { getUsers, updateUser } from '@/services/users'
import { getElderly } from '@/services/elderly'
import type { SafeUser } from '@/types'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  AlertCircle,
  Loader2,
  LayoutGrid,
  LayoutList,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react'

export default function CareTeamPage() {
  const router = useRouter()
  const [careTeamMembers, setCareTeamMembers] = useState<SafeUser[]>([])
  const [elderly, setElderly] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [viewAssignedDialogOpen, setViewAssignedDialogOpen] = useState(false)
  const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<SafeUser | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    totalProfessionals: 0,
    totalCareTeam: 0,
    availableVolunteers: 0,
    availableProfessionals: 0,
    nearCapacityVolunteers: 0,
    nearCapacityProfessionals: 0,
    atCapacityVolunteers: 0,
    atCapacityProfessionals: 0,
    totalAssignedByVolunteers: 0,
    totalAssignedByProfessionals: 0,
    unassignedElderlyVolunteer: 0,
    unassignedElderlyProfessional: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [volunteersRes, professionalsRes, elderlyRes] = await Promise.all([
        getUsers({ role: 'volunteer', limit: 1000 }),
        getUsers({ role: 'professional', limit: 1000 }),
        getElderly({ limit: 1000 }),
      ])

      let allCareTeam: SafeUser[] = []

      // Process volunteers
      if (volunteersRes.success && volunteersRes.data) {
        allCareTeam = [...allCareTeam, ...volunteersRes.data.users]
      }

      // Process professionals
      if (professionalsRes.success && professionalsRes.data) {
        allCareTeam = [...allCareTeam, ...professionalsRes.data.users]
      }

      setCareTeamMembers(allCareTeam)

      // Calculate separate stats for volunteers and professionals
      let statsVolunteers = { available: 0, nearCapacity: 0, atCapacity: 0, totalAssigned: 0 }
      let statsProfessionals = { available: 0, nearCapacity: 0, atCapacity: 0, totalAssigned: 0 }

      allCareTeam.forEach((member) => {
        const assigned = member.role === 'volunteer'
          ? (member.assignedElderly?.length || 0)
          : (member.professionalElders?.length || 0)
        const max = member.maxAssignments || 10
        const percentage = (assigned / max) * 100

        const statsTarget = member.role === 'volunteer' ? statsVolunteers : statsProfessionals

        statsTarget.totalAssigned += assigned
        if (percentage >= 100) {
          statsTarget.atCapacity++
        } else if (percentage >= 80) {
          statsTarget.nearCapacity++
        } else {
          statsTarget.available++
        }
      })

      const elderlyUsers = elderlyRes.data?.users || []
      const unassignedVolunteer = elderlyUsers.filter(e => !e.assignedVolunteer).length
      const unassignedProfessional = elderlyUsers.filter(e => !e.assignedProfessional).length

      setStats({
        totalVolunteers: volunteersRes.data?.users.length || 0,
        totalProfessionals: professionalsRes.data?.users.length || 0,
        totalCareTeam: allCareTeam.length,
        availableVolunteers: statsVolunteers.available,
        availableProfessionals: statsProfessionals.available,
        nearCapacityVolunteers: statsVolunteers.nearCapacity,
        nearCapacityProfessionals: statsProfessionals.nearCapacity,
        atCapacityVolunteers: statsVolunteers.atCapacity,
        atCapacityProfessionals: statsProfessionals.atCapacity,
        totalAssignedByVolunteers: statsVolunteers.totalAssigned,
        totalAssignedByProfessionals: statsProfessionals.totalAssigned,
        unassignedElderlyVolunteer: unassignedVolunteer,
        unassignedElderlyProfessional: unassignedProfessional,
      })

      if (elderlyRes.success && elderlyRes.data) {
        setElderly(elderlyRes.data.users)
      }
    } catch (error) {
      console.error('Error fetching care team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVolunteers = volunteers.filter((volunteer) => {
    const matchesSearch =
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterStatus === 'all') return matchesSearch

    const assigned = volunteer.assignedElderly?.length || 0
    const max = volunteer.maxAssignments || 10
    const percentage = (assigned / max) * 100

    if (filterStatus === 'available') return matchesSearch && percentage < 80
    if (filterStatus === 'near-capacity') return matchesSearch && percentage >= 80 && percentage < 100
    if (filterStatus === 'full') return matchesSearch && percentage >= 100

    return matchesSearch
  })

  const handleView = (volunteer: SafeUser) => {
    setSelectedVolunteer(volunteer)
    setViewProfileDialogOpen(true)
  }

  const handleAssign = (volunteer: SafeUser) => {
    setSelectedVolunteer(volunteer)
    setAssignDialogOpen(true)
  }

  const handleViewAssigned = (volunteer: SafeUser) => {
    setSelectedVolunteer(volunteer)
    setViewAssignedDialogOpen(true)
  }

  const handleAssignSubmit = async (elderlyIds: string[]) => {
    if (!selectedVolunteer) return

    try {
      // Update each elderly to be assigned to this volunteer
      for (const elderlyId of elderlyIds) {
        await updateUser(elderlyId, { assignedVolunteer: selectedVolunteer.id })
      }
      await fetchData()
    } catch (error) {
      console.error('Error assigning elderly:', error)
    }
  }

  const handleBulkAssign = async (volunteerId: string, elderlyIds: string[]) => {
    try {
      for (const elderlyId of elderlyIds) {
        await updateUser(elderlyId, { assignedVolunteer: volunteerId })
      }
      await fetchData()
    } catch (error) {
      console.error('Error bulk assigning elderly:', error)
    }
  }

  // Get assigned elderly for selected volunteer
  const getAssignedElderly = () => {
    if (!selectedVolunteer) return []
    // First try to use the assignedElderly array from the volunteer object
    const volunteerWithElderly = selectedVolunteer as Omit<SafeUser, 'assignedElderly'> & { assignedElderly?: Array<{ id: string; name: string; vayoId?: string; age?: number; villageName?: string }> }
    if (volunteerWithElderly.assignedElderly && volunteerWithElderly.assignedElderly.length > 0) {
      return volunteerWithElderly.assignedElderly.map(e => ({
        ...e,
        email: '',
        role: 'elderly' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      })) as SafeUser[]
    }
    // Fallback: filter from the elderly list
    return elderly.filter((e) => e.assignedVolunteer === selectedVolunteer.id)
  }

  const volunteerStatCards = [
    { title: 'Total Volunteers', value: stats.total, icon: Users, color: 'bg-primary' },
    { title: 'Available', value: stats.available, icon: UserCheck, color: 'bg-green-500' },
    { title: 'Near Capacity', value: stats.nearCapacity, icon: AlertCircle, color: 'bg-yellow-500' },
    { title: 'At Capacity', value: stats.atCapacity, icon: AlertCircle, color: 'bg-red-500' },
  ]

  const elderAssignmentCards = [
    { title: 'Elders Assigned', value: stats.totalAssigned, icon: Users, color: 'bg-blue-500' },
    { title: 'Unassigned Elders', value: stats.unassignedElderly, icon: UserPlus, color: 'bg-orange-500' },
  ]

  return (
    <DashboardLayout
      title="Volunteer Management"
      subtitle="Manage volunteers and their elder assignments"
    >
      {/* Volunteer Stats Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Volunteer Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {volunteerStatCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Elder Assignment Stats Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Elder Assignments</h3>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {elderAssignmentCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Filters and Actions */}
      <Card className="border-0 shadow-soft mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search volunteers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Volunteers</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="near-capacity">Near Capacity</SelectItem>
                <SelectItem value="full">At Capacity</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-muted' : ''}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-muted' : ''}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={() => setBulkAssignDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Bulk Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'table' ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-0">
            <VolunteerTable
              volunteers={filteredVolunteers}
              onView={handleView}
              onAssign={handleAssign}
              onViewAssigned={handleViewAssigned}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map((volunteer) => (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              onView={() => handleView(volunteer)}
              onAssign={() => handleAssign(volunteer)}
              onViewAssigned={() => handleViewAssigned(volunteer)}
            />
          ))}
          {filteredVolunteers.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No volunteers found
            </div>
          )}
        </div>
      )}

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        volunteer={selectedVolunteer}
        elderly={elderly}
        onAssign={handleAssignSubmit}
      />

      {/* Bulk Assignment Dialog */}
      <BulkAssignDialog
        open={bulkAssignDialogOpen}
        onOpenChange={setBulkAssignDialogOpen}
        volunteers={volunteers}
        elderly={elderly}
        onBulkAssign={handleBulkAssign}
      />

      {/* View Assigned Elderly Dialog */}
      <Dialog open={viewAssignedDialogOpen} onOpenChange={setViewAssignedDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assigned Elders - {selectedVolunteer?.name}</DialogTitle>
            <DialogDescription>
              {getAssignedElderly().length} elder{getAssignedElderly().length !== 1 ? 's' : ''} assigned
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {getAssignedElderly().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No elders assigned yet</p>
              </div>
            ) : (
              getAssignedElderly().map((elder) => (
                <div
                  key={elder.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/elderly?view=${elder.id}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-rose-100 text-rose-700 text-sm">
                      {getInitials(elder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{elder.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {elder.vayoId && <span>{elder.vayoId}</span>}
                      {elder.age && <span>• {elder.age} years</span>}
                      {elder.villageName && <span>• {elder.villageName}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/elderly?view=${elder.id}`)
                    }}
                    title="View Details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Volunteer Profile Dialog */}
      <Dialog open={viewProfileDialogOpen} onOpenChange={setViewProfileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Volunteer Profile</DialogTitle>
            <DialogDescription>
              View volunteer details and contact information
            </DialogDescription>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="space-y-4">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-medium">
                    {getInitials(selectedVolunteer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedVolunteer.name}</h3>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700">
                    Volunteer
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selectedVolunteer.email}`} className="text-primary hover:underline">
                    {selectedVolunteer.email}
                  </a>
                </div>
                {selectedVolunteer.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${selectedVolunteer.phone}`} className="text-primary hover:underline">
                      {selectedVolunteer.phone}
                    </a>
                  </div>
                )}
                {(selectedVolunteer.villageName || selectedVolunteer.districtName) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {[selectedVolunteer.villageName, selectedVolunteer.talukName, selectedVolunteer.districtName]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined: {formatDate(selectedVolunteer.createdAt)}</span>
                </div>
              </div>

              {/* Assignment Stats */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Assignment Capacity</h4>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Assigned Elders</span>
                  <span className="font-medium">
                    {(selectedVolunteer as SafeUser & { assignedElderly?: unknown[] }).assignedElderly?.length || 0} / {selectedVolunteer.maxAssignments || 10}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (((selectedVolunteer as SafeUser & { assignedElderly?: unknown[] }).assignedElderly?.length || 0) / (selectedVolunteer.maxAssignments || 10)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewProfileDialogOpen(false)
                    handleViewAssigned(selectedVolunteer)
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Assigned Elders
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setViewProfileDialogOpen(false)
                    handleAssign(selectedVolunteer)
                  }}
                  disabled={((selectedVolunteer as SafeUser & { assignedElderly?: unknown[] }).assignedElderly?.length || 0) >= (selectedVolunteer.maxAssignments || 10)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Elders
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
