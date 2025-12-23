Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Vayo Aarogya - Complete Implementation Plan

 Overview

 Implement the full WHO ICOPE-based elderly care assessment system with end-to-end flow:
 Demographics → Baseline Assessment → Health Status → Interventions → Follow-ups

 User Requirements Summary

 - Vayo ID Format: Sequential (VA00001, VA00002, ...)
 - Location Structure: Generic hierarchical (State → District → Taluk → Village)
 - Assessment Scale: 0 - No difficulty, 1 - Mild (Some Difficulty), 2 - Severe (Needs Intervention)
 - Priority: End-to-End Flow implementation

 ---
 Phase 1: Enhanced Demographics Module

 1.1 Database Schema Updates

 File: prisma/schema.prisma

 Add new models and fields:
 // Add to User model
 vayoId        String?   @unique @map("vayo_id")
 villageName   String?   @map("village_name")
 talukName     String?   @map("taluk_name")
 districtName  String?   @map("district_name")
 stateName     String?   @map("state_name")
 caregiverName String?   @map("caregiver_name")
 caregiverPhone String?  @map("caregiver_phone")
 caregiverRelation String? @map("caregiver_relation")

 // New Location model for dropdowns
 model Location {
   id          String   @id @default(cuid())
   type        String   // state, district, taluk, village
   name        String
   parentId    String?  @map("parent_id")
   parent      Location? @relation("LocationHierarchy", fields: [parentId], references: [id])
   children    Location[] @relation("LocationHierarchy")
   createdAt   DateTime @default(now())

   @@index([type])
   @@index([parentId])
 }

 1.2 Vayo ID Auto-Generation

 File: src/lib/db.ts

 Add method to generate sequential Vayo ID:
 - Query latest vayoId, extract number, increment
 - Format: VA00001, VA00002, etc.
 - Assign on elderly creation

 1.3 Location API

 Files to create:
 - src/app/api/locations/route.ts - GET locations by type/parent
 - src/services/locations.ts - Client service

 1.4 Update Elderly Form

 File: src/components/elderly/elderly-form.tsx

 Add fields:
 - Vayo ID (display only, auto-generated)
 - State dropdown → District → Taluk → Village (cascading)
 - Caregiver section: Name, Phone (with click-to-call), Relation

 1.5 Seed Location Data

 File: prisma/seed.ts

 Add sample hierarchical data:
 - 3-4 states
 - 2-3 districts per state
 - 2-3 taluks per district
 - 3-4 villages per taluk

 ---
 Phase 2: Baseline Assessment System

 2.1 Assessment Form Component

 Files to create:
 - src/components/assessments/assessment-form.tsx - Multi-step form
 - src/components/assessments/domain-section.tsx - Reusable domain section
 - src/components/assessments/score-radio.tsx - 3-point scale radio group

 2.2 20 Domain Sections

 Each domain has:
 - Title and description
 - 2-5 questions with 3-point scale (0, 1, 2)
 - Auto-calculated domain score
 - Risk level indicator
 - Optional notes field

 Domains:
 1. Cognition (flag if any answer = 2)
 2. Depression (trigger PHQ-2 if score >= 2)
 3. Mobility
 4. Vision
 5. Hearing
 6. Falls Risk
 7. Sleep
 8. Appetite/Nutrition
 9. Weight Management
 10. Incontinence
 11. Social Engagement
 12. Loneliness
 13. IADL (Instrumental Activities of Daily Living)
 14. ADL (Activities of Daily Living)
 15. Diabetes Management
 16. Hypertension Management
 17. Substance Use
 18. Healthcare Access
 19. Oral Health
 20. Pain Management

 2.3 Scoring Logic

 File: src/lib/assessment-scoring.ts

 // Domain score = sum of question scores
 // Domain risk level:
 //   0-1 total = healthy (green)
 //   2-3 total = at-risk (yellow)
 //   4+ total = intervention (red)

 // Overall risk = highest domain risk
 // If any domain is "intervention" → overall = intervention
 // If any domain is "at-risk" → overall = at-risk
 // Otherwise → healthy

 2.4 PHQ-2 Depression Screening

 File: src/components/assessments/phq2-dialog.tsx

 Trigger when depression domain score >= 2:
 - 2 standard PHQ-2 questions
 - Score interpretation
 - Recommendation for professional referral

 2.5 Assessment Service

 File: src/services/assessments.ts

 - createAssessment(data) - Submit new assessment
 - getAssessments(filters) - List with filters
 - getAssessmentById(id) - Single assessment
 - updateAssessment(id, data) - Update

 2.6 Assessment Pages

 Files to create:
 - src/app/dashboard/assessments/page.tsx - List all assessments
 - src/app/dashboard/assessments/new/page.tsx - Create new assessment
 - src/app/dashboard/assessments/[id]/page.tsx - View assessment details
 - src/app/dashboard/assessments/[id]/edit/page.tsx - Edit assessment

 2.7 Assessment Components

 - src/components/assessments/assessment-table.tsx - List view
 - src/components/assessments/assessment-card.tsx - Summary card
 - src/components/assessments/index.ts - Exports

 ---
 Phase 3: Health Status Generation

 3.1 Health Status Card Component

 File: src/components/health-status/health-status-card.tsx

 Color-coded cards:
 - Green (Healthy): "Continue current care plan"
 - Yellow (At Risk): "Schedule follow-up within 2 weeks"
 - Red (Needs Intervention): "Immediate professional consultation required"

 3.2 Domain Risk Indicators

 File: src/components/health-status/domain-indicators.tsx

 Visual representation of each domain's risk level with icons.

 3.3 Recommendations Engine

 File: src/lib/recommendations.ts

 Auto-generate next-step recommendations based on:
 - Overall risk level
 - Specific domain flags
 - Previous assessment trends

 ---
 Phase 4: Interventions Module

 4.1 Intervention Service

 File: src/services/interventions.ts

 - CRUD operations
 - Filter by status, priority, domain, assignee
 - Auto-generation from assessment results

 4.2 Intervention Components

 Files to create:
 - src/components/interventions/intervention-form.tsx
 - src/components/interventions/intervention-table.tsx
 - src/components/interventions/intervention-card.tsx
 - src/components/interventions/index.ts

 4.3 Intervention Page

 File: src/app/dashboard/interventions/page.tsx

 Features:
 - List with filters (status, priority, domain)
 - Create new intervention
 - Auto-tag with provider, date/time, user role
 - Clinical notes field
 - Mark complete functionality

 4.4 Auto-Generate Interventions

 When assessment shows risk:
 - Create pending interventions for flagged domains
 - Set priority based on risk level
 - Assign to appropriate provider type

 ---
 Phase 5: Volunteer Management

 5.1 Volunteer Page

 File: src/app/dashboard/volunteers/page.tsx

 Features:
 - List all volunteers with stats
 - Filter by status, capacity
 - View assigned elderly
 - Capacity indicator (assignments/max)

 5.2 Volunteer Components

 - src/components/volunteers/volunteer-table.tsx
 - src/components/volunteers/volunteer-card.tsx
 - src/components/volunteers/assignment-dialog.tsx

 5.3 Bulk Assignment

 File: src/components/volunteers/bulk-assign-dialog.tsx

 Select multiple elderly → assign to single volunteer.

 5.4 Capacity Management

 - Validate against maxAssignments before assigning
 - Show warning when at capacity
 - Prevent over-assignment

 ---
 Phase 6: Follow-up System

 6.1 Follow-up Model Update

 Use existing Intervention model with type field or create dedicated:
 model FollowUp {
   id            String   @id @default(cuid())
   elderlyId     String
   volunteerId   String?
   type          String   // routine, assessment, intervention
   scheduledDate DateTime
   completedDate DateTime?
   status        String   // scheduled, completed, missed, rescheduled
   notes         String?
   assessmentId  String?  // Link to resulting assessment
   // ... relationships
 }

 6.2 Follow-up Pages

 - src/app/dashboard/followups/page.tsx - List & calendar view
 - src/app/dashboard/followups/new/page.tsx - Schedule new

 6.3 Follow-up Components

 - src/components/followups/followup-form.tsx
 - src/components/followups/followup-table.tsx
 - src/components/followups/followup-calendar.tsx

 6.4 Assessment Comparison

 File: src/components/assessments/assessment-comparison.tsx

 Side-by-side view:
 - Previous vs current scores per domain
 - Visual trend indicators (↑ improved, ↓ declined, → same)
 - Highlight significant changes
 - Graphical trends (line chart)

 ---
 Phase 7: Role-Specific Dashboards

 7.1 Dashboard Router

 File: src/app/dashboard/page.tsx (update)

 Render different views based on user role:
 - <AdminDashboard /> for super_admin
 - <ProfessionalDashboard /> for professional
 - <VolunteerDashboard /> for volunteer
 - <FamilyDashboard /> for family
 - <ElderlyDashboard /> for elderly

 7.2 Dashboard Components

 Files to create:
 - src/components/dashboards/admin-dashboard.tsx
 - src/components/dashboards/professional-dashboard.tsx
 - src/components/dashboards/volunteer-dashboard.tsx
 - src/components/dashboards/family-dashboard.tsx
 - src/components/dashboards/elderly-dashboard.tsx

 7.3 Role Features

 | Feature       | Family/Elderly | Volunteer       | Professional/Admin |
 |---------------|----------------|-----------------|--------------------|
 | View          | Own elder only | Assigned elders | All elders         |
 | Edit          | Recent entries | Verify/update   | Full edit          |
 | Assessments   | View status    | Create/view     | Full CRUD          |
 | Interventions | View status    | View tasks      | Full CRUD          |
 | Reports       | None           | None            | CSV/PDF export     |
 | Mapping       | Hidden         | View only       | Full control       |

 ---
 Phase 8: Reporting & Export

 8.1 Report Service

 File: src/services/reports.ts

 - Generate CSV data
 - Generate PDF (using jsPDF or similar)
 - Filter by date range, risk level, domain

 8.2 Reports Page

 File: src/app/dashboard/reports/page.tsx

 Features:
 - Date range selector
 - Filter by district/taluk/village
 - Risk distribution charts
 - Export buttons (CSV, PDF)
 - Analytics dashboard

 8.3 Export Components

 - src/components/reports/export-dialog.tsx
 - src/components/reports/risk-chart.tsx
 - src/components/reports/trend-chart.tsx

 ---
 Implementation Order

 Sprint 1: Foundation

 1. Database schema updates (demographics, location)
 2. Vayo ID generation
 3. Location API and seed data
 4. Update elderly form with new fields

 Sprint 2: Assessment Core

 1. Assessment form component
 2. Domain sections with 3-point scale
 3. Scoring logic
 4. Assessment service
 5. Assessment list page

 Sprint 3: Assessment Flow

 1. Create assessment page
 2. View assessment page
 3. PHQ-2 integration
 4. Health status cards
 5. Domain indicators

 Sprint 4: Interventions

 1. Intervention service
 2. Intervention components
 3. Interventions page
 4. Auto-generation from assessments

 Sprint 5: Volunteers & Follow-ups

 1. Volunteer management page
 2. Bulk assignment
 3. Follow-up scheduling
 4. Follow-up list page

 Sprint 6: Dashboards & Polish

 1. Role-specific dashboard views
 2. Assessment comparison
 3. Trend visualization
 4. Alerts system

 Sprint 7: Reporting

 1. CSV export
 2. PDF generation
 3. Analytics dashboard
 4. Report filters