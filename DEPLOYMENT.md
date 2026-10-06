# CodeProctor Hybrid Deployment Guide

This document outlines the steps to deploy CodeProctor using a hybrid architecture:
- **Frontend & API Routes:** Vercel
- **Worker, Redis & Execution Engine:** AWS EC2
- **Database:** Neon Serverless PostgreSQL

## Phase 1: Deploying the Backend on AWS EC2
This phase handles the Code Judge worker, Redis, and your Docker runners.

### 1. Launch an EC2 Instance
- Go to the AWS Console and launch a new **EC2 Instance**.
- **OS:** Select **Ubuntu 22.04 LTS** or **24.04 LTS**.
- **Instance Type:** Choose a `t3.large` (**8GB RAM**). While a 4GB `t3.medium` can work for testing, the **8GB** instance is highly recommended because you are running a Python Computer Vision service (`cv-service`), Redis, and spinning up multiple language containers (especially Java and Node.js) concurrently. 4GB will likely cause Out-Of-Memory (OOM) crashes under load.
- **Storage:** Allocate at least **30GB - 50GB** of EBS storage. Select **General purpose SSD (gp3)** as the volume type, as it offers better performance (3000 IOPS baseline) and is generally cheaper/better than gp2 while still being free-tier eligible. *(Docker images for runners will take up space)*.

### 2. Configure Security Groups (Firewall)
In the AWS console, update the security group attached to your instance:
- **SSH (Port 22):** Allow from your IP so you can log in.
- **Custom TCP (Port 6379):** Allow access to Redis from anywhere (or specifically Vercel's IPs if possible). 
  > [!WARNING]  
  > Since Vercel needs to talk to this to queue jobs, you must expose it. Ensure your `REDIS_PASSWORD` in your `.env` is extremely strong (e.g., a 32-character generated hex string).

### 3. Setup the Server
SSH into your new EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Install Docker and Docker Compose:
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
```
*(You may need to log out and log back in for the docker group to apply).*

Clone your repository onto the EC2 instance:
```bash
git clone https://github.com/YourUsername/CodeProctor.git
cd CodeProctor
```

Create the `.env` file on the server:
```bash
nano .env
```
Add your variables:
```env
DATABASE_URL="postgresql://..."
REDIS_PASSWORD="your_very_strong_password"
```

Run the backend:
```bash
docker-compose up -d --build
```
*(Note: This will build all your runner images like C, C++, Java, etc., and start the worker listening for jobs. It may take a few minutes).*

### 4. Get your Elastic IP
- In AWS, allocate an **Elastic IP** and attach it to your EC2 instance. This gives your server a static public IP address that won't change if the server restarts.

---

## Phase 2: DNS & Domain Setup (`samyuktha10.info`)
We need to map your domain to your infrastructure. Open the DNS management page where you purchased your domain.

### For the Backend (AWS):
- Create an **A Record**.
- **Name:** `worker` *(This creates `worker.samyuktha10.info`)*.
- **Value:** Paste your AWS Elastic IP here.

*Now, your Vercel frontend can connect to Redis using `redis://:YOUR_PASSWORD@worker.samyuktha10.info:6379`.*

---

## Phase 3: Deploying the Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) and link your GitHub repository.
2. Select the `apps/web` directory as your Root Directory if Vercel doesn't detect it automatically.
3. **Environment Variables:** Add the following to your Vercel project settings:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `REDIS_URL`: `redis://:YOUR_PASSWORD@worker.samyuktha10.info:6379` *(Use the password you set in EC2 and your new subdomain)*.
   - `BETTER_AUTH_SECRET`: A secure random 32-character hex string.
   - `BETTER_AUTH_URL`: `https://samyuktha10.info` *(Once your domain is linked)*.
4. Click **Deploy**. Vercel will build and host your Next.js application.
5. **Link Domain:** After it deploys, go to the project's **Settings -> Domains** in Vercel, add `samyuktha10.info`. Vercel will provide the exact DNS records (usually a CNAME or A record) to add to your domain provider to finalize the connection.
