# Football Plus – Product Requirements Document (PRD)

## 1. Overview
**Product Name:** Football Plus (FP)
**Type:** Web Platform
**Target Users:** Youth Soccer Academy (Admins, Coaches, Volunteers)

Football Plus is a role‑based web platform designed to help youth soccer academies manage teams, players, attendance, and internal staff efficiently. The platform prioritizes simplicity, mobile usability, and clear role permissions.

---

## 2. Goals & Objectives
- Centralize team, player, and attendance management
- Provide clear role‑based access control
- Be fully mobile‑optimized for on‑field usage
- Enable simple analytics for attendance and player engagement

**Out of scope (v1):**
- Public sign‑ups
- Payments or subscriptions
- Parent / player logins

---

## 3. User Roles & Permissions

### 3.1 Roles
1. **Admin**
2. **Coach**
3. **Volunteer**

### 3.2 Permission Matrix (High Level)
| Feature | Admin | Coach | Volunteer |
|------|------|------|-----------|
| Manage Users | ✅ | ❌ | ❌ |
| Manage Players | ✅ | ✅ | ❌ |
| View Players | ✅ | ✅ | ✅ |
| Manage Teams | ✅ | ✅ | ❌ |
| View Teams | ✅ | ✅ | ✅ |
| Update Attendance & Points | ✅ | ✅ | ❌ |
| View Attendance | ✅ | ✅ | ✅ |

---

## 4. Authentication & Access

### 4.1 Authentication (Supabase Auth)
- Email + Password login
- Sign-up UI exists but **sign-ups disabled** (Admin-only user creation)
- Password reset via Supabase Auth

### 4.2 User Provisioning Flow
1. Admin creates user record (email + role)
2. Trigger Supabase invite / magic link
3. User sets password on first login

### 4.3 Authorization
- Role stored in `public.users.role`
- Role checked in:
  - Frontend route guards
  - Supabase RLS policies

---

### 4.1 Login
- Email + Password
- Sign‑up page exists but **sign‑ups disabled** (Admin‑only user creation)

### 4.2 User Management Rules
- Only **Admins** can add/edit/delete users
- Users belong to one role only (Admin / Coach / Volunteer)
- Users can update their own:
  - Profile photo
  - Contact number

---

## 5. Global UI & Tech Requirements

### 5.0 Tech Stack

**Frontend**
- Next.js (App Router)
- React
- shadcn/ui
- Tailwind CSS

**Backend / Platform**
- Supabase
  - Supabase Auth (Email + Password)
  - Supabase Postgres Database
  - Supabase Storage (profile photos)
  - Supabase Row Level Security (RLS)

**Deployment**
- Vercel
  - Preview deployments per branch
  - Environment variables for Supabase keys

**Auth & Security**
- Supabase Auth with role-based access
- Roles stored in public.users table
- RLS enforced for all tables

---

### 5.1 UI Framework
- **shadcn/ui**
- Fully responsive (mobile‑first)

### 5.2 Theme
- Primary color: **#E63328**
- Clean, modern, academy‑friendly aesthetic

### 5.3 Layout
- Left side navigation (collapsible on mobile)

**Side Menu Items:**
1. Dashboard (optional v1 placeholder)
2. FP Team
3. Players
4. Teams
5. Attendance

---

## 6. Feature Requirements

---

### 6.1 FP Team (Users Management)

**Access:** Admin only

#### Features
- View list of all users
- Add new user
- Edit existing user
- Delete user

#### User Fields
- Name
- Email
- Contact Number
- Role (Admin / Coach / Volunteer)

#### Notes
- Email must be unique
- Role selection via dropdown
- Profile photo upload available only in **My Profile** (not admin‑set)

---

### 6.2 Players

**Access:**
- Admin / Coach: Full access
- Volunteer: View only

#### Player Profile Fields
- First Name
- Last Name
- Profile Photo (Admin/Coach only)
- Date of Birth (DOB)
- Age (auto‑calculated from DOB)
- Soccer Position(s) (multi‑select)
- Assigned Team (dropdown from Teams)

#### Features
- Create / Edit / Delete player profiles (Admin/Coach)
- View player profiles (All roles)
- Search bar (name‑based)
- Filters:
  - Team
  - Age group
  - Position

---

### 6.3 Teams

**Access:**
- Admin / Coach: Create & Edit
- Volunteer: View only

#### Team Fields
- Team Name
- Main Coach (single user)
- Additional Coaches (multi‑select users)
- Volunteers (multi‑select users)
- Notes (free text)

#### Features
- Create / Edit team
- View team details
- Assign players indirectly via Player profile

---

### 6.4 Attendance & Points System

**Access:**
- Admin / Coach: Full access
- Volunteer: View only

#### Views
1. **Calendar View**
   - Monthly / Weekly toggle
   - Click date to view attendance

2. **List View**
   - Chronological list of sessions

#### Attendance & Points
- Admin/Coach can:
  - Assign points per player per date
  - Update points retroactively

**Example Points Logic (configurable later):**
- Attendance = +1
- Extra effort / performance = optional bonus

#### Analytics
- Player‑level total points
- Team‑level total points
- Filters:
  - Date range
  - Team
  - Player

---

## 7. Data Models (High Level)

> All tables stored in Supabase Postgres.
> Access control enforced using **Row Level Security (RLS)** based on user role.

### User (public.users)
- id (uuid, maps to auth.users.id)
- name
- email
- contactNumber
- role (admin | coach | volunteer)
- profileImageUrl
- createdAt

**RLS Rules**
- Admin: full access
- Coach / Volunteer: read own record only, update own profile fields

### Player (public.players)
- id (uuid)
- firstName
- lastName
- dob
- positions[]
- teamId
- profileImageUrl
- createdAt

**Derived Field**
- age (calculated in frontend from dob)

**RLS Rules**
- Admin / Coach: full CRUD
- Volunteer: read-only

### Team (public.teams)
- id (uuid)
- name
- mainCoachId
- coachIds[]
- volunteerIds[]
- notes
- createdAt

**RLS Rules**
- Admin / Coach: create & update
- Volunteer: read-only

### Attendance (public.attendance)
- id (uuid)
- date
- playerId
- teamId
- points (integer)
- updatedByUserId
- createdAt

**RLS Rules**
- Admin / Coach: create & update
- Volunteer: read-only

---

### User
- id
- name
- email
- contactNumber
- role
- profileImageUrl

### Player
- id
- firstName
- lastName
- dob
- age (derived)
- positions[]
- teamId
- profileImageUrl

### Team
- id
- name
- mainCoachId
- coachIds[]
- volunteerIds[]
- notes

### Attendance
- id
- date
- playerId
- teamId
- points
- updatedByUserId

---

## 8. Non‑Functional Requirements
- Mobile‑optimized for phone & tablet
- Role‑based access enforced at API & UI level
- Fast page loads (used during training sessions)
- Clean empty states for early usage

---

## 9. Future Considerations (Post‑v1)
- Parent / Player portal
- Export attendance & points
- Notifications (training reminders)
- Performance tags & notes
- Public academy website

---

## 10. Success Criteria
- Admin can fully manage academy from mobile
- Coaches can update attendance within seconds
- Volunteers have clear read‑only visibility
- Minimal onboarding required

