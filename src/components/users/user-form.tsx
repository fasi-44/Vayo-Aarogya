'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DateInput } from '@/components/ui/date-input'
import { Loader2, Eye, EyeOff, Phone } from 'lucide-react'
import { type SafeUser, type UserRole } from '@/types'
import { type UserFormData, getVolunteers } from '@/services/users'
import { locationsService, type LocationOption } from '@/services/locations'

// Validation schema
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['super_admin', 'professional', 'volunteer', 'family', 'elderly']),
  category: z.enum(['community', 'clinic']).optional(),
  isActive: z.boolean().optional(),
  age: z.coerce.number().min(0).max(150).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  assignedVolunteer: z.string().optional(),
  maxAssignments: z.coerce.number().min(1).max(50).optional().or(z.literal('')),
  // Location fields
  stateId: z.string().optional(),
  districtId: z.string().optional(),
  talukId: z.string().optional(),
  villageId: z.string().optional(),
  stateName: z.string().optional(),
  districtName: z.string().optional(),
  talukName: z.string().optional(),
  villageName: z.string().optional(),
  // Caregiver fields
  caregiverName: z.string().optional(),
  caregiverPhone: z.string().optional(),
  caregiverRelation: z.string().optional(),
})

type FormValues = z.infer<typeof userSchema>

interface UserFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: UserFormData) => Promise<void>
  user?: SafeUser | null
  currentUserRole?: UserRole
}

const roles = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'professional', label: 'Professional' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'family', label: 'Family' },
  { value: 'elderly', label: 'Elderly' },
]

