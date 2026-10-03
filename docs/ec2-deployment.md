# CodeProctor Complete Deployment Documentation

This document serves as the comprehensive guide for deploying the full CodeProctor stack. The architecture is split between a serverless frontend (Next.js on Vercel) and a stateful execution backend (Node.js Worker + Redis on AWS EC2).

---

## 1. Architecture Summary

- **Frontend (`apps/web`)**: Deployed to Vercel. Handles user interface, authentication, webcam proctoring, and pushing submissions to the queue.
- **Backend Worker (`worker`)**: Deployed to AWS EC2. Listens to the Redis queue, pulls submissions, and spins up isolated Docker containers to execute code.
- **Database**: Neon Serverless Postgres. Both Vercel and the EC2 worker connect to this database directly.
- **Message Broker**: Self-hosted Redis container running on the EC2 instance, secured with a strong password.

> **Note on Execution Sandboxing:**
> The worker utilizes a Docker-in-Docker (DinD) architecture. The worker container mounts the host's `/var/run/docker.sock` to spin up sibling containers (`runner-python`, `runner-node`, etc.). To avoid volume mounting issues across different host OSes, the worker uses `docker cp` to inject source code directly into the execution containers.

---

## 2. AWS EC2 Setup

### 2.1. Provisioning the Instance
1. Spin up an AWS EC2 instance (Ubuntu 22.04 LTS or Amazon Linux 2023).
2. **Instance Size:** At least `t3.medium` (4GB RAM) is recommended since running multiple concurrent Docker containers for code execution can be memory-intensive.
3. Allocate at least 20GB of EBS storage to store the various language runner Docker images.

### 2.2. Security Group Configuration
You must open the following ports in your EC2 Security Group:
- **Port 22 (TCP):** For SSH access.
- **Port 6379 (TCP):** For Redis. This allows the Next.js frontend on Vercel to push jobs to the queue. 
  - *Security Tip:* Since Vercel IP addresses are dynamic, you may need to leave this open to `0.0.0.0/0`. Because of this, it is **critical** that you use a very strong, randomly generated `REDIS_PASSWORD` in your environment variables.

### 2.3. Install Docker & Git
SSH into your instance and run:
```bash
# Update packages and install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose-v2 git -y

# Add your user to the docker group so you don't need 'sudo' for docker commands
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. Backend Deployment (EC2)

### 3.1. Clone and Configure
Clone the repository onto your EC2 instance:
```bash
git clone https://github.com/your-username/CodeProctor.git
cd CodeProctor
```

Create the root `.env` file for Docker Compose:
```bash
nano .env
```
Add the following variables:
```env
# Use the exact same connection string from your Next.js app
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-round-sound...aws.neon.tech/neondb?sslmode=require"

# Generate a strong, secure password for Redis
REDIS_PASSWORD="SomeSuperSecretPassword123!"

# The internal URL the worker uses to connect to the Redis container
REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379"
```

### 3.2. Build the Execution Sandboxes
The worker uses isolated Alpine-based Docker images to execute untrusted user code. You must build these images on the server before starting the worker.

```bash
docker compose --profile runners build
```
*Note: This command will pull base images (Node, Python, GCC, Java) and build local `runner-*` images.*

### 3.3. Build and Start the Worker
Next, build the custom worker image and start both the worker and Redis in the background:

```bash
docker compose build worker
docker compose up -d
```

### 3.4. Verification
Verify that both containers are running and healthy:
```bash
docker ps
```
You should see `codeproctor-worker-1` and `codeproctor-redis` running. You can check the worker logs to ensure it successfully connected to both Neon and Redis:
```bash
docker compose logs -f worker
```
You should see:
> `[DB Init] Prisma client initialized with Neon adapter.`  
> `[Redis] Connected to queue broker.`

---

## 4. Frontend Deployment (Vercel)

Deploy the `apps/web` directory to Vercel. 

In your Vercel Project Settings > Environment Variables, configure the following:

- `DATABASE_URL`: Your Neon Postgres connection string.
- `BETTER_AUTH_SECRET`: A securely generated random string.
- `BETTER_AUTH_URL`: `https://your-production-domain.com`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`: Your AWS S3 credentials for webcam snapshot evidence.
- **`REDIS_URL`**: `redis://:SomeSuperSecretPassword123!@<YOUR_EC2_PUBLIC_IP>:6379`
  *(Replace the password with the one you defined in your EC2 `.env` file, and replace the IP with your EC2 instance's public IPv4 address).*

---

## 5. Local Development & Testing

You can seamlessly test this entire architecture on your local machine using Docker Desktop.

### Step 1: Start the Local Backend
1. Ensure Docker Desktop is running.
2. In the root of the project, duplicate `.env.example` to `.env`.
3. Fill in your `DATABASE_URL`.
4. Run `docker compose --profile runners build`
5. Run `docker compose build worker`
6. Run `docker compose up -d`

### Step 2: Start the Local Frontend
1. Open a new terminal and navigate to `apps/web`.
2. Ensure `apps/web/.env` is configured.
3. Specifically, ensure `REDIS_URL` is pointed to your local Docker Redis container:
   `REDIS_URL="redis://:SomeSuperSecretPassword123!@localhost:6379"`
4. Run `npm install` and `npm run dev`.
5. Open `http://localhost:3000` and test code execution.

---

## 6. Troubleshooting

- **Worker crashes on boot with `node: .env: not found`**: 
  Ensure your `worker/Dockerfile` uses `CMD ["node", "src/index.js"]`. Docker injects environment variables natively, so the worker should not require a physical `.env` file inside the container.
- **Worker logs `Invalid URL` at `prisma.submission.findUnique()`**:
  Your `DATABASE_URL` in the root `.env` file is likely invalid or still set to the default placeholder. Update it and run `docker compose up -d` to recreate the worker container.
- **All submissions return `RUNTIME_ERROR` with empty actual output**:
  This happens if volume mounting fails. Ensure `worker/src/docker/index.js` is using `docker cp` to transfer code into the execution containers rather than relying on `-v` volume mounts, which break in Docker-in-Docker environments.
- **Worker logs `Failed to parse time: ENOENT`**:
  This is a harmless warning. The worker falls back to native Node.js `Date.now()` timing measurements because the lightweight Alpine execution containers do not have the GNU `time` package installed.
