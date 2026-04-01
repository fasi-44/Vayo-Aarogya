'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import { Phone, Lock, HeartPulse, ArrowRight, Sparkles, ArrowLeft, Shield, AlertCircle, CheckCircle2, Leaf, Loader2, Eye, EyeOff, UserCircle, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { LoginProfile } from '@/store'

const loginSchema = z.object({
  phone: z.string().length(10, 'Phone number must be exactly 10 digits').regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  password: z.string().min(4, 'Password must be at least 4 digits'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const { login, loginWithProfile, clearPendingProfiles, pendingProfiles, isLoading, error: authError, clearError } = useAuthStore()
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  // Sync auth error with local error state
  React.useEffect(() => {
    if (authError) {
      setError(authError)
      clearError()
    }
  }, [authError, clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    const success = await login(data.phone, data.password)

    if (success) {
      router.push('/dashboard')
    }
    // If pendingProfiles is set, profile selection will be shown
    // Error is handled by the store and synced via useEffect
  }

  const handleProfileSelect = async (profileId: string) => {
    setError(null)
    const success = await loginWithProfile(profileId)
    if (success) {
      router.push('/dashboard')
    }
  }

  const handleBackToLogin = () => {
    clearPendingProfiles()
    setError(null)
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      elderly: 'Elder',
      family: 'Family Member',
      volunteer: 'Volunteer',
      professional: 'Professional',
      super_admin: 'Admin',
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      elderly: 'bg-rose-100 text-rose-700',
      family: 'bg-amber-100 text-amber-700',
      volunteer: 'bg-teal-100 text-teal-700',
      professional: 'bg-blue-100 text-blue-700',
      super_admin: 'bg-purple-100 text-purple-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="animate-fade-in">
      {/* Mobile Header */}
      <div className="lg:hidden mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <HeartPulse className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Vayo Aarogya</h1>
            <p className="text-xs text-muted-foreground">Healthy Ageing Platform</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {registered && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-800">Registration submitted!</p>
            <p className="text-sm text-amber-700">Your request is pending admin approval. You will receive a call shortly for further information.</p>
          </div>
        </div>
      )}

      {/* Profile Selection Card */}
      {pendingProfiles && pendingProfiles.length > 0 ? (
        <Card className="shadow-soft-lg border-0 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8 px-8">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Select Profile</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Choose your profile</CardTitle>
            <CardDescription className="text-base">
              Multiple profiles found for this phone number. Please select which profile you want to login as.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-8 pb-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 animate-slide-up">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {pendingProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile.id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
                >
                  <Avatar className="w-14 h-14 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {profile.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                      {profile.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                        {getRoleLabel(profile.role)}
                      </span>
                      {profile.vayoId && (
                        <span className="text-xs font-mono text-muted-foreground">{profile.vayoId}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full mt-4"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card className="shadow-soft-lg border-0 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-2 pt-8 px-8">
          <div className="hidden lg:flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Welcome Back</span>
            </div>
          </div>
          <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground">Login to your account</CardTitle>
          <CardDescription className="text-base">
            Access health assessments and care dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 animate-slide-up">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                icon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                autoComplete="tel"
                maxLength={10}
                className="h-12 rounded-xl"
                {...register('phone')}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your 4-digit PIN"
                  icon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  className="h-12 rounded-xl pr-10"
                  {...register('password')}
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

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="rememberMe"
                {...register('rememberMe')}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold group gradient-primary text-white hover:opacity-90 rounded-xl shadow-lg shadow-primary/25"
              size="lg"
              loading={isLoading}
            >
              Login
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Demo Credentials
              </span>
            </div>
          </div>

          {/* Demo Credentials Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-warmgray-50 to-primary-50/30 p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">Test Accounts</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { role: 'Admin', phone: '9000000001', pass: '1234' },
                  { role: 'Professional', phone: '9000000002', pass: '1234' },
                  { role: 'Volunteer', phone: '9000000003', pass: '1234' },
                ].map((cred) => (
                  <div key={cred.role} className="flex justify-between items-center p-2.5 bg-white/80 rounded-xl border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground w-16">{cred.role}</span>
                    <code className="text-xs font-mono text-foreground">{cred.phone} / {cred.pass}</code>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Multi-Profile Login (Profile Selection)
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 bg-white/80 rounded-xl border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">2 profiles</span>
                      <code className="text-xs font-mono text-foreground">9000000004 / 1234</code>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Sunita [Family] + Ram Prasad [Elder]</p>
                  </div>
                  <div className="p-2.5 bg-white/80 rounded-xl border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">3 profiles</span>
                      <code className="text-xs font-mono text-foreground">9000000009 / 1234</code>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Vikram [Family] + Kamla [Elder] + Gopal [Elder]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
          Register here
        </Link>
      </p>

      {/* Mobile Footer */}
      <p className="lg:hidden mt-6 text-center text-xs text-muted-foreground">
        © 2025 Vayo Aarogya - Healthy Ageing Platform
      </p>
    </div>
  )
}
