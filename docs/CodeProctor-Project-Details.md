# CodeProctor — Online Coding Assessment & Malpractice Detection Platform

**MCA Final Year Capstone Project**

---

## 1. Overview

CodeProctor is a full-stack online coding assessment platform (similar to HackerRank) with an integrated malpractice/proctoring system. It supports public practice problems, user-created contests with configurable proctoring levels (normal, full-screen enforced, or webcam/CV-based monitoring), sandboxed code execution, real-time leaderboards, and a malpractice timeline for contest organizers to review.

---

## 2. Problem Statement

Existing online judges (HackerRank, LeetCode, etc.) offer coding assessments but lack transparent, reviewable proctoring — most anti-cheat logic is a black box. CodeProctor aims to build an assessment platform where:
- Anyone can host their own proctored coding contest, not just a central admin.
- Malpractice detection is explainable — organizers see a timestamped **timeline of events**, not just a pass/fail flag.
- Code execution is isolated and safe against abuse (infinite loops, resource exhaustion).

---

## 3. User Roles

### 3.1 Admin
- Creates **public problems** available to all registered users at any time (practice mode).
- Can view all submissions across the platform.
- Public problems have **no malpractice detection** — they are untimed practice, not graded contests.

### 3.2 Contest Creator (any registered user)
Any user can create a contest. When creating one, they configure:
- **Mode:** Normal / Full-screen enforced / CV-proctored (webcam + mic access required from participants)
- **Questions:** add new questions with test cases (input/output pairs, time & memory limits)
- **Visibility/access:** who can join
- Can view: **submissions, leaderboard, and per-user malpractice timeline**
- Can **disqualify** a participant based on timeline evidence
- If CV mode was OFF at contest creation, the timeline will simply have no CV-based events (only full-screen-exit events, if that was enabled)

### 3.3 Participant (regular user)
- Solves public problems (admin-created, ungraded, no proctoring)
- Joins contests created by other users
- Sees only the proctoring requirements enabled by that contest's creator, consents (mic/camera permission prompt) before entering
- Submits code, sees own rank on leaderboard

> Note: since any user can be both a participant and a contest creator, role checks are **per-contest**, not global — a single `users` table with contest-level ownership/participation records (not separate role tables).

---

## 4. Core Modules

| Module | Description |
|---|---|
| **Auth & RBAC** | JWT-based auth, roles resolved contextually (admin / contest owner / participant) |
| **Problem Bank** | CRUD for problems, test cases, constraints, difficulty tags |
| **Contest Engine** | Contest creation, scheduling (start/end time), question assignment, join/registration |
| **Judge (Code Execution)** | Sandboxed, resource-limited execution of submitted code against test cases |
| **Proctoring — Full-Screen** | Browser Fullscreen API + tab-switch/blur detection, logged as timeline events |
| **Proctoring — CV** | Webcam frame capture → face/gaze/multi-person detection → timeline events |
| **Leaderboard** | Real-time ranking per contest, score + time-based tiebreakers |
| **Malpractice Timeline** | Per-user, per-contest chronological log of all flagged events, viewable by contest creator |
| **Admin Dashboard** | Manage public problems, view platform-wide submissions |

---

## 5. Malpractice Detection — What Gets Logged

Define concrete, timestamped event types (avoid a black-box "cheating: true/false"):

**Full-screen / browser signals** (client-side, always available if full-screen mode enabled):
- Exited full-screen
- Tab switched / window lost focus (`visibilitychange`, `blur`)
- Copy-paste detected into the code editor (optional, easy add-on)

**CV signals** (only if CV mode enabled — separate Python/FastAPI/OpenCV microservice):
- No face detected for > N seconds
- Multiple faces detected in frame
- Face/gaze turned away from screen for > N seconds
- (Stretch) phone-like object detected

Each event is stored as:
```
{ user_id, contest_id, event_type, severity, timestamp, snapshot_ref (optional) }
```
This becomes the **timeline** the contest creator reviews before deciding to disqualify.

