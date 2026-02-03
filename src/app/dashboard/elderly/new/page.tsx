'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { ArrowLeft, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
import { createElderly, type ElderlyFormData } from '@/services/elderly'
import { getLocations } from '@/services/locations'

interface LocationOption {
  id: string
  name: string
}

export default function NewElderlyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Location dropdowns
  const [states, setStates] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [taluks, setTaluks] = useState<LocationOption[]>([])
  const [villages, setVillages] = useState<LocationOption[]>([])

  // Form data
  const [formData, setFormData] = useState<ElderlyFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: undefined,
    gender: undefined,
    address: '',
    dateOfBirth: '',
    pincode: '',
    stateName: '',
    districtName: '',
    talukName: '',
    villageName: '',
    caregiverName: '',
    caregiverPhone: '',
    caregiverRelation: '',
    caregiverRelationOther: '',
    needsFinancialAssistance: undefined,
    needsLegalSupport: undefined,
  })

  // Load states on mount and auto-select Karnataka + Bangalore Urban
  useEffect(() => {
    const initializeLocations = async () => {
      try {
        // Load states
        const statesResult = await getLocations('state')
        if (statesResult.success && statesResult.data) {
          setStates(statesResult.data)

          // Auto-select Karnataka
          const karnataka = statesResult.data.find(s => s.name === 'Karnataka')
          if (karnataka) {
            setFormData(prev => ({
              ...prev,
              stateName: 'Karnataka'
            }))

            // Load districts for Karnataka
            const districtsResult = await getLocations('district', karnataka.id)
            if (districtsResult.success && districtsResult.data) {
              setDistricts(districtsResult.data)

              // Auto-select Bangalore Urban
              const bangaloreUrban = districtsResult.data.find(d => d.name === 'Bangalore Urban')
              if (bangaloreUrban) {
                setFormData(prev => ({
                  ...prev,
                  districtName: 'Bangalore Urban'
                }))
              }
            }
          }
        }
      } catch (err) {
        console.error('Error initializing locations:', err)
      }
    }
    initializeLocations()
  }, [])

  // Helper function to load districts and auto-select Bangalore Urban
  const loadDistrictsForState = useCallback(async (stateName: string) => {
    const stateLocation = states.find(s => s.name === stateName)
    if (!stateLocation) return

    try {
      const result = await getLocations('district', stateLocation.id)
      if (result.success && result.data) {
        setDistricts(result.data)

        // Auto-select Bangalore Urban if state is Karnataka
        if (stateName === 'Karnataka') {
          const bangaloreUrban = result.data.find(d => d.name === 'Bangalore Urban')
          if (bangaloreUrban) {
            setFormData(prev => ({
              ...prev,
              districtName: 'Bangalore Urban'
            }))
          }
        }

        setTaluks([])
        setVillages([])
      }
    } catch (err) {
      console.error('Error loading districts:', err)
    }
  }, [states])


  // Load taluks when district changes
  const loadTaluks = useCallback(async (districtName: string) => {
    const districtLocation = districts.find(d => d.name === districtName)
    if (!districtLocation) return

    try {
      const result = await getLocations('taluk', districtLocation.id)
      if (result.success && result.data) {
        setTaluks(result.data)
        setVillages([])
      }
    } catch (err) {
      console.error('Error loading taluks:', err)
    }
  }, [districts])

  // Load villages when taluk changes
  const loadVillages = useCallback(async (talukName: string) => {
    const talukLocation = taluks.find(t => t.name === talukName)
    if (!talukLocation) return

    try {
      const result = await getLocations('village', talukLocation.id)
      if (result.success && result.data) {
        setVillages(result.data)
      }
    } catch (err) {
      console.error('Error loading villages:', err)
    }
  }, [taluks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.category) {
        throw new Error('Please select a patient category')
      }
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Name, email, and password are required')
      }

      const result = await createElderly(formData)

      if (result.success) {
        router.push('/dashboard/elderly')
      } else {
        setError(result.error || 'Failed to register elder')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      stateName: value,
      districtName: '',
      talukName: '',
      villageName: '',
    }))
    loadDistrictsForState(value)
  }

  const handleDistrictChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      districtName: value,
      talukName: '',
      villageName: '',
    }))
    loadTaluks(value)
  }

  const handleTalukChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      talukName: value,
      villageName: '',
    }))
    loadVillages(value)
  }

  return (
    <DashboardLayout
      title="Register New Elder"
      subtitle="Add a new elderly individual to the Vayo Aarogya system"
    >
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Elder Registration
            </CardTitle>
            <CardDescription>
              Fill in the details to register a new elder in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Patient Category */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Patient Category *</h3>
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.category === 'community'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value="community"
                      checked={formData.category === 'community'}
                      onChange={() => setFormData(prev => ({ ...prev, category: 'community' }))}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">Community</p>
                      <p className="text-xs text-muted-foreground">Referred through NGO / Community outreach</p>
                    </div>
                  </label>
                  <label
                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.category === 'clinic'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value="clinic"
                      checked={formData.category === 'clinic'}
                      onChange={() => setFormData(prev => ({ ...prev, category: 'clinic' }))}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">Clinic</p>
                      <p className="text-xs text-muted-foreground">Referral from Clinic / OPD</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        required
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                      placeholder="Enter age"
                      min={0}
                      max={150}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' | 'other' }))}
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

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <DateInput
                      id="dateOfBirth"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Address Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={formData.stateName || ''}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select
                      value={formData.districtName || ''}
                      onValueChange={handleDistrictChange}
                      disabled={!formData.stateName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.name}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taluk">Taluk</Label>
                    <Select
                      value={formData.talukName || ''}
                      onValueChange={handleTalukChange}
                      disabled={!formData.districtName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select taluk" />
                      </SelectTrigger>
                      <SelectContent>
                        {taluks.map((taluk) => (
                          <SelectItem key={taluk.id} value={taluk.name}>
                            {taluk.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="village">Village</Label>
                    <Select
                      value={formData.villageName || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, villageName: value }))}
                      disabled={!formData.talukName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select village" />
                      </SelectTrigger>
                      <SelectContent>
                        {villages.map((village) => (
                          <SelectItem key={village.id} value={village.name}>
                            {village.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Enter pincode"
                    required
                  />
                </div>
              </div>

              {/* Caregiver Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Caregiver Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caregiverName">Caregiver Name</Label>
                    <Input
                      id="caregiverName"
                      value={formData.caregiverName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, caregiverName: e.target.value }))}
                      placeholder="Enter caregiver name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caregiverPhone">Caregiver Phone</Label>
                    <Input
                      id="caregiverPhone"
                      type="tel"
                      value={formData.caregiverPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, caregiverPhone: e.target.value }))}
                      placeholder="Enter caregiver phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caregiverRelation">Relation</Label>
                    <Select
                      value={formData.caregiverRelation || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, caregiverRelation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="son">Son</SelectItem>
                        <SelectItem value="daughter">Daughter</SelectItem>
                        <SelectItem value="daughter-in-law">Daughter-in-Law</SelectItem>
                        <SelectItem value="son-in-law">Son-in-Law</SelectItem>
                        <SelectItem value="grandchild">Grandchild</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.caregiverRelation === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="caregiverRelationOther">Specify Relation</Label>
                    <Input
                      id="caregiverRelationOther"
                      value={formData.caregiverRelationOther || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, caregiverRelationOther: e.target.value }))}
                      placeholder="Please specify the relation"
                    />
                  </div>
                )}
              </div>

              {/* Support Requirements */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Support Requirements</h3>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base">In need of any Financial Assistance</Label>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="financial-yes"
                          checked={formData.needsFinancialAssistance === true}
                          onChange={() => setFormData(prev => ({ ...prev, needsFinancialAssistance: true }))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="financial-yes" className="text-base font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="financial-no"
                          checked={formData.needsFinancialAssistance === false}
                          onChange={() => setFormData(prev => ({ ...prev, needsFinancialAssistance: false }))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="financial-no" className="text-base font-normal cursor-pointer">No</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">In need of any Legal Support</Label>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="legal-yes"
                          checked={formData.needsLegalSupport === true}
                          onChange={() => setFormData(prev => ({ ...prev, needsLegalSupport: true }))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="legal-yes" className="text-base font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="legal-no"
                          checked={formData.needsLegalSupport === false}
                          onChange={() => setFormData(prev => ({ ...prev, needsLegalSupport: false }))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="legal-no" className="text-base font-normal cursor-pointer">No</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Register Elder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
