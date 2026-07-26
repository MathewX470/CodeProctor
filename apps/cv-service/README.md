# CodeProctor_ Biometric & Behavioral Telemetry Service (`apps/cv-service`)

This Python-powered microservice drives the real-time **Computer Vision and Behavioral Proctoring Pipeline** for CodeProctor assessments. It monitors candidate session fairness through automated webcam metric extraction and client telemetry webhooks without invasive human proctor overhead.

---

## 🔬 Core Proctoring Capabilities

### 1. Computer Vision Biometrics (Webcam Stream Analysis)
Using lightweight OpenCV and visual classification pipelines, the CV service calculates real-time telemetry metrics saved into the `FaceMetric` database table:
- **Face Presence Detection**: Ensures exactly one candidate face remains visible in the camera viewfinder frame (`NO_FACE` and `MULTIPLE_FACES` alarms).
- **Gaze Deviation Tracking**: Estimates ocular gaze angle relative to the screen axis (`gazeDeviationDeg`). Continually looking off-screen triggers automated warning thresholds (`LOOKING_AWAY`).
- **Low-Latency Inference**: Designed to run efficiently on low-footprint background hardware or cloud inference microservices.

### 2. Behavioral Malpractice Webhooks
Coordinates with browser client event sensors to construct tamper-proof audit histories (`Violation` and `Snapshot` tables):
- **Tab Switching & Blur Detectors**: Flags whenever a candidate leaves the active assessment browser window (`TAB_SWITCH`).
- **Fullscreen Exit Guards**: Logs infractions if candidate terminates required full-screen kiosk execution mode (`FULLSCREEN_EXIT`).
- **Clipboard Auditing**: Detects bulk code pasting events (`PASTE`) exceeding human typing velocity limits.

### 3. Evidentiary Snapshots & Storage
Whenever an infraction severity threshold (`LOW`, `MEDIUM`, or `HIGH`) is violated, an encrypted visual frame is captured, stored as a record in the `File` database table, and linked directly to an explainable malpractice timeline for moderator review.

---

## 🛠️ Python Service Setup & Execution

### Prerequisites
- **Python 3.10+** (Ensure Python is accessible in your system PATH).
- **Virtual Environment Support** (Standard `venv` package).

### Installation & Run Instructions
```bash
# Navigate to computer vision service directory
cd apps/cv-service

# Create an isolated Python virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# (On macOS/Linux use: source venv/bin/activate)

# Install required Python computer vision and server libraries
pip install -r requirements.txt

# Start local proctoring telemetry server
python -m app.main
```
*(Note: Virtual environments (`venv/`), compiled Python bytecodes (`__pycache__/`, `*.pyc`), and `.env.python` files are explicitly excluded from Git history via root `.gitignore`.)*
