# CodeProctor Development Plan

## Architecture

``` text
                    Browser
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   Practice        Contest        Admin Dashboard

                 Next.js (Vercel)
        ----------------------------------------
        UI
        API Routes
        Authentication
        Contest Logic
        Problem CRUD
        Prisma
        ----------------------------------------
                │          │
                │          │
         PostgreSQL      Redis
           (Neon)      (Upstash)
                │          │
                │          ▼
                │    Submission Queue
                │          │
                ▼          ▼
          Judge Service  Socket Server
        (Docker Workers) (Railway)
                │
                ▼
      FastAPI/OpenCV Service
```

## Tech Stack

-   **Frontend + APIs:** Next.js (Vercel)
-   **Database:** Neon PostgreSQL + Prisma
-   **Redis:** Upstash Redis
-   **Judge Service:** Railway initially, EC2 later if needed
-   **CV Detection Service:** Railway
-   **Socket.IO Server:** Railway

------------------------------------------------------------------------

# Development Roadmap

    Foundation
    ↓
    Authentication
    ↓
    Problem Bank
    ↓
    Contest Engine
    ↓
    Judge
    ↓
    Leaderboard
    ↓
    Browser Proctoring
    ↓
    CV Detection
    ↓
    Timeline
    ↓
    Admin

------------------------------------------------------------------------

# Phase 1 --- Foundation

Build the project skeleton.

-   Next.js
-   Tailwind
-   TypeScript
-   Prisma
-   Neon
-   Redis
-   Authentication
-   Folder Structure
-   Error Handling
-   Logging
-   Environment Configuration

Suggested structure:

``` text
app/
components/
features/
lib/
prisma/
services/
server/
hooks/
types/
utils/
```

------------------------------------------------------------------------

# Phase 2 --- Database Design

Design the schema before building pages.

## Core Tables

-   User
-   Contest
-   ContestParticipant
-   ContestProblem
-   Problem
-   TestCase
-   Submission
-   Leaderboard
-   Violation
-   Snapshot
-   Announcement

## Authentication

-   Account
-   Session
-   VerificationToken
-   PasswordReset

## Queue

-   ExecutionJob
-   ExecutionResult

------------------------------------------------------------------------

# Phase 3 --- Authentication

Complete authentication first.

Features:

-   Register
-   Login
-   Email Verification
-   Forgot Password
-   JWT
-   Refresh Tokens
-   Middleware
-   RBAC

------------------------------------------------------------------------

# Phase 4 --- Problem Bank

Flow:

``` text
Admin
 ↓
Create Problem
 ↓
Add Test Cases
 ↓
Publish
 ↓
Participant
 ↓
Browse
 ↓
Solve
 ↓
Submit
```

Features:

-   Markdown statements
-   Difficulty
-   Tags
-   Hidden Test Cases
-   Public Problems

------------------------------------------------------------------------

# Phase 5 --- Contest Engine

Flow:

``` text
Creator
 ↓
Create Contest
 ↓
Choose Proctoring Mode
 ↓
Add Problems
 ↓
Publish
 ↓
Participants Join
 ↓
Contest Starts
```

Contest settings:

-   Title
-   Description
-   Start Time
-   End Time
-   Duration
-   Password
-   Visibility
-   Languages
-   Proctoring Mode

------------------------------------------------------------------------

# Phase 6 --- Judge Service

Separate service.

    judge-service/
     ├── Worker
     ├── Docker
     ├── Queue
     └── Compiler

Flow:

``` text
Next.js
 ↓
Create Submission
 ↓
Redis Queue
 ↓
Worker
 ↓
Docker
 ↓
Judge
 ↓
Save Result
 ↓
Socket Update
```

------------------------------------------------------------------------

# Phase 7 --- Docker Worker

Flow:

``` text
Receive Job
 ↓
Create Temp Folder
 ↓
Write Source Code
 ↓
Run Docker
 ↓
Compile
 ↓
Execute
 ↓
Compare Output
 ↓
Return Verdict
 ↓
Destroy Container
```

Restrictions:

-   CPU Limit
-   Memory Limit
-   Timeout
-   Read-only Filesystem
-   No Network
-   Auto Cleanup

------------------------------------------------------------------------

# Phase 8 --- Live Leaderboard

Socket.IO events:

-   Contest Started
-   Submission Status
-   Leaderboard Updates
-   Contest Finished

Architecture:

``` text
Railway Socket Server
        │
 Redis Pub/Sub
        │
    Connected Clients
```

------------------------------------------------------------------------

# Phase 9 --- Browser Proctoring

Browser events:

-   Fullscreen Exit
-   Tab Switch
-   Window Blur
-   Copy
-   Paste
-   Right Click
-   Visibility Change

Every event becomes a **Violation Event**.

------------------------------------------------------------------------

# Phase 10 --- Computer Vision

Flow:

``` text
Browser
 ↓
Frame every 2–3 seconds
 ↓
FastAPI
 ↓
OpenCV
 ↓
Face Detection
 ↓
Return Event
```

Detections:

-   No Face
-   Multiple Faces
-   Looking Away

Store:

-   Timestamp
-   Contest
-   Participant
-   Event Type
-   Confidence
-   Snapshot URL

------------------------------------------------------------------------

# Phase 11 --- Malpractice Timeline

Instead of a cheating score, maintain:

``` text
09:13 Tab Switch
09:15 Fullscreen Exit
09:20 Face Missing
09:27 Multiple Faces
09:35 Looking Away
```

------------------------------------------------------------------------

# Phase 12 --- Admin Dashboard

-   Users
-   Problems
-   Contests
-   Submissions
-   Violations
-   Analytics
-   Announcements

------------------------------------------------------------------------

# Deployment

## Vercel

-   Next.js
-   Frontend
-   API Routes
-   Authentication
-   Contest APIs
-   Prisma

## Neon

-   PostgreSQL

## Upstash

-   Redis
-   Queue
-   Cache
-   Pub/Sub

## Railway

-   Socket.IO
-   FastAPI
-   Judge Worker (initial)

## EC2 (Later)

-   Judge Workers
-   Docker
-   Heavy Execution

------------------------------------------------------------------------

# Timeline

  Week   Goal
  ------ ----------------------------------------
  1      Foundation + Prisma + Authentication
  2      Problem Bank
  3      Contest Engine
  4      Judge Service + Docker
  5      Socket.IO + Live Leaderboard
  6      Browser Proctoring
  7      FastAPI + OpenCV
  8      Malpractice Timeline + Admin Dashboard
  9      Deployment + Testing + Documentation

------------------------------------------------------------------------

# Final Architecture

1.  **Next.js App (Vercel)** --- Frontend, Authentication, Contest APIs,
    Prisma
2.  **Judge Service (EC2/Railway)** --- Docker Execution + Redis Worker
3.  **CV Service (Railway)** --- FastAPI + OpenCV
4.  **Socket.IO Service (Railway)** --- Live Leaderboards & Proctoring
