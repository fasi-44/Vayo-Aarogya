# Vayo-Aarogya Healthy Ageing App - Development Requirements

## Overview
Build a web application for managing elderly care assessments based on WHO ICOPE framework with 20 health domains.

## Core Features

### 1. Authentication & User Roles
- **4 User Types**: Older adult/family/caregiver, Volunteer, Professional staff, Admin
- Role-based access control with separate login pathways
- Auto-tag all entries with "Entered by: [role]"

### 2. Demographics Module
- Fields: Name, Age, Sex, auto-generated Vayo ID (non-editable)
- Address (village/taluk dropdowns), Caregiver details with click-to-call
- Large fonts, accessible UI

### 3. Baseline Assessment (20 Domains)
- **3-point scale**: 0=No difficulty, 1=Mild, 2=Severe (radio buttons)
- Auto-calculate domain and cumulative scores
- **Key Domains**:
  - Cognition (flag if score=2)
  - Depression (trigger PHQ-2 if needed)
  - Mobility, Vision, Hearing, Falls
  - Sleep, Appetite, Weight, Incontinence
  - Social engagement, Loneliness, IADL, ADL
  - Diabetes, Hypertension, Substance use, Healthcare access

### 4. Health Status Auto-Generation
- Categorize as: "Healthy", "At Risk", "Needs Intervention"
- Color-coded cards with next-step recommendations

### 5. Interventions Module
- Track interventions (physiotherapy, counselling, etc.)
- Auto-tag provider, date/time, user role
- Optional clinical notes field

### 6. Volunteer Mapping (Admin only)
- Register and approve volunteers
- Map volunteers to elders
- Easy reassignment interface

### 7. Follow-Up Assessments
- Same 20 domains with side-by-side previous scores
- Graphical comparison showing trends
- Alerts for high-risk changes

## Role-Specific Dashboards

| Feature | Self/Family | Volunteer | Professional/Admin |
|---------|-------------|-----------|-------------------|
| Dashboard view | Own elder only | Mapped elders | All elders |
| Edit permissions | Recent entries | Verify/update | Full edit |
| Follow-up | Basic reminders | Task list | Oversight tools |
| Risk visibility | Basic status | Prioritized list | Full analytics |
| Reporting | None | None | CSV/PDF export |
| Mapping control | Hidden | View only | Full control |

## Technical Requirements
- Mobile-first responsive design
- Large fonts and accessible UI
- Dropdown menus for standardized inputs
- Auto-calculation and scoring logic
- Notification system for alerts
- Data export functionality (admin only)
- Support for future Kannada language option

## Data Storage
- Use persistent storage for user data, assessments, and mappings
- Implement proper error handling for all storage operations