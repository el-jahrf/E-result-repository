<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# E-result — Agent Instructions

## Project Identity

E-result is a school result-management platform.

It is NOT a university or college CGPA system.

The system is designed to manage students, teachers, classes, subjects, academic sessions, results, grading, performance metrics, approvals, and published student results.

---

# Product Requirements

## School Levels

The system supports:

- Pre-Nursery
- Nursery
- Primary 1
- Primary 2
- Primary 3
- Primary 4
- Primary 5
- JSS1
- JSS2
- JSS3
- SS1
- SS2
- SS3

Primary 6 is excluded.

SS1–SS3 have:

- Science
- Arts
- Commercial

Do not introduce a different school structure unless explicitly requested.

---

# Academic Sessions

Initial session:

2025/2026

Each academic session contains:

- First Term
- Second Term
- Third Term

Admin can create future sessions.

Historical sessions and results must remain available.

---

# User Roles

The system has four roles:

## Admin

Admin manages:

- Students
- Teachers
- Classes
- Subjects
- Academic sessions
- Teacher assignments
- Grading scale
- Results
- Result publication
- System settings
- Audit information

## Principal

Principal can:

- Review results
- Handle result approval responsibilities
- Enter principal remarks
- Manage school announcements where applicable

## Teacher

Teachers can:

- Access assigned classes
- Access assigned subjects
- Enter CA scores
- Enter examination scores
- Enter teacher remarks
- Submit results
- Distribute permitted take-home assignments

Teachers must not access classes or subjects that are not assigned to them.

## Student

Students can:

- Log in individually
- View published results
- View performance information
- View announcements
- Print results
- Download results

Students must not access unpublished results or administrative functions.

---

# Result System

The system uses:

- Continuous Assessment: 40 marks
- Examination: 60 marks
- Total: 100 marks

Formula:

Total = CA + Examination

The grading scale is configurable by Admin.

Do NOT introduce:

- CGPA
- GPA
- Credit units
- University semesters

This is a school result-management platform.

---

# Performance Metrics

The system supports:

- Student scoring average
- Class scoring average
- Subject average
- Performance rate
- Student position
- Grade
- Remark

The system calculates these values automatically where appropriate.

Admin overrides must be controlled and auditable.

---

# Result Workflow

Results follow:

DRAFT
→ SUBMITTED
→ APPROVED
→ PUBLISHED

Results may also be:

REJECTED

Students can only access published results.

Do not bypass the approval and publication workflow.

---

# Assignment Feature

Teachers can distribute inter-term take-home assignments.

The agreed feature does not require:

- Assignment deadlines
- Student attachment uploads

Do not add these requirements unless explicitly requested.

---

# Technical Stack

Current stack:

- Next.js 16
- App Router
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL 18
- Prisma 7.10
- pnpm 11.24.0

The repository root is the application.

Do not create a second nested Next.js application.

---

# Database

Database:

e_result

Prisma schema:

prisma/schema.prisma

Prisma configuration:

prisma.config.ts

Migrations:

prisma/migrations

Environment variables:

.env

Never commit `.env`.

Never expose:

- Database passwords
- DATABASE_URL
- API keys
- Authentication secrets
- Tokens

---

# Existing Prisma Models

The current schema contains:

- User
- Student
- Teacher
- Class
- Subject
- AcademicSession
- Enrollment
- TeacherAssignment
- Result
- GradingScale
- Assignment
- AuditLog

Inspect the existing schema before creating new models.

Do not create duplicate models.

---

# Development Rules

Before implementing a feature:

1. Understand the requirement.
2. Inspect the existing project.
3. Inspect relevant database models.
4. Reuse existing code where appropriate.
5. Make the smallest coherent change.
6. Validate the change.
7. Clearly report what changed.

Do not blindly overwrite existing files.

Do not create duplicate routes, components, models, or utilities without checking the project first.

---

# Security

Authorization must be enforced server-side.

UI restrictions alone are not security.

For example:

A teacher must not gain access to another teacher's class by manually changing a URL.

A student must not retrieve unpublished results through a direct request.

Admin-only operations must be protected on the server.

Validate important input.

Handle errors safely.

Never expose sensitive information.

---

# UI/UX

The application should look like a professional modern school-management SaaS platform.

Prioritize:

- Clear navigation
- Strong visual hierarchy
- Consistent spacing
- Professional typography
- Responsive layouts
- Accessible forms
- Clean tables
- Professional result sheets
- Useful dashboards
- Minimal visual clutter

The default Next.js starter interface should eventually be replaced with the actual E-result design.

---

# Project Roadmap

## Milestone 1 — Foundation

- GitHub repository
- Next.js
- TypeScript
- Tailwind
- PostgreSQL
- Prisma
- Database schema
- Initial migration
- Agent instructions
- Design system
- Application shell

## Milestone 2 — Authentication

