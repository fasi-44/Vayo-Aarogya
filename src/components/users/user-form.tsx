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
import { Loader2 } from 'lucide-react'
import { type SafeUser, type UserRole } from '@/types'
import { type UserFormData, getVolunteers } from '@/services/users'

// Validation schema
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['super_admin', 'professional', 'volunteer', 'family', 'elderly']),
  isActive: z.boolean().optional(),
  age: z.coerce.number().min(0).max(150).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  assignedVolunteer: z.string().optional(),
  maxAssignments: z.coerce.number().min(1).max(50).optional().or(z.literal('')),
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
  const isEditing = !!user

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
      address: '',
      emergencyContact: '',
      assignedVolunteer: '',
      maxAssignments: 10,
    },
  })

  const selectedRole = watch('role')

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
          isActive: user.isActive,
          age: user.age || '',
          gender: user.gender || '',
          address: user.address || '',
          emergencyContact: user.emergencyContact || '',
          assignedVolunteer: user.assignedVolunteer || '',
          maxAssignments: user.maxAssignments || 10,
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
          address: '',
          emergencyContact: '',
          assignedVolunteer: '',
          maxAssignments: 10,
        })
      }
    }
  }, [user, reset, open])

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

      // Include elderly-specific fields
      if (data.role === 'elderly') {
        if (data.age) formData.age = Number(data.age)
        if (data.gender) formData.gender = data.gender as 'male' | 'female' | 'other'
        if (data.address) formData.address = data.address
        if (data.emergencyContact) formData.emergencyContact = data.emergencyContact
        if (data.assignedVolunteer) formData.assignedVolunteer = data.assignedVolunteer
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder={isEditing ? '••••••••' : 'Min 8 characters'}
              />
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

          {/* Elderly-specific fields */}
          {selectedRole === 'elderly' && (
            <>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Elderly Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      {...register('age')}
                      placeholder="65"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={watch('gender') || ''}
                      onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
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
