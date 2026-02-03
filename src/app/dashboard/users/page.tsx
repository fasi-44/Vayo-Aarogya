'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  Filter,
  Download,
  RefreshCw,
  HandHeart,
  Heart,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
} from 'lucide-react'
import { type SafeUser, type UserRole } from '@/types'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  type UserFormData,
  type UserFilters,
} from '@/services/users'
import {
  UserTable,
  UserForm,
  UserDeleteDialog,
  UserViewDialog,
  UserApprovalDialog,
} from '@/components/users'

export default function UserManagementPage() {
  const { user: currentUser, hasPermission } = useAuthStore()

  // Data state
  const [users, setUsers] = useState<SafeUser[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null)

  // Pending approvals
  const [pendingUsers, setPendingUsers] = useState<SafeUser[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [userToApprove, setUserToApprove] = useState<SafeUser | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    elderly: 0,
    volunteers: 0,
    professionals: 0,
    families: 0,
  })

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: UserFilters = {
        page,
        limit,
      }

      if (roleFilter !== 'all') {
        filters.role = roleFilter
      }

      if (searchQuery) {
        filters.search = searchQuery
      }

      if (statusFilter === 'active') {
        filters.isActive = true
        filters.approvalStatus = 'all'
      } else if (statusFilter === 'inactive') {
        filters.isActive = false
        filters.approvalStatus = 'all'
      } else if (statusFilter === 'pending') {
        filters.approvalStatus = 'pending'
      } else {
        // Admin page: show all users regardless of approval status
        filters.approvalStatus = 'all'
      }

      const result = await getUsers(filters)

      if (result.success && result.data) {
        setUsers(result.data.users)
        setTotal(result.data.total)
      } else {
        setError(result.error || 'Failed to load users')
      }
    } catch (err) {
      setError('Failed to load users')
      console.error('Load users error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, roleFilter, searchQuery, statusFilter])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      // Load all users for stats (we could create a dedicated API endpoint for this)
      const [allUsers, elderly, volunteers, professionals, families] = await Promise.all([
        getUsers({ limit: 1, approvalStatus: 'all' }),
        getUsers({ role: 'elderly', limit: 1, approvalStatus: 'all' }),
        getUsers({ role: 'volunteer', limit: 1, approvalStatus: 'all' }),
        getUsers({ role: 'professional', limit: 1, approvalStatus: 'all' }),
        getUsers({ role: 'family', limit: 1, approvalStatus: 'all' }),
      ])

      setStats({
        total: allUsers.data?.total || 0,
        elderly: elderly.data?.total || 0,
        volunteers: volunteers.data?.total || 0,
        professionals: professionals.data?.total || 0,
        families: families.data?.total || 0,
      })
    } catch (err) {
      console.error('Load stats error:', err)
    }
  }, [])

  // Load pending users
  const loadPendingUsers = useCallback(async () => {
    try {
      const result = await getUsers({ approvalStatus: 'pending', limit: 100 })
      if (result.success && result.data) {
        setPendingUsers(result.data.users)
        setPendingCount(result.data.total)
      }
    } catch (err) {
      console.error('Load pending users error:', err)
    }
  }, [])

  // Handle approve click - open dialog for elderly, direct-approve for others
  const handleApproveClick = (user: SafeUser) => {
    if (user.role === 'elderly') {
      setUserToApprove(user)
      setApprovalDialogOpen(true)
    } else {
      handleDirectApprove(user.id)
    }
  }

  // Direct approve (non-elderly users)
  const handleDirectApprove = async (userId: string) => {
    setIsApproving(userId)
    try {
      const result = await approveUser(userId)
      if (result.success) {
        loadPendingUsers()
        loadUsers()
        loadStats()
      }
    } catch (err) {
      console.error('Approve user error:', err)
    } finally {
      setIsApproving(null)
    }
  }

  // Approve with category (elderly users via dialog)
  const handleApproveWithCategory = async (userId: string, category: 'community' | 'clinic') => {
    setIsApproving(userId)
    try {
      const result = await approveUser(userId, category)
      if (result.success) {
        loadPendingUsers()
        loadUsers()
        loadStats()
      }
    } catch (err) {
      console.error('Approve user error:', err)
    } finally {
      setIsApproving(null)
    }
  }

  const handleReject = async (userId: string) => {
    setIsApproving(userId)
    try {
      const result = await rejectUser(userId)
      if (result.success) {
        loadPendingUsers()
        loadUsers()
        loadStats()
      }
    } catch (err) {
      console.error('Reject user error:', err)
    } finally {
      setIsApproving(null)
    }
  }

  // Load data on mount and filter change
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadPendingUsers()
  }, [loadPendingUsers])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, roleFilter, statusFilter])

  // Handlers
  const handleCreate = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  const handleEdit = (user: SafeUser) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleView = (user: SafeUser) => {
    setSelectedUser(user)
    setIsViewOpen(true)
  }

  const handleDelete = (user: SafeUser) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: UserFormData) => {
    if (selectedUser) {
      // Update existing user
      const result = await updateUser(selectedUser.id, data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update user')
      }
    } else {
      // Create new user
      if (!data.password) {
        throw new Error('Password is required for new users')
      }
      const result = await createUser(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user')
      }
    }

    // Reload data
    loadUsers()
    loadStats()
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    try {
      const result = await deleteUser(selectedUser.id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user')
      }

      // Reload data
      loadUsers()
      loadStats()
    } catch (err) {
      console.error('Delete user error:', err)
      throw err
    }
  }

  const handleRefresh = () => {
    loadUsers()
    loadStats()
    loadPendingUsers()
  }

  // Permissions
  const canCreateUser = hasPermission('users:create')
  const totalPages = Math.ceil(total / limit)

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage users, roles, and permissions for Vayo Aarogya"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-soft ${pendingCount > 0 ? 'ring-2 ring-amber-400' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Elders</p>
                <p className="text-xl font-bold text-foreground">{stats.elderly}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <HandHeart className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volunteers</p>
                <p className="text-xl font-bold text-foreground">{stats.volunteers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Professionals</p>
                <p className="text-xl font-bold text-foreground">{stats.professionals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Families</p>
                <p className="text-xl font-bold text-foreground">{stats.families}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      {pendingCount > 0 && (
        <Card className="border-0 shadow-soft mb-6 border-l-4 border-l-amber-500">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pending Approvals</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {pendingCount} user{pendingCount !== 1 ? 's' : ''} waiting for approval
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-amber-800">
                        {pendingUser.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{pendingUser.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {pendingUser.email}
                        </span>
                        {pendingUser.phone && (
                          <a href={`tel:${pendingUser.phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="w-3 h-3" />
                            {pendingUser.phone}
                          </a>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {pendingUser.role?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Registered: {new Date(pendingUser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleReject(pendingUser.id)}
                      disabled={isApproving === pendingUser.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApproveClick(pendingUser)}
                      disabled={isApproving === pendingUser.id}
                    >
                      {isApproving === pendingUser.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-soft">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="text-lg">All Users</CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="elderly">Elderly</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>

                <Button variant="outline" size="icon" title="Export Users">
                  <Download className="w-4 h-4" />
                </Button>

                {canCreateUser && (
                  <Button onClick={handleCreate} className="gradient-medical text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Users Table */}
          {!isLoading && (
            <div className="p-4">
              <UserTable
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                currentUserId={currentUser?.id}
              />
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <UserForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        currentUserRole={currentUser?.role as UserRole}
      />

      {/* User View Dialog */}
      <UserViewDialog
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onEdit={() => {
          setIsViewOpen(false)
          setIsFormOpen(true)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <UserDeleteDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={handleDeleteConfirm}
        user={selectedUser}
      />

      {/* Approval Dialog (elderly category selection) */}
      <UserApprovalDialog
        open={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false)
          setUserToApprove(null)
        }}
        onConfirm={handleApproveWithCategory}
        user={userToApprove}
      />
    </DashboardLayout>
  )
}
