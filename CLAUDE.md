@AGENTS.md
# CLAUDE.md — E-result Project Instructions

Read `AGENTS.md` first. It contains the shared project rules and locked product requirements.

## Mission

Build and maintain the E-result school result-management platform from the existing repository.

This is a school result-management system. It is NOT a university or college CGPA system.

Work incrementally, preserve the existing architecture, and inspect existing code before making changes.

---

# 1. PRODUCT REQUIREMENTS

## School Structure

The system supports:

- Pre-Nursery
- Nursery
- Primary 1
- Primary 2
- Primary 3
- Primary 4
- Primary 5
- Primary 6 is excluded
- JSS1
- JSS2
- JSS3
- SS1
- SS2
- SS3

SS1–SS3 have:

- Science
- Arts
- Commercial

Do not invent additional school structures unless explicitly requested.

---

# 2. ACADEMIC SESSIONS

The initial academic session is:

`2025/2026`

The system must support:

- First Term
- Second Term
- Third Term

Admin can create future academic sessions.

Historical academic sessions and their results must remain accessible.

Do not delete historical results simply because a new session becomes current.

---

# 3. USER ROLES

There are four primary roles:

### ADMIN

Admin controls the system.

Admin can manage:

- Students
- Teachers
- Classes
- Subjects
- Academic sessions
- Teacher assignments
- Grading scale
- System settings
- Result administration
- Result publication
- Audit information

### PRINCIPAL

Principal can:

- Review results
- Oversee result approval
- Enter principal remarks
- Manage school announcements where permitted by the product requirements

Principal responsibilities must not be casually assigned to teachers or students.

### TEACHER

Teachers can:

- View assigned classes
- View assigned subjects
- Enter CA scores
- Enter examination scores
- Enter teacher remarks
- Submit results
- Manage permitted take-home assignments

Teachers must only access classes and subjects assigned to them.

### STUDENT

Students can:

- Log in individually
- View published results
- View performance information
- View announcements
- Print results
- Download results

Students must not access unpublished results or administrative functionality.

---

# 4. GRADING AND SCORING

This system does NOT use:

- CGPA
- GPA
- Credit units
- Semester-based university grading

The school result system uses:

- Continuous Assessment (CA): 40 marks
- Examination: 60 marks
- Total: 100 marks

The system calculates:

`Total = CA + Examination`

The grading scale must be configurable by Admin.

Do not hard-code university-style grading.

---

# 5. PERFORMANCE METRICS

The system should support:

- Student scoring average
- Class scoring average
- Subject average
- Performance rate
- Student position
- Class position where applicable
- Grade
- Remark

Performance rate must not be replaced with CGPA.

Calculated values should be generated consistently by the application.

Where Admin overrides a calculated value, the override should be controlled and auditable.

---

# 6. RESULT WORKFLOW

Results follow a controlled workflow:

`DRAFT → SUBMITTED → APPROVED → PUBLISHED`

A result may also be:

`REJECTED`

Teachers normally prepare and submit results.

Authorized administrative/principal workflows handle approval.

Only published results should be visible to students.

Do not bypass the result approval/publication process simply to make the UI easier.

---

# 7. ASSIGNMENTS

Teachers can distribute inter-term take-home assignments.

The agreed assignment feature does NOT require:

- Assignment deadlines
- Student attachment uploads

Do not add these requirements unless explicitly requested.

---

# 8. TECHNICAL STACK

The project currently uses:

- Next.js 16
- App Router
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL 18
- Prisma 7.10
- pnpm 11.24.0

The repository root is the application.

Do NOT create another nested Next.js application.

---

# 9. DATABASE

Database:

`e_result`

Database technology:

PostgreSQL

Prisma schema:

`prisma/schema.prisma`

Prisma configuration:

`prisma.config.ts`

Migrations:

`prisma/migrations`

Environment variables belong in:

`.env`

Never commit:

- DATABASE_URL
- Passwords
- API keys
- Authentication secrets
- Tokens
- Other credentials

Never expose secrets in client-side code.

---

# 10. CURRENT DATABASE MODELS

The current Prisma schema already contains the major models:

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

Before creating a new model, inspect the existing schema.

Do not create duplicate models when an existing model can be extended.

---

# 11. DEVELOPMENT RULES

Before implementing any feature:

1. Understand the requirement.
2. Inspect the existing code.
3. Inspect the relevant database model if applicable.
4. Determine whether existing functionality can be reused.
5. Make the smallest coherent change.
6. Validate the change.
7. Report what was changed.

Never blindly overwrite working code.

Never create duplicate routes, components, models, or utilities without checking whether one already exists.

---

# 12. SECURITY

Security must be enforced server-side.

Hiding a button in the UI is NOT sufficient authorization.

Examples:

