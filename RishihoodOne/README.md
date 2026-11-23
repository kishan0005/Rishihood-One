# Rishihood One — University Academic & Housing Portal

**Institution:** Rishihood University, Sonipat, Haryana  
**Architecture:** React + Node.js + Express + PostgreSQL + Prisma ORM  
**Design System:** Deep Navy (`#070D1E`, `#0B132B`, `#1C2541`), Crisp White, Subtle Indigo (`#4361EE`) & Azure Accents, Inter Typography, Responsive SaaS Layout.

---

## 🏛️ Executive Summary

**Rishihood One** is the enterprise academic and residential life platform for Rishihood University. It connects students, faculty, hostel wardens, and university administrators into an integrated operating portal.

Every core module connects directly to a live PostgreSQL database via Prisma ORM—supporting full end-to-end data persistence across academic cycles, room inventories, gate passes, maintenance tickets, and fee settlements.

---

## 🌟 Four Role-Based Dashboards

### 🎓 1. Student Dashboard (`student@rishihood.edu.in`)
- **Academic Standing:** Real-time CGPA (8.92), earned credits, and semester GPA transcripts.
- **Attendance Tracker:** Overall percentage meter (88%), regulatory minimum (75%) alert status, and detailed session history.
- **Master Timetable:** Weekly schedule matrix with room numbers (LH-102, Lab-301) and faculty.
- **Course Assignments:** Problem statements, submission portal (code repository / document URL + text), and faculty feedback.
- **Residential Suite:** Allocated room card (`Takshashila Hall - Room 204`), roommates directory, and warden contact.
- **Outing & Leave Passes:** Digital pass requests (Day Outing, Night Out, Home Visit) with departure/return times and parent emergency phone.
- **Campus Services:** Maintenance helpdesk tickets, fee invoice payment with instant receipt generation, 7-day dining hall menu, and 1-click event RSVPs.

### 👩‍🏫 2. Faculty Dashboard (`faculty@rishihood.edu.in`)
- **Assigned Courses:** B.Tech CSE modules (AI & Deep Learning, Cloud Architecture, Advanced Databases).
- **Session Attendance Marking:** Interactive student roster checklist (Present / Absent / Late) committed to the database.
- **Assignment Creator & Grader:** Problem publishing with due dates and submission review modal with score entry and pedagogical feedback.
- **Class Schedules:** Weekly classroom and lab allocations.

### 🛡️ 3. Warden Dashboard (`warden@rishihood.edu.in`)
- **Hostel Overview & Occupancy:** Takshashila Hall (Boys), Gargi Bhavan (Girls), and Nalanda Scholars Block.
- **Room Inventory Explorer:** Bed capacity, occupied vs. vacant slots, floor plans, air conditioning, and fee structures.
- **Leave Pass Authorization:** 1-Click biometric gate pass review (Approve / Reject with official gate remarks).
- **Maintenance Helpdesk Desk:** Dispatch technicians, escalate ticket priority (Low / Medium / High / Urgent), and log resolution notes.
- **Dining Menu Editor:** Update daily meal plans across Breakfast, Lunch, High Tea, and Dinner.

### ⚙️ 4. Admin Dashboard (`admin@rishihood.edu.in`)
- **Executive Analytics:** Active student enrollments, faculty count, campus bed occupancy, and fee collection rate (94%).
- **User Directory:** Filter by role, search by Roll/ID/Name, and provision new student, faculty, warden, or admin accounts.
- **Fee Operations:** Issue semester fee invoices and track payment collections.
- **Campus Broadcasting:** Push instant university-wide bulletins or role-targeted announcements.

---

## 🔑 Demo Credentials & Quick Switcher

For seamless review and demonstration, a **Quick Persona Switcher** is built into the top navigation bar. Click any badge to instantly switch context:

| Role | Demo Email | Password | Primary Identifier |
| :--- | :--- | :--- | :--- |
| **Student** | `student@rishihood.edu.in` | `Rishihood@123` | `RU2023CSE042` (Aarav Sharma) |
| **Faculty** | `faculty@rishihood.edu.in` | `Rishihood@123` | `FAC-CSE-004` (Dr. Ananya Roy) |
| **Warden** | `warden@rishihood.edu.in` | `Rishihood@123` | `WRD-TAK-001` (Col. Rajesh Verma) |
| **Admin** | `admin@rishihood.edu.in` | `Rishihood@123` | `ADM-RU-001` (Dean Vikram Malhotra) |