export function UserForm({ open, onClose, onSubmit, user, currentUserRole }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volunteers, setVolunteers] = useState<SafeUser[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const isEditing = !!user

  // Location states
  const [states, setStates] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [taluks, setTaluks] = useState<LocationOption[]>([])
  const [villages, setVillages] = useState<LocationOption[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'family',
      isActive: true,
      age: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
      assignedVolunteer: '',
      maxAssignments: 10,
      stateId: '',
      districtId: '',
      talukId: '',
      villageId: '',
      stateName: '',
      districtName: '',
      talukName: '',
      villageName: '',
      caregiverName: '',
      caregiverPhone: '',
      caregiverRelation: '',
    },
  })

  const selectedRole = watch('role')
  const selectedStateId = watch('stateId')
  const selectedDistrictId = watch('districtId')
  const selectedTalukId = watch('talukId')
  const caregiverPhone = watch('caregiverPhone')

  // Load states on mount (for elderly role)
  useEffect(() => {
    async function loadStates() {
      try {
        const data = await locationsService.getStates()
        setStates(data)
      } catch (error) {
        console.error('Failed to load states:', error)
      }
    }
    if (open && selectedRole === 'elderly') {
      loadStates()
    }
  }, [open, selectedRole])

  // Load districts when state changes
  useEffect(() => {
    async function loadDistricts() {
      if (!selectedStateId) {
        setDistricts([])
        return
      }
      setLoadingLocations(true)
      try {
        const data = await locationsService.getDistricts(selectedStateId)
        setDistricts(data)
      } catch (error) {
        console.error('Failed to load districts:', error)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadDistricts()
  }, [selectedStateId])

  // Load taluks when district changes
  useEffect(() => {
    async function loadTaluks() {
      if (!selectedDistrictId) {
        setTaluks([])
        return
      }
      setLoadingLocations(true)
      try {
        const data = await locationsService.getTaluks(selectedDistrictId)
        setTaluks(data)
      } catch (error) {
        console.error('Failed to load taluks:', error)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadTaluks()
  }, [selectedDistrictId])

  // Load villages when taluk changes
  useEffect(() => {
    async function loadVillages() {
      if (!selectedTalukId) {
        setVillages([])
        return
      }
      setLoadingLocations(true)
      try {
        const data = await locationsService.getVillages(selectedTalukId)
        setVillages(data)
      } catch (error) {
        console.error('Failed to load villages:', error)
      } finally {
        setLoadingLocations(false)
      }
    }
    loadVillages()
  }, [selectedTalukId])

  // Load volunteers for elderly assignment
  useEffect(() => {
    async function loadVolunteers() {
      const result = await getVolunteers()
      if (result.success && result.data) {
        setVolunteers(result.data.users)
      }
    }
    loadVolunteers()
  }, [])

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open) {
      setError(null)
      if (user) {
        reset({
          email: user.email,
          password: '',
          name: user.name,
          phone: user.phone || '',
          role: user.role,
          category: user.category || undefined,
          isActive: user.isActive,
          age: user.age || '',
          gender: user.gender || '',
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
          address: user.address || '',
          emergencyContact: user.emergencyContact || '',
          assignedVolunteer: user.assignedVolunteer || '',
          maxAssignments: user.maxAssignments || 10,
          stateName: user.stateName || '',
          districtName: user.districtName || '',
          talukName: user.talukName || '',
          villageName: user.villageName || '',
          caregiverName: user.caregiverName || '',
          caregiverPhone: user.caregiverPhone || '',
          caregiverRelation: user.caregiverRelation || '',
        })
      } else {
        reset({
          email: '',
          password: '',
          name: '',
          phone: '',
          role: 'family',
          isActive: true,
          age: '',
          gender: '',
          dateOfBirth: '',
          address: '',
          emergencyContact: '',
          assignedVolunteer: '',
          maxAssignments: 10,
          stateId: '',
          districtId: '',
          talukId: '',
          villageId: '',
          stateName: '',
          districtName: '',
          talukName: '',
          villageName: '',
          caregiverName: '',
          caregiverPhone: '',
          caregiverRelation: '',
        })
      }
    }
  }, [user, reset, open])

  // When editing, find and set location IDs based on saved names
  useEffect(() => {
    if (user?.stateName && states.length > 0) {
      const state = states.find(s => s.name === user.stateName)
      if (state) {
        setValue('stateId', state.id)
      }
    }
  }, [user?.stateName, states, setValue])

  useEffect(() => {
    if (user?.districtName && districts.length > 0) {
      const district = districts.find(d => d.name === user.districtName)
      if (district) {
        setValue('districtId', district.id)
      }
    }
  }, [user?.districtName, districts, setValue])

  useEffect(() => {
    if (user?.talukName && taluks.length > 0) {
      const taluk = taluks.find(t => t.name === user.talukName)
      if (taluk) {
        setValue('talukId', taluk.id)
      }
    }
  }, [user?.talukName, taluks, setValue])

  useEffect(() => {
    if (user?.villageName && villages.length > 0) {
      const village = villages.find(v => v.name === user.villageName)
      if (village) {
        setValue('villageId', village.id)
      }
    }
  }, [user?.villageName, villages, setValue])

  // Location change handlers
  const handleStateChange = (value: string) => {
    const state = states.find(s => s.id === value)
    setValue('stateId', value === 'none' ? '' : value)
    setValue('stateName', state?.name || '')
    setValue('districtId', '')
    setValue('districtName', '')
    setValue('talukId', '')
    setValue('talukName', '')
    setValue('villageId', '')
    setValue('villageName', '')
  }

  const handleDistrictChange = (value: string) => {
    const district = districts.find(d => d.id === value)
    setValue('districtId', value === 'none' ? '' : value)
    setValue('districtName', district?.name || '')
    setValue('talukId', '')
    setValue('talukName', '')
    setValue('villageId', '')
    setValue('villageName', '')
  }

  const handleTalukChange = (value: string) => {
    const taluk = taluks.find(t => t.id === value)
    setValue('talukId', value === 'none' ? '' : value)
    setValue('talukName', taluk?.name || '')
    setValue('villageId', '')
    setValue('villageName', '')
  }

  const handleVillageChange = (value: string) => {
    const village = villages.find(v => v.id === value)
    setValue('villageId', value === 'none' ? '' : value)
    setValue('villageName', village?.name || '')
  }

  const onFormSubmit = async (data: FormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const formData: UserFormData = {
        email: data.email,
        name: data.name,
        phone: data.phone || undefined,
        role: data.role as UserRole,
        isActive: data.isActive,
      }

      // Only include password if provided
      if (data.password) {
        formData.password = data.password
      }

      // Include category for elderly
      if (data.role === 'elderly' && data.category) {
        formData.category = data.category as 'community' | 'clinic'
      }

      // Include elderly-specific fields
      if (data.role === 'elderly') {
        if (data.age) formData.age = Number(data.age)
        if (data.gender) formData.gender = data.gender as 'male' | 'female' | 'other'
        if (data.dateOfBirth) formData.dateOfBirth = data.dateOfBirth
        if (data.address) formData.address = data.address
        if (data.emergencyContact) formData.emergencyContact = data.emergencyContact
        if (data.assignedVolunteer) formData.assignedVolunteer = data.assignedVolunteer
        // Location fields
        if (data.stateName) formData.stateName = data.stateName
        if (data.districtName) formData.districtName = data.districtName
        if (data.talukName) formData.talukName = data.talukName
        if (data.villageName) formData.villageName = data.villageName
        // Caregiver fields
        if (data.caregiverName) formData.caregiverName = data.caregiverName
        if (data.caregiverPhone) formData.caregiverPhone = data.caregiverPhone
        if (data.caregiverRelation) formData.caregiverRelation = data.caregiverRelation
      }

      // Include volunteer-specific fields
      if (data.role === 'volunteer' && data.maxAssignments) {
        formData.maxAssignments = Number(data.maxAssignments)
      }

      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setIsLoading(false)
    }
  }

  // Determine which roles current user can create
  const availableRoles = roles.filter((role) => {
    if (currentUserRole === 'super_admin') return true
    if (currentUserRole === 'professional') {
      return !['super_admin', 'professional'].includes(role.value)
    }
    return false
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Create New User'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update user information. Leave password blank to keep unchanged.'
              : 'Fill in the details to create a new user account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                disabled={isEditing}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditing ? '(leave blank to keep)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={watch('role')}
                onValueChange={(value) => setValue('role', value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2 flex items-center justify-between pt-6">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </div>

          {/* Category selection for elderly */}
          {selectedRole === 'elderly' && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Patient Category *</h4>
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    watch('category') === 'community'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    value="community"
                    {...register('category')}
                    className="w-4 h-4 accent-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">Community</p>
                    <p className="text-xs text-muted-foreground">NGO / Community outreach</p>
                  </div>
                </label>
                <label
                  className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    watch('category') === 'clinic'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    value="clinic"
                    {...register('category')}
                    className="w-4 h-4 accent-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">Clinic</p>
                    <p className="text-xs text-muted-foreground">Clinic / OPD referral</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Elderly-specific fields */}
          {selectedRole === 'elderly' && (
            <>
              {/* Personal Information */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Personal Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      {...register('age')}
                      placeholder="65"
                      min={1}
                      max={150}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={watch('gender') || 'none'}
                      onValueChange={(value) => setValue('gender', value === 'none' ? '' : value as 'male' | 'female' | 'other')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select gender</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <DateInput
                      id="dateOfBirth"
                      {...register('dateOfBirth')}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Location</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={watch('stateId') || 'none'}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select state</SelectItem>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>District</Label>
                    <Select
                      value={watch('districtId') || 'none'}
                      onValueChange={handleDistrictChange}
                      disabled={!selectedStateId || loadingLocations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedStateId ? 'Select district' : 'Select state first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select district</SelectItem>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Taluk</Label>
                    <Select
                      value={watch('talukId') || 'none'}
                      onValueChange={handleTalukChange}
                      disabled={!selectedDistrictId || loadingLocations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedDistrictId ? 'Select taluk' : 'Select district first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select taluk</SelectItem>
                        {taluks.map((taluk) => (
                          <SelectItem key={taluk.id} value={taluk.id}>
                            {taluk.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Village</Label>
                    <Select
                      value={watch('villageId') || 'none'}
                      onValueChange={handleVillageChange}
                      disabled={!selectedTalukId || loadingLocations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedTalukId ? 'Select village' : 'Select taluk first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select village</SelectItem>
                        {villages.map((village) => (
                          <SelectItem key={village.id} value={village.id}>
                            {village.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Caregiver Details */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Caregiver Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caregiverName">Caregiver Name</Label>
                    <Input
                      id="caregiverName"
                      {...register('caregiverName')}
                      placeholder="Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caregiverPhone">Caregiver Phone</Label>
                    <div className="flex gap-2">
                      <Input
                        id="caregiverPhone"
                        {...register('caregiverPhone')}
                        placeholder="+91 98765 43210"
                        className="flex-1"
                      />
                      {caregiverPhone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(`tel:${caregiverPhone}`, '_self')}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caregiverRelation">Relation</Label>
                    <Select
                      value={watch('caregiverRelation') || 'none'}
                      onValueChange={(value) => setValue('caregiverRelation', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select relation</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="son">Son</SelectItem>
                        <SelectItem value="daughter">Daughter</SelectItem>
                        <SelectItem value="son-in-law">Son-in-law</SelectItem>
                        <SelectItem value="daughter-in-law">Daughter-in-law</SelectItem>
                        <SelectItem value="grandchild">Grandchild</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="relative">Other Relative</SelectItem>
                        <SelectItem value="neighbor">Neighbor</SelectItem>
                        <SelectItem value="professional">Professional Caregiver</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Emergency & Assignment */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Emergency Contact & Assignment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      {...register('emergencyContact')}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedVolunteer">Assigned Volunteer</Label>
                    <Select
                      value={watch('assignedVolunteer') || 'none'}
                      onValueChange={(value) => setValue('assignedVolunteer', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select volunteer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {volunteers.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Volunteer-specific fields */}
          {selectedRole === 'volunteer' && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Volunteer Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="maxAssignments">Max Elderly Assignments</Label>
                <Input
                  id="maxAssignments"
                  type="number"
                  {...register('maxAssignments')}
                  placeholder="10"
                  min={1}
                  max={50}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