A teacher must not be able to access another teacher's class simply by manually changing a URL.

A student must not be able to retrieve unpublished results by manipulating a request.

Admin-only operations must have server-side authorization.

Validate all important user input.

Handle errors safely.

Never reveal sensitive database or authentication information to users.

---

# 13. UI/UX DIRECTION

The application should look like a professional modern school-management SaaS platform.

Prioritize:

- Clean visual hierarchy
- Professional typography
- Consistent spacing
- Responsive layouts
- Accessible forms
- Clear navigation
- Useful dashboards
- Clean academic tables
- Professional result sheets
- Minimal visual clutter
- Good mobile responsiveness

Do not retain the default Next.js starter design once product development begins.

The interface should feel like a real production application, not a tutorial project.

---

# 14. PROJECT ROADMAP

## MILESTONE 01 — FOUNDATION

Completed/in progress:

- GitHub repository
- Next.js foundation
- TypeScript
- Tailwind CSS
- PostgreSQL
- `e_result` database
- Prisma
- Prisma schema
- Initial migration
- Agent instruction files
- Application design system
- Application shell

---

## MILESTONE 02 — AUTHENTICATION & AUTHORIZATION

Build:

- Login
- Authentication
- Session management
- Role-based authorization
- Admin routing
- Principal routing
- Teacher routing
- Student routing

---

## MILESTONE 03 — SCHOOL ADMINISTRATION

Build:

- Academic sessions
- Terms
- Classes
- SS arms
- Subjects
- Teachers
- Students
- Teacher assignments
- Enrollment management

---

## MILESTONE 04 — RESULT MANAGEMENT

Build:

- CA entry
- Examination entry
- Automatic totals
- Grade calculation
- Student averages
- Subject averages
- Class averages
- Performance rate
- Positions
- Teacher remarks
- Result submission
- Result approval
- Result rejection
- Result publication
- Controlled Admin overrides

---

## MILESTONE 05 — STUDENT EXPERIENCE

Build:

- Student dashboard
- Result viewing
- Performance overview
- Published result history
- Result printing
- Result downloading
- Announcements

---

## MILESTONE 06 — PRINCIPAL & TEACHER TOOLS

Build:

- Principal dashboard
- Principal remarks
- Announcements
- Teacher dashboard
- Assigned classes
- Assigned subjects
- Result entry
- Result submission
- Take-home assignments

---

## MILESTONE 07 — ADMIN SETTINGS & HARDENING

Build:

- Grading scale management
- Advanced settings
- Audit logs
- Security review
- Input validation
- Error handling
- Accessibility improvements
- Responsive improvements

---

## MILESTONE 08 — TESTING & DEPLOYMENT

Complete:

- Functional testing
- Role/permission testing
- Database testing
- Result calculation testing
- Build testing
- Production configuration
- Deployment
- Documentation

---

# 15. IMPORTANT ARCHITECTURAL RULE

Do not make major architectural changes without first explaining:

1. Why the change is necessary.
2. What existing functionality it affects.
3. What alternatives were considered.
4. Why the proposed approach is better.

Do not replace the existing stack just because another technology is familiar.

---

# 16. REQUIREMENT DISCIPLINE

The project requirements agreed with the project owner take priority over assumptions.

If a request conflicts with an existing locked requirement:

- Identify the conflict.
- Explain it clearly.
- Ask for confirmation before changing the requirement.

Do not silently change the product into a different system.

---

# 17. CODE QUALITY

Prefer:

- Small components
- Reusable components
- Clear naming
- Strong TypeScript types
- Server-side validation
- Maintainable database queries
- Clear error states
- Loading states
- Empty states

Avoid:

- Huge monolithic components
- Repeated code
- Hard-coded business rules where configuration is required
- Unnecessary dependencies
- Temporary hacks presented as final architecture

---

# 18. VALIDATION

After making changes, run the relevant checks.

Depending on the change, use:

- TypeScript checks
- ESLint
- Prisma validation
- Prisma migration checks
- Next.js build
- Relevant tests

Do not claim a feature works without validating it when validation is reasonably possible.

---

# 19. GIT DISCIPLINE

Keep commits focused.

Use descriptive commit messages such as:

`feat: add authentication foundation`

`feat: add teacher result entry`

`fix: correct student performance calculation`

`refactor: improve result calculation service`

`chore: update Prisma schema`

Do not mix unrelated changes into one commit.

---

# 20. CURRENT DEVELOPMENT PRINCIPLE

Build the application in milestones.

Do not rush into creating every page at once.

The preferred sequence is:

Foundation
→ Design System
→ Application Shell
→ Authentication
→ Roles
→ Administration
→ Results
→ Student Experience
→ Teacher/Principal Tools
→ Settings
→ Testing
→ Deployment

Always preserve the project requirements while progressing through this sequence.
