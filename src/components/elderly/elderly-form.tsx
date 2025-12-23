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
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Phone, Lock } from 'lucide-react'
import { type SafeUser, type Location } from '@/types'
import { type ElderlyFormData } from '@/services/elderly'
import { getVolunteers, getFamilyMembers } from '@/services/users'
import { locationsService, type LocationOption } from '@/services/locations'
import { useAuthStore } from '@/store'

// Validation schema
const elderlySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  age: z.coerce.number().min(1).max(150).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  assignedVolunteer: z.string().optional(),
  assignedFamily: z.string().optional(),
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

type FormValues = z.infer<typeof elderlySchema>

interface ElderlyFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ElderlyFormData) => Promise<void>
  elderly?: SafeUser | null
}

export function ElderlyForm({ open, onClose, onSubmit, elderly }: ElderlyFormProps) {
  const { user: currentUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [volunteers, setVolunteers] = useState<SafeUser[]>([])
  const [familyMembers, setFamilyMembers] = useState<SafeUser[]>([])
  const isEditing = !!elderly

  // Check if current user is a family member creating a new elder
  const isFamilyUserCreating = currentUser?.role === 'family' && !isEditing

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
    resolver: zodResolver(elderlySchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      isActive: true,
      age: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
      assignedVolunteer: '',
      assignedFamily: '',
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

  const selectedStateId = watch('stateId')
  const selectedDistrictId = watch('districtId')
  const selectedTalukId = watch('talukId')

  // Load volunteers and family members for assignment
  useEffect(() => {
    async function loadAssignees() {
      const [volunteersResult, familyResult] = await Promise.all([
        getVolunteers(),
        getFamilyMembers(),
      ])
      if (volunteersResult.success && volunteersResult.data) {
        setVolunteers(volunteersResult.data.users)
      }
      if (familyResult.success && familyResult.data) {
        setFamilyMembers(familyResult.data.users)
      }
    }
    loadAssignees()
  }, [])

  // Load states on mount
  useEffect(() => {
    async function loadStates() {
      try {
        const data = await locationsService.getStates()
        setStates(data)
      } catch (error) {
        console.error('Failed to load states:', error)
      }
    }
    if (open) {
      loadStates()
    }
  }, [open])

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

  // Reset form when elderly changes
  useEffect(() => {
    if (elderly) {
      reset({
        email: elderly.email,
        password: '',
        name: elderly.name,
        phone: elderly.phone || '',
        isActive: elderly.isActive,
        age: elderly.age || '',
        gender: elderly.gender || '',
        dateOfBirth: elderly.dateOfBirth ? elderly.dateOfBirth.split('T')[0] : '',
        address: elderly.address || '',
        emergencyContact: elderly.emergencyContact || '',
        assignedVolunteer: elderly.assignedVolunteer || '',
        assignedFamily: elderly.assignedFamily || '',
        stateName: elderly.stateName || '',
        districtName: elderly.districtName || '',
        talukName: elderly.talukName || '',
        villageName: elderly.villageName || '',
        caregiverName: elderly.caregiverName || '',
        caregiverPhone: elderly.caregiverPhone || '',
        caregiverRelation: elderly.caregiverRelation || '',
      })
    } else {
      reset({
        email: '',
        password: '',
        name: '',
        phone: '',
        isActive: true,
        age: '',
        gender: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
        assignedVolunteer: '',
        // Auto-set family if family user is creating
        assignedFamily: currentUser?.role === 'family' ? currentUser.id : '',
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
  }, [elderly, reset, currentUser])

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
    try {
      const formData: ElderlyFormData = {
        email: data.email,
        name: data.name,
        phone: data.phone || undefined,
        isActive: data.isActive,
      }

      // Only include password if provided
      if (data.password) {
        formData.password = data.password
      }

      // Include elderly-specific fields
      if (data.age) formData.age = Number(data.age)
      if (data.gender) formData.gender = data.gender as 'male' | 'female' | 'other'
      if (data.dateOfBirth) formData.dateOfBirth = data.dateOfBirth
      if (data.address) formData.address = data.address
      if (data.emergencyContact) formData.emergencyContact = data.emergencyContact
      if (data.assignedVolunteer) formData.assignedVolunteer = data.assignedVolunteer
      if (data.assignedFamily) formData.assignedFamily = data.assignedFamily

      // Location fields (store names, not IDs)
      if (data.stateName) formData.stateName = data.stateName
      if (data.districtName) formData.districtName = data.districtName
      if (data.talukName) formData.talukName = data.talukName
      if (data.villageName) formData.villageName = data.villageName

      // Caregiver fields
      if (data.caregiverName) formData.caregiverName = data.caregiverName
      if (data.caregiverPhone) formData.caregiverPhone = data.caregiverPhone
      if (data.caregiverRelation) formData.caregiverRelation = data.caregiverRelation

      await onSubmit(formData)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const caregiverPhone = watch('caregiverPhone')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditing ? 'Edit Elder' : 'Register New Elder'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update elder information. Leave password blank to keep unchanged.'
              : 'Fill in the details to register a new elder in the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Vayo ID Display */}
          {elderly?.vayoId && (
            <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
              <div>
                <Label className="text-sm text-muted-foreground">Vayo ID</Label>
                <p className="text-2xl font-bold text-primary">{elderly.vayoId}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Full Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter full name"
                  className="text-base"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="email@example.com"
                  disabled={isEditing}
                  className="text-base"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">
                  Password {isEditing ? '(leave blank to keep)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
                  className="text-base"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+91 98765 43210"
                  className="text-base"
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-base">Age</Label>
                <Input
                  id="age"
                  type="number"
                  {...register('age')}
                  placeholder="65"
                  min={1}
                  max={150}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-base">Gender</Label>
                <Select
                  value={watch('gender') || 'none'}
                  onValueChange={(value) => setValue('gender', value === 'none' ? '' : value as 'male' | 'female' | 'other')}
                >
                  <SelectTrigger className="text-base">
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
                <Label htmlFor="dateOfBirth" className="text-base">Date of Birth</Label>
                <DateInput
                  id="dateOfBirth"
                  {...register('dateOfBirth')}
                  className="text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-base">Address</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Full address"
                rows={2}
                className="text-base"
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">
              Location
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">State</Label>
                <Select
                  value={watch('stateId') || 'none'}
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger className="text-base">
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
                <Label className="text-base">District</Label>
                <Select
                  value={watch('districtId') || 'none'}
                  onValueChange={handleDistrictChange}
                  disabled={!selectedStateId || loadingLocations}
                >
                  <SelectTrigger className="text-base">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Taluk</Label>
                <Select
                  value={watch('talukId') || 'none'}
                  onValueChange={handleTalukChange}
                  disabled={!selectedDistrictId || loadingLocations}
                >
                  <SelectTrigger className="text-base">
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
                <Label className="text-base">Village</Label>
                <Select
                  value={watch('villageId') || 'none'}
                  onValueChange={handleVillageChange}
                  disabled={!selectedTalukId || loadingLocations}
                >
                  <SelectTrigger className="text-base">
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

          {/* Caregiver Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">
              Caregiver Details
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caregiverName" className="text-base">Caregiver Name</Label>
                <Input
                  id="caregiverName"
                  {...register('caregiverName')}
                  placeholder="Name"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caregiverPhone" className="text-base">Caregiver Phone</Label>
                <div className="flex gap-2">
                  <Input
                    id="caregiverPhone"
                    {...register('caregiverPhone')}
                    placeholder="+91 98765 43210"
                    className="text-base flex-1"
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
                <Label htmlFor="caregiverRelation" className="text-base">Relation</Label>
                <Select
                  value={watch('caregiverRelation') || 'none'}
                  onValueChange={(value) => setValue('caregiverRelation', value === 'none' ? '' : value)}
                >
                  <SelectTrigger className="text-base">
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
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">
              Emergency Contact & Assignment
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-base">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  {...register('emergencyContact')}
                  placeholder="+91 98765 43210"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedVolunteer" className="text-base">Assigned Volunteer</Label>
                <Select
                  value={watch('assignedVolunteer') || 'none'}
                  onValueChange={(value) => setValue('assignedVolunteer', value === 'none' ? '' : value)}
                >
                  <SelectTrigger className="text-base">
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

              <div className="space-y-2">
                <Label htmlFor="assignedFamily" className="text-base flex items-center gap-2">
                  Assigned Family / Caregiver
                  {isFamilyUserCreating && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {isFamilyUserCreating ? (
                  // Family member creating - show their name, disabled
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                    <span className="text-base font-medium">{currentUser?.name}</span>
                    <span className="text-sm text-muted-foreground">(You)</span>
                  </div>
                ) : (
                  // Admin/Professional - can select any family member
                  <Select
                    value={watch('assignedFamily') || 'none'}
                    onValueChange={(value) => setValue('assignedFamily', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Select family member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {familyMembers.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} {f.phone && `(${f.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {isFamilyUserCreating
                    ? 'This elder will be linked to your account'
                    : 'Link to a registered family member account'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="isActive" className="text-base">Active Status</Label>
              <Switch
                id="isActive"
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Elder' : 'Register Elder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
