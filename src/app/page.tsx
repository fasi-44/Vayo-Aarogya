'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Heart,
  Users,
  Brain,
  Eye,
  Ear,
  Activity,
  Shield,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
  HeartPulse,
  UserCheck,
  ClipboardCheck,
  TrendingUp,
  Clock,
  HandHeart,
  Footprints,
  Pill,
  Home,
  Smile,
  Leaf,
  Sun,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
}

// Wave SVG Component
const WaveDivider = ({ className = '', flip = false, color = '#ffffff' }: { className?: string; flip?: boolean; color?: string }) => (
  <div className={`wave-divider ${className}`} style={{ transform: flip ? 'rotate(180deg)' : 'none' }}>
    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <path
        d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
        fill={color}
      />
    </svg>
  </div>
)

// Curved Wave Component
const CurvedWave = ({ className = '', color = '#22c55e' }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <path
      d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,154.7C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      fill={color}
      fillOpacity="0.1"
    />
  </svg>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-glow transition-shadow duration-300">
                <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground">Vayo Aarogya</h1>
                <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">Healthy Ageing Platform</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#assessments" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Assessments
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-primary hover:bg-primary/5">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="gradient-primary text-white hover:opacity-90 shadow-lg shadow-primary/25 rounded-xl">
                  <span className="hidden sm:inline">Create New account</span>
                  <span className="sm:hidden">Register</span>
                  <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-40 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 gradient-mesh" />
          <div className="blob-primary w-[800px] h-[800px] -top-40 -right-40 animate-float-slow" />
          <div className="blob-secondary w-[600px] h-[600px] top-40 -left-40 animate-float-slower" />
          <div className="blob-accent w-[400px] h-[400px] bottom-0 right-1/4 animate-float" />
          <div className="blob-coral w-[300px] h-[300px] top-1/3 right-1/3 animate-float-slow" />
          {/* Floating shapes */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary-400 rounded-full animate-float opacity-40" />
          <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-secondary-400 rounded-full animate-float-slow opacity-30" />
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-accent-400 rounded-full animate-float-slower opacity-50" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-5xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-50 border border-primary-200 mb-8 shadow-soft">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">WHO ICOPE Framework Based</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-[1.1]"
            >
              Empowering{' '}
              <span className="text-gradient-primary">Healthy Ageing</span>
              <br className="hidden sm:block" />
              <span className="text-gradient-warm"> for Every Elder</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Comprehensive health assessment platform built with care. Track 20 health domains, identify risks early, and provide timely support.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/auth/register">
                <Button size="lg" className="gradient-primary text-white hover:opacity-90 h-14 px-10 text-lg shadow-xl shadow-primary/30 rounded-2xl group">
                  Create New account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-2xl border-2 hover:bg-primary-50 hover:border-primary group">
                <Play className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
              {[
                { icon: Shield, text: 'WHO Guidelines', color: 'text-primary' },
                { icon: CheckCircle2, text: 'Evidence-Based', color: 'text-healthy' },
                { icon: Heart, text: 'Elder-Friendly', color: 'text-coral-500' },
                { icon: Star, text: 'Trusted by 10,000+', color: 'text-accent-500' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm shadow-soft">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto"
          >
            {[
              { number: '20+', label: 'Health Domains', icon: ClipboardCheck, color: 'from-primary-500 to-primary-600' },
              { number: '10,000+', label: 'Elders Assessed', icon: Users, color: 'from-secondary-400 to-secondary-500' },
              { number: '500+', label: 'Active Volunteers', icon: HandHeart, color: 'from-coral-400 to-coral-500' },
              { number: '95%', label: 'Early Detection', icon: TrendingUp, color: 'from-accent-400 to-accent-500' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <Card className="border-0 shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-5 lg:p-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <stat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-3xl lg:text-4xl font-bold text-foreground mb-1">{stat.number}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <WaveDivider color="hsl(142 76% 96%)" />
        </div>
      </section>

      {/* Assessment Domains Section */}
      <section id="assessments" className="py-24 bg-primary-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pattern-dots opacity-50" />
        <CurvedWave className="absolute top-0 left-0 right-0 h-32 opacity-50" color="#22c55e" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              <Leaf className="w-4 h-4" />
              Health Domains
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Comprehensive <span className="text-gradient-primary">20-Domain</span> Assessment
            </h2>
            <p className="text-lg text-muted-foreground">
              Based on WHO ICOPE framework, covering all aspects of elderly health and wellbeing
            </p>
          </motion.div>

          {/* Domain Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
            {[
              { icon: Brain, name: 'Cognition', color: 'from-purple-400 to-purple-500', bg: 'bg-purple-50' },
              { icon: Footprints, name: 'Mobility', color: 'from-blue-400 to-blue-500', bg: 'bg-blue-50' },
              { icon: Activity, name: 'Nutrition', color: 'from-primary-400 to-primary-500', bg: 'bg-primary-50' },
              { icon: Eye, name: 'Vision', color: 'from-amber-400 to-amber-500', bg: 'bg-amber-50' },
              { icon: Ear, name: 'Hearing', color: 'from-pink-400 to-pink-500', bg: 'bg-pink-50' },
              { icon: Heart, name: 'Mental Health', color: 'from-red-400 to-red-500', bg: 'bg-red-50' },
              { icon: Users, name: 'Social Health', color: 'from-indigo-400 to-indigo-500', bg: 'bg-indigo-50' },
              { icon: Pill, name: 'Medication', color: 'from-cyan-400 to-cyan-500', bg: 'bg-cyan-50' },
              { icon: Shield, name: 'Fall Risk', color: 'from-orange-400 to-orange-500', bg: 'bg-orange-50' },
              { icon: Home, name: 'Daily Activities', color: 'from-teal-400 to-teal-500', bg: 'bg-teal-50' },
            ].map((domain, index) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white group">
                  <CardContent className="p-5 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${domain.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <domain.icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="font-semibold text-foreground">{domain.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link href="/auth/register">
              <Button variant="outline" size="lg" className="rounded-2xl border-2 border-primary hover:bg-primary hover:text-white transition-all duration-300">
                View All 20 Domains
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <WaveDivider color="hsl(var(--background))" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 blob-sage w-[600px] h-[600px] animate-float-slow" />
        <div className="absolute bottom-0 left-0 blob-coral w-[400px] h-[400px] animate-float" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wider mb-4">
              <Sun className="w-4 h-4" />
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Complete Elderly <span className="text-gradient-warm">Care Ecosystem</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to monitor, assess, and improve elderly health outcomes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: ClipboardCheck,
                title: 'Health Assessments',
                description: 'Conduct comprehensive assessments across 20 health domains with guided questionnaires.',
                gradient: 'from-primary-500 to-primary-600',
              },
              {
                icon: TrendingUp,
                title: 'Risk Categorization',
                description: 'Auto-score assessments and categorize into Healthy, At Risk, or Needs Intervention.',
                gradient: 'from-secondary-400 to-secondary-500',
              },
              {
                icon: HandHeart,
                title: 'Volunteer Mapping',
                description: 'Connect elderly individuals with trained volunteers for regular check-ins and support.',
                gradient: 'from-coral-400 to-coral-500',
              },
              {
                icon: Clock,
                title: 'Follow-up Tracking',
                description: 'Schedule and track follow-up assessments to monitor progress over time.',
                gradient: 'from-accent-400 to-accent-500',
              },
              {
                icon: Users,
                title: 'Family Portal',
                description: 'Keep family members informed with shared access to health reports and updates.',
                gradient: 'from-purple-400 to-purple-500',
              },
              {
                icon: Activity,
                title: 'Intervention Plans',
                description: 'Generate personalized intervention recommendations based on assessment results.',
                gradient: 'from-sage-400 to-sage-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2 bg-white group overflow-hidden">
                  <CardContent className="p-6 lg:p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Levels Section */}
      <section className="py-24 gradient-nature text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-2 border-white/20 animate-float-slow" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-2 border-white/10 animate-float" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full bg-white/5 animate-float-slower" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Smart Risk Categorization
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Our assessment automatically categorizes elderly health status for timely interventions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[
              {
                level: 'Healthy',
                description: 'No significant health concerns. Continue regular monitoring.',
                color: 'bg-healthy',
                icon: CheckCircle2,
                percentage: '45%',
              },
              {
                level: 'At Risk',
                description: 'Early warning signs detected. Preventive measures recommended.',
                color: 'bg-at-risk',
                icon: Clock,
                percentage: '35%',
              },
              {
                level: 'Needs Intervention',
                description: 'Immediate attention required. Connect with healthcare provider.',
                color: 'bg-intervention',
                icon: Activity,
                percentage: '20%',
              },
            ].map((item, index) => (
              <motion.div
                key={item.level}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-20 h-20 rounded-full ${item.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.level}</h3>
                <p className="text-white/70 mb-6">{item.description}</p>
                <div className="text-5xl font-bold mb-2">{item.percentage}</div>
                <p className="text-white/50 text-sm">of assessed population</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-calm" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Simple <span className="text-gradient-primary">4-Step</span> Process
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started with elderly health assessments in minutes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Register Elder',
                description: 'Add elderly person details and assign a volunteer for regular check-ins.',
                icon: UserCheck,
                color: 'from-primary-500 to-primary-600',
              },
              {
                step: '02',
                title: 'Conduct Assessment',
                description: 'Complete the 20-domain health assessment using guided questionnaires.',
                icon: ClipboardCheck,
                color: 'from-secondary-400 to-secondary-500',
              },
              {
                step: '03',
                title: 'Review Results',
                description: 'Get instant risk categorization and personalized recommendations.',
                icon: TrendingUp,
                color: 'from-coral-400 to-coral-500',
              },
              {
                step: '04',
                title: 'Track Progress',
                description: 'Schedule follow-ups and monitor health improvements over time.',
                icon: Activity,
                color: 'from-accent-400 to-accent-500',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${item.color} text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                    {item.step}
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-soft flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%]">
                    <div className="border-t-2 border-dashed border-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-24 bg-warmgray-50 relative overflow-hidden">
        <CurvedWave className="absolute top-0 left-0 right-0 h-32" color="#f97316" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-coral-500 uppercase tracking-wider mb-4">
              <Heart className="w-4 h-4" />
              For Everyone
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Designed for All <span className="text-gradient-warm">Stakeholders</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Healthcare Professionals',
                description: 'Access comprehensive reports, manage interventions, and oversee community health programs.',
                features: ['Full assessment access', 'Intervention management', 'Analytics dashboard'],
                icon: Smile,
                gradient: 'from-primary-500 to-primary-600',
              },
              {
                title: 'Volunteers',
                description: 'Conduct assessments, track assigned elders, and report health changes.',
                features: ['Mobile-friendly interface', 'Elderly assignment', 'Follow-up reminders'],
                icon: HandHeart,
                gradient: 'from-secondary-400 to-secondary-500',
              },
              {
                title: 'Family Members',
                description: 'Stay informed about your loved ones health status and progress.',
                features: ['Health reports access', 'Notification alerts', 'Care coordination'],
                icon: Heart,
                gradient: 'from-coral-400 to-coral-500',
              },
            ].map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="h-full border-0 shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white">
                  <div className={`h-2 bg-gradient-to-r ${role.gradient}`} />
                  <CardContent className="p-6 lg:p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <role.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{role.title}</h3>
                    <p className="text-muted-foreground mb-6">{role.description}</p>
                    <ul className="space-y-3">
                      {role.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-healthy-light flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-healthy" />
                          </div>
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-warm text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="blob-sage w-[600px] h-[600px] -bottom-40 -left-40 opacity-30 animate-float-slow" />
          <div className="blob-accent w-[500px] h-[500px] -top-40 -right-20 opacity-20 animate-float" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Start Caring for Your Elders Today
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Join thousands of families and healthcare providers using Vayo Aarogya for better elderly care.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-coral-600 hover:bg-white/90 h-14 px-10 text-lg rounded-2xl shadow-xl font-semibold group">
                  Create New account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#contact">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 relative">
        <div className="absolute inset-0 gradient-calm" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              <Mail className="w-4 h-4" />
              Contact Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Have questions about elderly care? We are here to help.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Mail, title: 'Email', info: 'care@vayo.health', link: 'mailto:care@vayo.health', color: 'from-primary-500 to-primary-600' },
              { icon: Phone, title: 'Helpline', info: '1800-VAYO-CARE', link: 'tel:1800829622', color: 'from-secondary-400 to-secondary-500' },
              { icon: MapPin, title: 'Office', info: 'New Delhi, India', link: '#', color: 'from-coral-400 to-coral-500' },
            ].map((contact, index) => (
              <motion.a
                key={contact.title}
                href={contact.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="block p-8 rounded-3xl bg-white border border-border hover:border-primary/50 hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2 text-center group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <contact.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{contact.title}</h3>
                <p className="text-muted-foreground">{contact.info}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-warmgray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <HeartPulse className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Vayo Aarogya</h1>
                  <p className="text-[10px] text-white/50">Healthy Ageing Platform</p>
                </div>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed">
                Empowering healthy ageing through comprehensive health assessments based on WHO ICOPE framework.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white">Platform</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="#features" className="hover:text-primary-400 transition-colors">Features</Link></li>
                <li><Link href="#assessments" className="hover:text-primary-400 transition-colors">Assessments</Link></li>
                <li><Link href="#how-it-works" className="hover:text-primary-400 transition-colors">How It Works</Link></li>
                <li><Link href="/auth/register" className="hover:text-primary-400 transition-colors">Create New account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white">Resources</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="#" className="hover:text-primary-400 transition-colors">WHO ICOPE Guidelines</Link></li>
                <li><Link href="#" className="hover:text-primary-400 transition-colors">Volunteer Training</Link></li>
                <li><Link href="#" className="hover:text-primary-400 transition-colors">Help Center</Link></li>
                <li><Link href="#contact" className="hover:text-primary-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-white">Legal</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary-400 transition-colors">Data Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="divider-gradient opacity-20 mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm">
              © 2025 Vayo Aarogya - Healthy Ageing Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Shield className="w-4 h-4 text-primary-400" />
              <span>WHO ICOPE Framework Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
