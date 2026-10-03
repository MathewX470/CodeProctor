# CodeProctor EC2 Deployment Guide

This guide explains how to deploy the CodeProctor backend (Worker and Redis) to an AWS EC2 instance, while keeping the Next.js frontend hosted on Vercel.

## 1. Architecture Overview

- **Frontend (`apps/web`)**: Hosted on Vercel.
- **Backend (`worker`)**: Hosted on AWS EC2.
- **Database**: Serverless Postgres (Neon/Supabase) accessed by both.
- **Redis & Queues**: Self-hosted Docker container on the EC2 instance, secured with a password.

## 2. Setting Up the EC2 Instance

1. Spin up an AWS EC2 instance (Ubuntu or Amazon Linux).
2. Install **Docker** and **Docker Compose** on the instance.
3. SSH into your instance and clone this repository.
4. Open the EC2 Security Group settings and ensure you have an **Inbound Rule** that allows traffic on **TCP Port `6379`** (Redis). For maximum security, restrict the source IP to your Vercel deployment IP ranges or leave it open (`0.0.0.0/0`) *only* because we have a strict password set.

## 3. Environment Variables

Create a `.env` file in the root of the project on your EC2 instance (in the same folder as `docker-compose.yml`):

```env
DATABASE_URL="your_neon_postgres_url"
REDIS_PASSWORD="ChangeThisToASuperSecretPassword!"
REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379"
```

## 4. Building the Execution Sandbox (Language Runners)

The worker executes code submissions by spinning up isolated Docker containers for each language (C, C++, Java, Python, Node). Before starting the worker, you must build these base images on the EC2 instance.

Run the following command in the root folder:

```bash
docker compose --profile runners build
```

This will automatically pull the necessary dependencies from Docker Hub and build the `runner-*` images locally.

## 5. Starting the Backend

Once the images are built, you can start the Worker and the Redis server in detached mode:

```bash
docker compose up -d
```

This command will:
1. Start `redis:alpine` using the password you defined.
2. Start the `worker` service.
3. Ignore the language runners (since they are only meant to be spawned programmatically by the worker).

## 6. Configuring the Frontend (Vercel)

Finally, tell your Next.js app on Vercel how to connect to your new EC2 Redis instance instead of Upstash.

In your Vercel Project Dashboard, update the `REDIS_URL` environment variable:

- **Key**: `REDIS_URL`
- **Value**: `redis://:ChangeThisToASuperSecretPassword!@<YOUR_EC2_PUBLIC_IP>:6379`

*(Replace `<YOUR_EC2_PUBLIC_IP>` with the actual public IPv4 address of your AWS instance).*

## 7. Local Testing (Docker Desktop)

You can use this exact same setup to test locally using Docker Desktop on Windows or Mac.

1. Create the `.env` file as shown above.
2. Run `docker compose --profile runners build`.
3. Run `docker compose up -d`.
4. In your local `apps/web/.env` file, set your Next.js connection string to `redis://:ChangeThisToASuperSecretPassword!@localhost:6379`.
5. Run `npm run dev` in the web folder. The local app will successfully connect to your local Docker Redis instance!