- Login
- Authentication
- Sessions
- Role-based authorization
- Admin dashboard
- Principal dashboard
- Teacher dashboard
- Student dashboard

## Milestone 3 — Administration

- Academic sessions
- Terms
- Classes
- SS arms
- Subjects
- Teachers
- Students
- Teacher assignments
- Enrollments

## Milestone 4 — Results

- CA entry
- Exam entry
- Total calculation
- Grade calculation
- Student averages
- Class averages
- Subject averages
- Performance rate
- Positions
- Teacher remarks
- Submission
- Approval
- Rejection
- Publication
- Admin overrides

## Milestone 5 — Student Experience

- Student dashboard
- Published results
- Result history
- Performance overview
- Print
- Download
- Announcements

## Milestone 6 — Teacher & Principal

- Teacher tools
- Principal tools
- Principal remarks
- Announcements
- Take-home assignments

## Milestone 7 — Hardening

- Grading configuration
- Audit logs
- Validation
- Security review
- Accessibility
- Responsive improvements
- Error handling

## Milestone 8 — Deployment

- Testing
- Production build
- Environment configuration
- Deployment
- Documentation

---

# Architecture Rules

Do not make major architectural changes without explaining:

1. Why the change is necessary.
2. What it affects.
3. What alternatives exist.
4. Why the proposed approach is preferable.

Do not change the technology stack unnecessarily.

Do not replace working architecture simply because another approach is more familiar.

---

# Requirement Discipline

The agreed project requirements are authoritative.

If a requested change conflicts with an existing requirement:

1. Identify the conflict.
2. Explain it.
3. Ask for confirmation before changing the requirement.

Do not silently alter the product.

---

# Code Quality

Prefer:

- Reusable components
- Clear naming
- Strong TypeScript types
- Server-side validation
- Maintainable database queries
- Loading states
- Error states
- Empty states
- Accessible interfaces

Avoid:

- Huge monolithic components
- Repeated code
- Unnecessary dependencies
- Hard-coded configurable business rules
- Temporary hacks presented as final architecture

---

# Validation

After changes, run the relevant validation.

Depending on the change:

- Prisma validation
- TypeScript checks
- ESLint
- Tests
- Next.js build

Never claim something works without checking it when checking is reasonably possible.

---

# Git

Keep commits focused.

Use descriptive commit messages such as:

feat: add authentication foundation

feat: add teacher result entry

fix: correct performance calculation

refactor: improve result calculation service

chore: update Prisma schema

Do not mix unrelated changes into one commit.

---

# Development Sequence

Build the application progressively:

Foundation
→ Design System
→ Application Shell
→ Authentication
→ Authorization
→ Administration
→ Result Management
→ Student Experience
→ Teacher/Principal Tools
→ Settings
→ Testing
→ Deployment

Do not rush through multiple milestones simultaneously.

Preserve the agreed product requirements throughout development.

# E-RESULT PROJECT RULES

## Project Identity

E-result is a school result-management platform.

It is NOT a university or college CGPA system.

The platform manages students, teachers, classes, subjects, academic sessions, results, grading, performance metrics, approvals, and published student results.

## Product Requirements

### School Levels

Supported levels:

- Pre-Nursery
- Nursery
- Primary 1
- Primary 2
- Primary 3
- Primary 4
- Primary 5
- JSS1
- JSS2
- JSS3
- SS1
- SS2
- SS3

Primary 6 is excluded.

SS1–SS3 have:

- Science
- Arts
- Commercial

Do not invent additional school structures unless explicitly requested.

### Academic Sessions

Initial academic session:

2025/2026

Terms:

- First Term
- Second Term
- Third Term

Admin can create future sessions.

Historical sessions and results must remain accessible.

### Roles

Four primary roles exist:

- ADMIN
- PRINCIPAL
- TEACHER
- STUDENT

Admin controls school-wide system administration.

Principal reviews and approves results where authorized and can enter principal remarks.

Teachers manage only their assigned classes and subjects and can enter and submit results.

Students can view only their own published results and permitted student information.

### Result Scoring

This is NOT a CGPA/GPA system.

Scores are:

- Continuous Assessment: 40
- Examination: 60
- Total: 100

Formula:

Total = CA + Examination

The grading scale must be configurable by Admin.

### Performance

The system uses:

- Student scoring average
- Class scoring average
- Subject average
- Performance rate
- Position
- Grade
- Remark

Do not replace these with CGPA or university-style metrics.

### Result Workflow

Results follow:

DRAFT → SUBMITTED → APPROVED → PUBLISHED

A result can also be:

REJECTED

Students must only see published results.

Do not bypass the approval/publication workflow.

### Assignments

Teachers can distribute inter-term take-home assignments.

The agreed feature does not require:

- Assignment deadlines
- Student attachment uploads

Do not add those requirements unless explicitly requested.

---

