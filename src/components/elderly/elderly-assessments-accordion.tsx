'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  ClipboardList,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  User,
  Play,
  FileText,
  List,
  BarChart3,
} from 'lucide-react'
import { type SafeUser, type Assessment } from '@/types'
import { getElderlyAssessments } from '@/services/assessments'
import { getRiskLevelDisplay } from '@/lib/assessment-scoring'
import { AssessmentDetailView } from '@/components/assessments'
import { AssessmentComparisonGraph } from './assessment-comparison-graph'
import { formatDate } from '@/lib/utils'

interface ElderlyAssessmentsAccordionProps {
  elderly: SafeUser
}

export function ElderlyAssessmentsAccordion({
  elderly,
}: ElderlyAssessmentsAccordionProps) {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAssessments() {
      if (!elderly?.id) return

      setIsLoading(true)
      try {
        const result = await getElderlyAssessments(elderly.id)
        if (result.success && result.data) {
          setAssessments(result.data.assessments)
        }
      } catch (err) {
        console.error('Failed to load assessments:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAssessments()
  }, [elderly?.id])

  const handleNewAssessment = () => {
    router.push(`/dashboard/assessments/new?elderlyId=${elderly.id}`)
  }

  const handleResumeAssessment = (assessmentId: string) => {
    router.push(`/dashboard/assessments/new?draftId=${assessmentId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Assessments
          </h3>
          <p className="text-sm text-muted-foreground">
            {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Button size="sm" onClick={handleNewAssessment}>
          <Plus className="w-4 h-4 mr-1" />
          New Assessment
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No assessments recorded yet</p>
              <p className="text-sm mt-1">Click "New Assessment" to create one</p>
            </div>
          ) : (
            <Accordion type="single" className="space-y-3">
              {assessments.map((assessment, index) => {
                const riskDisplay = getRiskLevelDisplay(assessment.overallRisk)
                const isDraft = assessment.status === 'draft'

                return (
                  <AccordionItem
                    key={assessment.id}
                    value={assessment.id}
                    className={`border-l-4 rounded-lg ${isDraft ? 'border-l-amber-400 bg-amber-50/50' : getBorderColor(assessment.overallRisk)}`}
                  >
                    <AccordionTrigger value={assessment.id} className="hover:no-underline px-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full ${isDraft ? 'bg-amber-100' : riskDisplay.bgColor} flex items-center justify-center flex-shrink-0`}>
                          {isDraft ? (
                            <FileText className="w-5 h-5 text-amber-600" />
                          ) : (
                            <>
                              {assessment.overallRisk === 'healthy' && (
                                <CheckCircle2 className={`w-5 h-5 ${riskDisplay.color}`} />
                              )}
                              {assessment.overallRisk === 'at_risk' && (
                                <AlertCircle className={`w-5 h-5 ${riskDisplay.color}`} />
                              )}
                              {assessment.overallRisk === 'intervention' && (
                                <AlertTriangle className={`w-5 h-5 ${riskDisplay.color}`} />
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">
                              Assessment #{assessments.length - index}
                            </span>
                            {/* Status Badge */}
                            {isDraft ? (
                              <Badge
                                variant="outline"
                                className="text-xs bg-amber-100 text-amber-700 border-amber-300"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Draft
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Completed
                              </Badge>
                            )}
                            {/* Risk Level Badge - only for completed */}
                            {!isDraft && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${riskDisplay.bgColor} ${riskDisplay.color}`}
                              >
                                {riskDisplay.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(assessment.assessedAt)}
                            </span>
                            {assessment.assessor?.name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {assessment.assessor.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent value={assessment.id} className="px-4 pt-2 pb-4">
                      <div className="space-y-4">
                        {/* Quick Actions */}
                        {isDraft && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleResumeAssessment(assessment.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Resume Assessment
                            </Button>
                          </div>
                        )}

                        {/* Assessment Details - Using shared component (only for completed) */}
                        {!isDraft ? (
                          <AssessmentDetailView
                            assessment={assessment}
                            compact={true}
                            showSubject={false}
                          />
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                            <FileText className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-amber-800 font-medium">Draft Assessment</p>
                            <p className="text-amber-600 text-sm mt-1">
                              This assessment is incomplete. Click "Resume Assessment" to continue.
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <AssessmentComparisonGraph
            assessments={assessments}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getBorderColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'healthy':
      return 'border-l-green-500'
    case 'at_risk':
      return 'border-l-yellow-500'
    case 'intervention':
      return 'border-l-red-500'
    default:
      return 'border-l-gray-300'
  }
}