---

## ⚙️ Architecture & Tech Stack

```
rishihood-one/
├── client/                     # Frontend Application (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/common/  # Header, Sidebar, Badge, StatCard, Modal
│   │   ├── context/            # AuthContext (JWT session & persona quick-login)
│   │   ├── services/           # ApiService (REST client with Bearer auth)
│   │   ├── types/              # Domain TypeScript interfaces
│   │   └── views/              # Role dashboards, Academics, Housing, Complaints, Fees, Dining, Events, Admin
│   ├── tailwind.config.js      # Navy/Indigo/Azure institutional palette
│   └── vite.config.ts          # Vite proxy to backend API (Port 5173 -> 5001)
├── server/                     # Backend Application (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # 19 Relational Models + PostgreSQL Enums
│   │   └── seed.ts             # Rich university seed script
│   ├── src/
│   │   ├── config/             # Singleton Prisma Client
│   │   ├── middleware/         # JWT Authenticate, RBAC Authorize, Error Handler
│   │   ├── routes/             # Auth, Academic, Housing, Complaints, Fees, Dining, Events, Admin
│   │   └── index.ts            # Express server initialization
│   └── test-workflows.ts       # 28-point automated end-to-end workflow test suite
└── package.json                # Monorepo root orchestrator
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally on port `5432`)

### 2. Database Setup
```bash
# Ensure local database exists
createdb rishihood_one
```

### 3. Environment Variables (`server/.env`)
```ini
PORT=5001
DATABASE_URL="postgresql://<your-username>@localhost:5432/rishihood_one"
JWT_SECRET="rishihood-one-super-secret-jwt-key-2026"
NODE_ENV=development
```

### 4. Install Dependencies & Seed Database
```bash
# In project root:
npm install
npm --prefix server install
npm --prefix client install

# Push Prisma schema and seed database
cd server
npx prisma db push
npm run prisma:seed
cd ..
```

### 5. Run Integration Verification Test Suite
```bash
# Runs 28 automated core workflow checks against the live backend and database:
cd server
(npm run dev &) && sleep 3 && npx tsx test-workflows.ts && kill $(lsof -t -i:5001)
```

### 6. Start Full Application (Client + Server)
```bash
# From workspace root:
npm run dev
```
- **Web Portal:** [http://localhost:5173](http://localhost:5173)
- **REST Backend:** [http://localhost:5001/api](http://localhost:5001/api)
- **Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🧪 Verified Core Workflows (28/28 Passed)

1. ✅ **Multi-Persona Authentication:** Email/Password validation, JWT generation, and quick-login.
2. ✅ **Academics - Courses & Syllabus:** Enrolled syllabus inspection and faculty course rosters.
3. ✅ **Academics - Attendance Tracking:** Real-time percentage audits with regulatory 75% alerts.
4. ✅ **Academics - Live Session Attendance:** Faculty logs student attendance with timestamps and remarks.
5. ✅ **Academics - Weekly Timetable:** Day-wise classroom and lab scheduling.
6. ✅ **Academics - Assignments & Labs:** Problem publishing, student text/URL submission, and faculty grading.
7. ✅ **Academics - Transcripts & CGPA:** 10-point scale grade calculations and certified semester grade cards.
8. ✅ **Housing - Room Inventory & Vacancies:** Block-by-block bed allocation and vacancy auditing.
9. ✅ **Housing - Suite Allocation:** Roommate profiles, amenities list, and warden contact.
10. ✅ **Housing - Outing & Gate Passes:** Day outing / Night out requests with warden gate authorization.
11. ✅ **Maintenance & Ticketing:** Helpdesk ticketing lifecycle (Open -> In Progress -> Resolved).
12. ✅ **Fees & Accounts:** Semester tuition and hostel invoices, online payment simulation, and receipt download.
13. ✅ **Mess & Dining:** 7-day culinary schedule with meal times and vegetarian/Jain dietary tags.
14. ✅ **Campus Life & Events:** Symposiums and hackathons with 1-click RSVP status toggle.
15. ✅ **Admin Console:** User directory search, role provisioning, and campus broadcast alerts.

---

© 2025 Rishihood University, Sonipat • Developed for the Rishihood One Ecosystem.

