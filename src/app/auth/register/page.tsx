'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Shield, HeartPulse, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  role: z.string().min(1, 'Please select your role'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [showTerms, setShowTerms] = React.useState(false)
  const [showPrivacy, setShowPrivacy] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const password = watch('password', '')

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || result.error || 'Registration failed. Please try again.')
        return
      }

      // Registration successful - show submission message
      setIsSubmitted(true)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-teal-light via-background to-medical-blue-light flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-medical flex items-center justify-center shadow-lg shadow-primary/25">
                <HeartPulse className="w-9 h-9 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-healthy rounded-full border-2 border-background flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Join Vayo Aarogya</CardTitle>
              <CardDescription>
                Create your account to start caring for elderly health
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isSubmitted ? (
                <div className="py-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-healthy/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-healthy" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Request Submitted Successfully
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      Your registration request has been submitted. You will receive a call shortly from the admin team for further information. Once your account is approved, you will be able to login.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/login">
                        Go to Login Page
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        icon={<User className="w-4 h-4" />}
                        error={errors.name?.message}
                        autoComplete="name"
                        {...register('name')}
                      />
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        icon={<Mail className="w-4 h-4" />}
                        error={errors.email?.message}
                        autoComplete="email"
                        {...register('email')}
                      />
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        icon={<Phone className="w-4 h-4" />}
                        error={errors.phone?.message}
                        autoComplete="tel"
                        {...register('phone')}
                      />
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium">
                        I am registering as
                      </Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => {
                          setSelectedRole(value)
                          setValue('role', value)
                        }}
                      >
                        <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volunteer">Volunteer - Conduct assessments</SelectItem>
                          <SelectItem value="family">Family Member - Monitor loved ones</SelectItem>
                          <SelectItem value="professional">Healthcare Professional</SelectItem>
                          <SelectItem value="elderly">Elderly Individual (60+)</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-destructive">{errors.role.message}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          icon={<Lock className="w-4 h-4" />}
                          error={errors.password?.message}
                          autoComplete="new-password"
                          className="pr-10"
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
                      {/* Password Requirements */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {passwordRequirements.map((req) => (
                          <div key={req.label} className="flex items-center gap-2">
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                req.met ? 'text-healthy' : 'text-muted-foreground/50'
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                req.met ? 'text-healthy' : 'text-muted-foreground'
                              }`}
                            >
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          icon={<Lock className="w-4 h-4" />}
                          error={errors.confirmPassword?.message}
                          autoComplete="new-password"
                          className="pr-10"
                          {...register('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={watch('terms')}
                        onCheckedChange={(checked) => setValue('terms', checked === true)}
                        className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground cursor-pointer select-none leading-tight"
                      >
                        I agree to the{' '}
                        <button type="button" onClick={(e) => { e.preventDefault(); setShowTerms(true) }} className="text-primary hover:underline">
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacy(true) }} className="text-primary hover:underline">
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                    {errors.terms && (
                      <p className="text-sm text-destructive -mt-3">{errors.terms.message}</p>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold group gradient-medical text-white hover:opacity-90"
                      size="lg"
                      loading={isLoading}
                    >
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground font-medium">
                        Already have an account?
                      </span>
                    </div>
                  </div>

                  {/* Login Link */}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/login">
                      Login to Your Account
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3">
              <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Secure & Private</p>
            </div>
            <div className="p-3">
              <CheckCircle2 className="w-6 h-6 text-healthy mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">WHO ICOPE Based</p>
            </div>
            <div className="p-3">
              <HeartPulse className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Elder-Friendly</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © 2025 Vayo Aarogya - Healthy Ageing Platform
      </footer>

      {/* Terms of Service Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p className="text-xs text-muted-foreground">Last updated: January 2025</p>

              <div>
                <h3 className="font-semibold text-foreground mb-1">1. Acceptance of Terms</h3>
                <p>By creating an account on Vayo Aarogya, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not register or use the platform.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">2. Description of Service</h3>
                <p>Vayo Aarogya is a healthy ageing platform based on the WHO ICOPE framework designed to facilitate elderly care assessments, health monitoring, and care coordination. The platform enables volunteers, healthcare professionals, family members, and elderly individuals to collaborate on health management.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">3. Account Registration & Approval</h3>
                <p>All new accounts require administrator approval before access is granted. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">4. User Roles & Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><span className="font-medium text-foreground">Volunteers:</span> Must conduct assessments accurately and report findings truthfully.</li>
                  <li><span className="font-medium text-foreground">Healthcare Professionals:</span> Must provide care recommendations in accordance with professional medical standards.</li>
                  <li><span className="font-medium text-foreground">Family Members:</span> Must provide accurate information about elderly individuals in their care.</li>
                  <li><span className="font-medium text-foreground">Elderly Individuals:</span> Should provide accurate personal health information to the best of their ability.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">5. Health Information Disclaimer</h3>
                <p>Vayo Aarogya is a care coordination and assessment tool. It does not provide medical diagnoses or replace professional medical advice. Health status categories (Healthy, At Risk, Needs Intervention) are based on WHO ICOPE assessment guidelines and are intended to guide care decisions, not serve as clinical diagnoses. Always consult a qualified healthcare professional for medical decisions.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">6. Acceptable Use</h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Share your account credentials with others.</li>
                  <li>Access data of individuals not assigned to your care.</li>
                  <li>Use the platform for any purpose other than elderly care management.</li>
                  <li>Tamper with, disrupt, or attempt to gain unauthorized access to the platform.</li>
                  <li>Upload false or misleading health assessment data.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">7. Data Accuracy</h3>
                <p>You are responsible for ensuring the accuracy of data you enter into the platform, including assessment scores, personal information, and care notes. Inaccurate data may lead to incorrect health status evaluations and inappropriate care recommendations.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">8. Account Suspension & Termination</h3>
                <p>Administrators reserve the right to suspend or terminate accounts that violate these terms, provide inaccurate information, or are inactive for extended periods. You may request account deletion by contacting the administrator.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">9. Limitation of Liability</h3>
                <p>Vayo Aarogya and its operators shall not be liable for any direct, indirect, or consequential damages arising from the use of the platform, including but not limited to health outcomes resulting from assessment recommendations. The platform is provided &quot;as is&quot; without warranties of any kind.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">10. Changes to Terms</h3>
                <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms. Users will be notified of significant changes via the platform.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">11. Contact</h3>
                <p>For questions regarding these terms, please contact the Vayo Aarogya administration team through the platform or your designated administrator.</p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p className="text-xs text-muted-foreground">Last updated: January 2025</p>

              <div>
                <h3 className="font-semibold text-foreground mb-1">1. Information We Collect</h3>
                <p>We collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                  <li><span className="font-medium text-foreground">Account Information:</span> Name, email address, phone number, and role type provided during registration.</li>
                  <li><span className="font-medium text-foreground">Health Assessment Data:</span> Scores and notes from the 20-domain WHO ICOPE-based assessments.</li>
                  <li><span className="font-medium text-foreground">Demographic Data:</span> Age, gender, address, and caregiver details of elderly individuals.</li>
                  <li><span className="font-medium text-foreground">Care Records:</span> Interventions, follow-up schedules, and clinical notes entered by care providers.</li>
                  <li><span className="font-medium text-foreground">Usage Data:</span> Login activity, timestamps, and actions performed on the platform.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">2. How We Use Your Information</h3>
                <p>Your information is used to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                  <li>Facilitate elderly care assessments and health monitoring.</li>
                  <li>Generate health status evaluations and care recommendations.</li>
                  <li>Coordinate care between volunteers, professionals, and family members.</li>
                  <li>Enable administrators to manage user accounts and care assignments.</li>
                  <li>Generate anonymized reports and analytics for care improvement.</li>
                  <li>Communicate important updates about the platform or care activities.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">3. Data Access & Role-Based Visibility</h3>
                <p>Access to data is controlled based on your assigned role:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                  <li><span className="font-medium text-foreground">Elderly / Family Members:</span> Can view data related to their own profile or assigned elderly individuals only.</li>
                  <li><span className="font-medium text-foreground">Volunteers:</span> Can access data of elderly individuals assigned to them.</li>
                  <li><span className="font-medium text-foreground">Healthcare Professionals:</span> Can access data of elderly individuals under their care.</li>
                  <li><span className="font-medium text-foreground">Administrators:</span> Have access to all platform data for management and oversight purposes.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">4. Data Protection & Security</h3>
                <p>We implement appropriate technical and organizational measures to protect your personal and health data, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                  <li>Encrypted data transmission using HTTPS.</li>
                  <li>Secure password hashing and storage.</li>
                  <li>Role-based access controls to limit data visibility.</li>
                  <li>Regular security reviews and updates.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">5. Health Data Sensitivity</h3>
                <p>We recognize that health assessment data is sensitive. All health-related information is treated with the highest level of care. Health data is only accessible to authorized users directly involved in the care of the respective elderly individual. We do not sell, share, or disclose individual health data to third parties.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">6. Data Retention</h3>
                <p>Account and health data is retained for as long as the account is active or as required for care continuity. Upon account deletion, personal data will be removed, though anonymized assessment data may be retained for research and reporting purposes.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">7. Data Sharing</h3>
                <p>We do not share your personal data with third parties except:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                  <li>When required by law or legal process.</li>
                  <li>To protect the safety of elderly individuals in emergency situations.</li>
                  <li>In anonymized, aggregated form for research or public health reporting.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">8. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction of inaccurate personal data.</li>
                  <li>Request deletion of your account and associated data.</li>
                  <li>Withdraw consent for data processing (which may affect your ability to use the platform).</li>
                </ul>
                <p className="mt-1">To exercise these rights, contact the Vayo Aarogya administration team.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">9. Cookies & Local Storage</h3>
                <p>The platform uses secure HTTP-only cookies for authentication purposes. No third-party tracking cookies are used. Session data is stored securely and cleared upon logout.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">10. Changes to This Policy</h3>
                <p>We may update this Privacy Policy from time to time. Users will be notified of significant changes. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-1">11. Contact</h3>
                <p>For privacy-related inquiries or to exercise your data rights, please contact the Vayo Aarogya administration team through the platform or your designated administrator.</p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