> Design note: capture webcam **frames at low frequency (e.g., 1 frame every 2–3 sec)** and POST as images, rather than streaming raw video — much lighter on bandwidth and simpler to build than a live video pipeline, and sufficient for periodic-check proctoring.

---

## 6. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | React | Code editor (Monaco), contest UI, admin/creator dashboards |
| Backend API | Express (Node.js) | Auth, contest/problem CRUD, submission handling |
| Database | PostgreSQL | Users, problems, contests, submissions, results |
| Cache/Queue | Redis | Session cache, leaderboard (sorted sets), submission job queue |
| Real-time | Socket.IO | Live leaderboard updates, live malpractice alerts to creator dashboard, submission status |
| CV Service | Python + FastAPI + OpenCV | Separate microservice; receives frame snapshots, returns detection events |
| Code Execution | Docker (worker-queue pattern) | Ephemeral, resource-limited containers per submission — **not Kubernetes for now** (see note below) |

**Note on Kubernetes:** Deliberately excluded from the core build to keep scope and demo-reliability manageable within capstone timelines. Docker + Redis-backed worker queue achieves the same isolation/resource-limiting goals at much lower setup cost. K8s can be mentioned in the report as the natural next step for horizontal scaling of the execution layer.

---

## 7. Code Execution Design (Judge)

1. User submits code → Express API pushes a job to a **Redis queue**.
2. A pool of **worker processes** pulls jobs, and for each:
   - Spins up a short-lived Docker container with:
     - `--memory` and `--cpus` limits
     - `--network none` (no internet access from inside)
     - Hard execution timeout (kill container if exceeded)
   - Runs submitted code against each test case's input, captures stdout/stderr/exit code
   - Compares actual vs expected output
3. Worker writes result back to Postgres, publishes result via Socket.IO so the frontend updates live.
4. Container is destroyed after execution — nothing persists between submissions.

---

## 8. Suggested Database Schema (high-level)

- `users` (id, name, email, password_hash, created_at)
- `problems` (id, title, description, difficulty, created_by, is_public)
- `test_cases` (id, problem_id, input, expected_output, is_hidden)
- `contests` (id, title, created_by, mode [normal/fullscreen/cv], start_time, end_time)
- `contest_questions` (contest_id, problem_id)
- `contest_participants` (contest_id, user_id, joined_at, disqualified boolean)
- `submissions` (id, user_id, problem_id, contest_id, code, language, verdict, score, submitted_at)
- `malpractice_events` (id, contest_id, user_id, event_type, severity, timestamp, snapshot_ref)

---

## 9. Suggested Team Split (adjust to your team size)

| Area | Owns |
|---|---|
| **Frontend** | React app: editor, contest UI, dashboards, leaderboard, permission prompts (camera/mic) |
| **Backend/API** | Express: auth, RBAC, contest/problem CRUD, Socket.IO events, Redis queue integration |
| **Judge/Execution** | Docker worker pool, sandboxing, test-case runner, result pipeline |
| **CV/Proctoring** | FastAPI + OpenCV service, event detection logic, integration with backend |
| **DB & DevOps** | Postgres schema, migrations, docker-compose setup, deployment |

(If it's a smaller team, merge Judge + DevOps, or Frontend + one backend area.)

---

## 10. Suggested Build Order (Milestones)

1. **Auth + basic CRUD** — users, problems, contests (no execution, no proctoring yet)
2. **Judge pipeline** — Docker worker queue running code against test cases, returning verdicts
3. **Contest flow** — join contest, timed submissions, basic leaderboard (Socket.IO)
4. **Full-screen proctoring** — client-side event capture + timeline storage/display
5. **CV proctoring** — FastAPI/OpenCV service, frame capture from client, event integration
6. **Admin dashboard + disqualification flow**
7. **Polish** — UI, edge cases, deployment, report/documentation

---

## 11. Stretch Goals (only if time permits)

- Copy-paste / right-click disable detection as an additional signal
- Plagiarism detection between submissions (e.g., Moss-style similarity check)
- Kubernetes deployment of the Docker execution layer for horizontal scaling
- Multiple language support in the judge (currently pick 1–2 languages to start, e.g., Python + C++/Java)
