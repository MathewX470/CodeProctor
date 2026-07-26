# CodeProctor_ ✳ // Zero-Trust Assessment & Proctoring Arena

![CodeProctor Banner](https://img.shields.io/badge/Status-Active_Development-00FF66?style=for-the-badge&labelColor=030303&logo=terminal&logoColor=00FF66)
![Next.js 16](https://img.shields.io/badge/Next.js_16-App_Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon_Serverless_PG-00E599?style=for-the-badge&logo=postgresql&logoColor=black)
![Prisma v7](https://img.shields.io/badge/ORM-Prisma_v7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Better Auth](https://img.shields.io/badge/Auth-Better__Auth-black?style=for-the-badge&border=00FF66)

**CodeProctor** is an enterprise-grade, zero-trust competitive programming arena and automated technical evaluation platform. It merges **sandboxed multi-language remote code execution**, **explainable algorithmic grading**, and **AI-driven biometric & behavioral proctoring** into a unified cyber-terminal interface.

---

## 🏛️ Monorepo Microservices Architecture

CodeProctor is architected as a decoupled microservice ecosystem designed for cloud scale and hardware isolation:

| Module / Path | Domain Architecture | Purpose & Responsibilities |
| :--- | :--- | :--- |
| **`apps/web`** | Frontend & Serverless API | Next.js 16 cyber-terminal UI, Better Auth authentication portal, problem banking, contest orchestration, and real-time candidate dashboard. |
| **`apps/worker`** | Sandboxed Execution Judge | BullMQ asynchronous code evaluation engine that consumes user code submissions, compiles/executes inside secure Docker language containers, and benchmarks against hidden test cases. |
| **`apps/cv-service`** | Biometric Telemetry Service | Python real-time computer vision pipeline monitoring candidate integrity via webcam facial metrics, gaze deviation tracking, tab switching, and clipboard violation logging. |
| **`packages/*`** | Shared Core Libraries | Internal utility modules (`shared-types`, `shared-utils`, `ui`) ensuring unified TypeScript models, validation schemas, and UI design tokens across services. |

---

## ⚡ Key Feature Foundations

### 🔐 1. Zero-Trust Authentication & RBAC Engine
- Built directly on **Better Auth** paired with **Neon Serverless PostgreSQL** via **Prisma v7**.
- Cryptographically sound SHA-256 password hashing, secure `HttpOnly` cookie session management, and interactive terminal portals (`/login`, `/signup`) with real-time validation and eye passphrase toggles.
- True per-contest Role-Based Access Control (**Owner**, **Moderator**, and **Participant**) mapped across normalized database joins.

### 🧪 2. Sandboxed Isolated Code Judge (Codeforces-Style Breakdown)
- Submissions are evaluated against multiple distinct weighted test cases with explicit time (`ms`) and memory (`KB`) benchmarks.
- Full breakdown logging per test case (`SubmissionTestCase`), execution lifecycle tracking (`ExecutionLog`), and queue isolation (`JudgeJob`).
- Supports language templating for modern Python 3.11, C++, Node.js, and Java.

### 👁️ 3. Explainable Telemetry & Malpractice Auditing
- Eliminates standard proctoring black boxes by generating tamper-proof timelines of candidate events.
- Tracks browser focus tab-switching (`TAB_SWITCH`), fullscreen exits (`FULLSCREEN_EXIT`), clipboard pasting (`PASTE`), and AI facial metric anomalies (`NO_FACE`, `MULTIPLE_FACES`, `LOOKING_AWAY`).
- Captures automated snapshots backed by encrypted cloud file storage (`Domain 9 — File`).

---

## 🛠️ Quick Start Setup & Initialization

### 1. Repository Clone & Dependencies
```bash
git clone https://github.com/YourUsername/CodeProctor.git
cd CodeProctor
npm install
```

### 2. Environment Variables (`apps/web/.env`)
Create a `.env` file inside `apps/web` with your cloud Postgres credentials:
```env
# Neon Serverless PostgreSQL Database Connection
DATABASE_URL="postgresql://<user>:<password>@<neon-hostname>/neondb?sslmode=require"

# Better Auth Secret (Generate via node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
BETTER_AUTH_SECRET="replace_with_your_32_char_hex_secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Database Sync & Client Generation (Prisma v7)
Navigate into the web application to synchronize tables with your Neon instance:
```bash
cd apps/web
npx prisma db push
npx prisma generate
```

### 4. Ignite Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the CodeProctor terminal experience.

---

## 🎨 Design System & Aesthetic Tokens
CodeProctor adheres to a strict **Cyber-Brutalist Terminal Design System**:
- **Background Palette**: Deep Carbon Dark Mode (`#030303` to `#0A0A0A`) with sharp `#1A1A1A` borders.
- **Accents & Highlights**: Electric Neon Green (`#00FF66` / `✳`) representing active monitoring and accepted test cases.
- **Typography**: Display headlines powered by **Cabinet Grotesk**, with technical code and interface metrics rendered in **JetBrains Mono**.
- **Kinetic Interactions**: Smooth scroll velocity via **Lenis**, Framer Motion entrance choreographies, interactive marquee tracking, and animated surveillance viewfinder logos.

---

## 📄 License & Documentation
This project is proprietary and built for next-generation automated code proctoring and assessment integrity. All rights reserved.
