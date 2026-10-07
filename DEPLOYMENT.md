# CodeProctor Deployment Guide (No Custom Domain)

This document outlines the steps to deploy CodeProctor using:
- **Frontend & API Routes:** Vercel (using the default `.vercel.app` URL)
- **Worker, Redis & Execution Engine:** AWS EC2 (using a direct Elastic IP)
- **Database:** Neon Serverless PostgreSQL

## Phase 1: Running the Backend on AWS EC2
Since you have already launched your EC2 instance and cloned the repository, let's start the backend.

### 1. Ensure Docker is Installed
If you haven't already, install Docker and Docker Compose on your EC2 instance:
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
```
*(You may need to log out and log back in for the docker group to apply).*

### 2. Configure the Backend `.env`
Navigate to the cloned repository on your EC2 instance:
```bash
cd CodeProctor
nano .env
```
Add your variables:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-hostname>/neondb?sslmode=require"
REDIS_PASSWORD="your_very_strong_password"
```

### 3. Start the Services
Run the backend:
```bash
docker compose --profile runners build

docker compose up -d --build
```
*(This will build your runner images (C, C++, Java, Node, Python) and start the worker listening for jobs. It may take a few minutes).*

### 4. Configure Security Groups (Firewall)
In the AWS console, update the security group attached to your EC2 instance:
- **Custom TCP (Port 6379):** Allow access to Redis from `0.0.0.0/0` (Anywhere) so Vercel can connect to it and queue code evaluation jobs.
- **Ensure you have an Elastic IP** allocated and attached to your EC2 instance so the IP address never changes.

---

## Phase 2: Deploying the Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and link your GitHub repository.
2. In the "Configure Project" screen, configure the following settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/web`
   - **Build Command:** Override to `npx prisma generate && next build`
   - **Output Directory:** Leave as default (Vercel will auto-detect `.next`)
   - **Install Command:** Leave as default (`npm install`)
3. **Configure Environment Variables:** Add the following to your Vercel project settings (**Settings -> Environment Variables**):
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `REDIS_URL`: `redis://:YOUR_PASSWORD@<YOUR_EC2_ELASTIC_IP>:6379` *(Replace `<YOUR_EC2_ELASTIC_IP>` with your actual AWS Elastic IP).*
   - `BETTER_AUTH_SECRET`: Generate a secure secret using `openssl rand -base64 32`.
   - `BETTER_AUTH_URL`: Leave blank or set to `http://localhost:3000` initially (you will update this after the first deployment).
   - `AWS_REGION`: e.g., `us-east-1` (Used for webcam snapshots/uploads).
   - `AWS_ACCESS_KEY_ID`: Your AWS access key.
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret.
   - `AWS_S3_BUCKET_NAME`: The name of your S3 bucket for uploads.

4. Click **Deploy**. Vercel will build and host your Next.js application.

### Final Step: Update Auth URL
Once Vercel finishes deploying, it will generate a live URL for you (e.g., `https://codeproctor-myusername.vercel.app`).

1. Go back to your Vercel Project **Settings -> Environment Variables**.
2. Update the `BETTER_AUTH_URL` variable to be your exact Vercel deployment URL (e.g., `https://codeproctor-myusername.vercel.app`).
3. **Redeploy** the project (Go to Deployments tab -> click the three dots on the latest deployment -> Redeploy) so the new environment variable takes effect.

Your platform is now fully live! The Vercel frontend will securely queue jobs to your AWS Elastic IP!
