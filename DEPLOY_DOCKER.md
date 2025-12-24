# ApnaRide: Docker Hub and EC2 Deployment Guide

This guide shows how to build images, push to Docker Hub, and deploy on an EC2 instance using docker compose.

> Replace the placeholders before running commands:
> - <DOCKERHUB_USER>
> - <IMAGE_TAG> (e.g., v1)
> - <STRONG_DB_PASSWORD>
> - <YOUR_DOMAIN> (if you have one)

---

## 1) Prerequisites

- Docker installed locally and on EC2.
- docker compose plugin available (Docker Desktop includes it; on Linux, install docker-compose-plugin).
- EC2 security group allows inbound 80/443 (and optionally 9031 for direct backend testing). Do NOT open 3306 publicly.

---

## 2) Build and push images to Docker Hub

Login to Docker Hub:

```bash
docker login
```

Set variables:

```bash
export USER=<DOCKERHUB_USER>
export TAG=<IMAGE_TAG>
```

Build and push Backend:

```bash
# From the repository root
docker build -t $USER/apnaride-backend:$TAG "Back End"
docker push $USER/apnaride-backend:$TAG
```

Build and push Frontend (build with relative endpoints so it works behind Nginx proxy):

```bash
docker build \
  --build-arg VITE_API_BASE=/api \
  --build-arg VITE_WS_BASE=/ws \
  -t $USER/apnaride-frontend:$TAG apnaride-frontend

docker push $USER/apnaride-frontend:$TAG
```

Optional: verify images on Docker Hub via web UI.

---

## 3) Prepare EC2 instance

SSH into EC2:

```bash
ssh ec2-user@<your-ec2-public-ip>
```

Install Docker (Amazon Linux 2023 example):

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# log out and back in to apply group membership (or use sudo prefix temporarily)
```

Install compose plugin if missing:

```bash
# On Amazon Linux 2023 (if needed)
sudo dnf install -y docker-compose-plugin
```

Create persistent data folder for MySQL (first time only):

```bash
sudo mkdir -p /opt/apnaride/mysql
sudo chown 999:999 /opt/apnaride/mysql
```

Copy project files to EC2 (choose one):

Option A: Git clone the repo on EC2

```bash
git clone <your-repo-url>
cd APNA-RIDE   # adjust to your repo folder name
```

Option B: Secure copy only the compose and init files from local

```bash
scp docker-compose.prod.yml init.sql ec2-user@<ec2-ip>:/home/ec2-user/
ssh ec2-user@<ec2-ip>
```

---

## 4) Create .env next to docker-compose.prod.yml on EC2

Create a `.env` file with the following contents:

```env
DB_PASSWORD=<STRONG_DB_PASSWORD>
DB_NAME=apnaride
DB_USERNAME=root

DOCKER_REGISTRY=docker.io
BACKEND_IMAGE=<DOCKERHUB_USER>/apnaride-backend
FRONTEND_IMAGE=<DOCKERHUB_USER>/apnaride-frontend
IMAGE_TAG=<IMAGE_TAG>

# If you have a domain, list it here. Otherwise keep http://<ec2-ip>
CORS_ORIGINS=http://<YOUR_DOMAIN>,http://<your-ec2-public-ip>
```

Notes:
- DB_USERNAME uses `root` by default. If you want a different user, set DB_USERNAME accordingly and ensure the backend supports it.
- The frontend’s Nginx proxies `/api`, `/ws`, and `/nominatim` internally.

---

## 5) Start the stack on EC2

If the files are in your home directory:

```bash
# Pull images and start
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

If the files are in a cloned repo directory, run the same commands in that directory.

Check status and logs:

```bash
docker ps
docker logs -f apnaride-backend-prod
docker logs -f apnaride-frontend-prod
```

---

## 6) Test

- Frontend: http://<ec2-public-ip>/
- Backend health (from EC2 shell):

```bash
curl -f http://localhost:9031/actuator/health
```

- MySQL is internal; do not expose 3306 publicly. Data persists in `/opt/apnaride/mysql`.

---

## 7) HTTPS (Recommended for Geolocation)

Geolocation requires a secure origin (HTTPS) on public hosts. Options:

- Use an AWS Application Load Balancer with an ACM certificate to terminate TLS and forward HTTPS 443 → EC2:80.
- Or run a reverse proxy (Traefik/Caddy/Nginx) on EC2 to terminate TLS and proxy to the frontend container.

Once HTTPS is configured, access the app via https://<YOUR_DOMAIN> and allow location in the browser.

---

## 8) Useful operational commands

Update to a new tag:

```bash
export USER=<DOCKERHUB_USER>
export TAG=<NEW_TAG>
# On local machine
# Rebuild, retag, push

docker build -t $USER/apnaride-backend:$TAG "Back End"
docker push $USER/apnaride-backend:$TAG

docker build \
  --build-arg VITE_API_BASE=/api \
  --build-arg VITE_WS_BASE=/ws \
  -t $USER/apnaride-frontend:$TAG apnaride-frontend

docker push $USER/apnaride-frontend:$TAG

# On EC2, update .env IMAGE_TAG and pull/restart
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$TAG/" .env

docker compose -f docker-compose.prod.yml pull

docker compose -f docker-compose.prod.yml up -d
```

Stop and remove:

```bash
docker compose -f docker-compose.prod.yml down
```

Prune unused images (careful):

```bash
docker image prune -a
```

---

## 9) Local validation (optional before pushing)

From the project root on your local machine:

```bash
docker compose up -d --build
# Open http://localhost
# Backend health: http://localhost:9031/actuator/health
```

Notes:
- Frontend uses `/api` and `/ws` to communicate with backend via the Docker network.
- Nominatim calls must go through `/nominatim` to avoid CORS.