# TECHNICAL STACK

Current stack:

- Next.js 16
- App Router
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL 18
- Prisma 7.10
- pnpm 11.24.0

The repository root is the application.

Do not create another nested Next.js application.

## Database

Database:

`e_result`

Prisma schema:

`prisma/schema.prisma`

Prisma configuration:

`prisma.config.ts`

Migrations:

`prisma/migrations`

Environment variables:

`.env`

Never commit `.env` or expose:

- DATABASE_URL
- Database passwords
- API keys
- Authentication secrets
- Tokens

## Existing Prisma Models

The current schema contains:

- User
- Student
- Teacher
- Class
- Subject
- AcademicSession
- Enrollment
- TeacherAssignment
- Result
- GradingScale
- Assignment
- AuditLog

Inspect the existing schema before creating new models.

Do not create duplicate models.

---

# DEVELOPMENT RULES

Before implementing anything:

1. Understand the requirement.
2. Inspect the existing project.
3. Inspect relevant models and routes.
4. Reuse existing code where appropriate.
5. Make the smallest coherent change.
6. Validate the change.
7. Report what changed.

Never blindly overwrite working code.

Do not create duplicate routes, components, models, or utilities.

## Security

Authorization must be enforced server-side.

UI restrictions alone are not security.

Teachers must only access their assigned classes and subjects.

Students must only access their own published results.

Admin-only operations must be protected server-side.

Validate important input and handle errors safely.

Never expose sensitive information.

---

# UI/UX DIRECTION

The final application should look like a professional modern school-management SaaS platform.

Prioritize:

- Clear navigation
- Strong visual hierarchy
- Consistent spacing
- Professional typography
- Responsive layouts
- Accessible forms
- Clean academic tables
- Professional result sheets
- Useful dashboards
- Minimal visual clutter

Replace the default Next.js starter interface as development progresses.

---

# ROADMAP

## Milestone 1 — Foundation

- Repository
- Next.js
- TypeScript
- Tailwind
- PostgreSQL
- Prisma
- Database schema
- Initial migration
- Agent instructions
- Design system
- Application shell

## Milestone 2 — Authentication

- Login
- Authentication
- Sessions
- Role-based authorization
- Admin dashboard
- Principal dashboard
- Teacher dashboard
- Student dashboard

## Milestone 3 — Administration

- Academic sessions
- Terms
- Classes
- SS arms
- Subjects
- Teachers
- Students
- Teacher assignments
- Enrollments

## Milestone 4 — Results

- CA entry
- Examination entry
- Total calculation
- Grade calculation
- Student averages
- Class averages
- Subject averages
- Performance rate
- Positions
- Teacher remarks
- Submission
- Approval
- Rejection
- Publication
- Admin overrides

## Milestone 5 — Student Experience

- Student dashboard
- Published results
- Result history
- Performance overview
- Printing
- Downloading
- Announcements

## Milestone 6 — Teacher & Principal

- Teacher tools
- Principal tools
- Principal remarks
- Announcements
- Take-home assignments

## Milestone 7 — Hardening

- Grading configuration
- Audit logs
- Validation
- Security review
- Accessibility
- Responsive improvements
- Error handling

## Milestone 8 — Deployment

- Testing
- Production build
- Environment configuration
- Deployment
- Documentation

---

# ARCHITECTURE RULE

Do not make major architectural changes without explaining:

1. Why the change is necessary.
2. What it affects.
3. What alternatives exist.
4. Why the proposed approach is preferable.

Do not replace the technology stack unnecessarily.

If a requested change conflicts with an existing product requirement, identify the conflict before changing it.

---

# CODE QUALITY

Prefer:

- Reusable components
- Clear naming
- Strong TypeScript types
- Server-side validation
- Maintainable database queries
- Loading states
- Error states
- Empty states
- Accessible interfaces

Avoid:

- Huge monolithic components
- Repeated code
- Unnecessary dependencies
- Hard-coded configurable business rules
- Temporary hacks presented as final architecture

---

# VALIDATION

After changes, run appropriate checks such as:

- Prisma validation
- TypeScript checks
- ESLint
- Tests
- Next.js build

Do not claim something works without validating it when reasonably possible.

---

# GIT DISCIPLINE

Keep commits focused.

Use descriptive commits such as:

`feat: add authentication foundation`

`feat: add teacher result entry`

`fix: correct performance calculation`

`refactor: improve result calculation service`

`chore: update Prisma schema`

Do not mix unrelated changes into one commit.

---

# DEVELOPMENT SEQUENCE

Build progressively:

Foundation
→ Design System
→ Application Shell
→ Authentication
→ Authorization
→ Administration
→ Result Management
→ Student Experience
→ Teacher/Principal Tools
→ Settings
→ Testing
→ Deployment

Do not rush through multiple milestones simultaneously.

Preserve the agreed product requirements throughout development.