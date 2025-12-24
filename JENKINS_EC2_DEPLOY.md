# APNA-RIDE: Jenkins on EC2 with Docker Containers – End‑to‑End Guide

This guide sets up a Jenkins pipeline on EC2 that builds Docker images for the backend and frontend, pushes to Docker Hub, and deploys to the same (or another) EC2 host using docker compose.

Use the provided pipeline file: `Jenkinsfile.ec2`.

---

## 1) Architecture Options

- Jenkins on the same EC2 host as your containers
- Jenkins on a separate EC2 host (recommended). The pipeline connects over SSH to the target EC2 for deployment.

The supplied Jenkinsfile supports both. If Jenkins runs on the same host, set `SSH_HOST=localhost` and ensure Jenkins user has Docker permissions.

---

## 2) EC2 Preparation (target deploy host)

- Amazon Linux 2023 example

```bash
# Connect
ssh ec2-user@<EC2_PUBLIC_DNS_OR_IP>

# Install Docker
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# log out and back in, or prefix commands with sudo until then

# Install compose plugin (if missing)
sudo dnf install -y docker-compose-plugin

# Persistent MySQL data dir
sudo mkdir -p /opt/apnaride/mysql
sudo chown 999:999 /opt/apnaride/mysql
```

Open security group ports:
- 80 (HTTP) and 443 (HTTPS) inbound to the EC2 target
- 22 (SSH) from your Jenkins host only
- Do NOT open 3306 publicly

---

## 3) Jenkins Server Setup

- Install Jenkins on EC2 or any Linux host (LTS recommended)
- Install plugins:
  - Pipeline
  - SSH Agent
  - Credentials Binding
  - Email Extension (optional)
  - Docker and Docker Pipeline (optional but useful)

Grant Jenkins access to Docker (if Jenkins builds locally):

```bash
# On the Jenkins host
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

---

## 4) Create Required Jenkins Credentials

- Docker Hub credentials
  - Kind: Username with password
  - ID: `dockerhub-credentials`
  - Username: your Docker Hub username
  - Password: your Docker Hub access token/password

- SSH credential to EC2
  - Kind: SSH Username with private key
  - ID: `ec2-ssh`
  - Username: `ec2-user`
  - Private key: your `.pem` key (paste directly or from file)

If you prefer environment variables for DB secret, you can also create a Secret Text credential and inject it; otherwise set `DB_PASSWORD` in the job configuration.

---

## 5) Repository Files Used

- `Jenkinsfile.ec2` (pipeline for EC2 + Docker Compose)
- `docker-compose.prod.yml` (production services)
- `init.sql` (initial DB script, mounted by MySQL)
- `Back End/Dockerfile` (Spring Boot)
- `apnaride-frontend/Dockerfile` (Vite React + Nginx)

---

## 6) Configure the Pipeline Job in Jenkins

1. New Item → Pipeline
2. Pipeline from SCM → Git
   - Repo: `https://github.com/ShaikMohammedSameer3903/APNA-RIDE.git`
   - Branches to build: `*/main` (and any others you want)
3. Script Path: `Jenkinsfile.ec2`
4. Environment overrides (Pipeline Syntax → withEnv or Job parameters), set values for:
   - `SSH_HOST`: your EC2 public DNS or IP (or `localhost` if same host)
   - `DB_PASSWORD`: strong password for MySQL
   - Optionally `CORS_ORIGINS`: `http://<your-domain>,http://<ec2-ip>`
5. Save

---

## 7) What the Pipeline Does

- Checkout repo and set `IMAGE_TAG` to short git SHA
- Build images locally on Jenkins node
  - Backend: `apnaride/backend:${IMAGE_TAG}`
  - Frontend: `apnaride/frontend:${IMAGE_TAG}` (built with `/api` and `/ws`)
- Optional scan: `docker scan`
- Push to Docker Hub (on `main`/`master`)
  - Retags to `<DOCKER_USER>/apnaride-backend` and `<DOCKER_USER>/apnaride-frontend`
- Deploy to EC2 via SSH (on `main`/`master`)
  - Copies `docker-compose.prod.yml` and `init.sql`
  - Writes `.env` on EC2 with image refs and DB settings
  - Runs `docker compose pull` and `docker compose up -d`
- Health checks:
  - Backend: `http://localhost:9031/actuator/health`
  - Frontend: `http://localhost`

---

## 8) Environment Variables in Jenkinsfile.ec2

Update these if needed (either edit Jenkinsfile.ec2 or set at job level):

- `DOCKERHUB_CREDENTIALS_ID` (default: `dockerhub-credentials`)
- `SSH_CREDENTIALS_ID` (default: `ec2-ssh`)
- `SSH_USER` (default: `ec2-user`)
- `SSH_HOST` (must set to your EC2 host)
- `DB_PASSWORD` (must set)
- `CORS_ORIGINS` (include domain or public IP)

Images and registry:
- `DOCKER_REGISTRY` (default: `docker.io`)
- `BACKEND_IMAGE` (default: `apnaride/backend`) – used for local build and combined with registry/user on push
- `FRONTEND_IMAGE` (default: `apnaride/frontend`)

---

## 9) DNS and HTTPS

- For geolocation and production-grade security, use HTTPS
- Options:
  - AWS ALB + ACM cert → forward 443 → EC2:80
  - Terminate TLS on EC2 using Traefik/Caddy/Nginx
- After HTTPS, use `https://<your-domain>` for the app and update `CORS_ORIGINS`

---

## 10) Manual Run/Test

From Jenkins, run a build on `main`:
- Verify images pushed on Docker Hub
- On EC2, check containers and logs:

```bash
docker ps
docker logs -f apnaride-backend-prod
docker logs -f apnaride-frontend-prod
```

App URLs:
- Frontend: `http://<EC2_PUBLIC_IP>/`
- Backend health (on EC2):

```bash
curl -f http://localhost:9031/actuator/health
```

---

## 11) Roll Forward / Roll Back

- To deploy a new commit, rebuild on `main` to generate a new `IMAGE_TAG` and redeploy
- To roll back, run a previous successful build on `main`; the pipeline will redeploy that tag

---

## 12) Troubleshooting

- Permission denied for Docker: ensure Jenkins user is in `docker` group and restart Jenkins
- SSH auth failure: check `ec2-ssh` credential and host reachability
- Frontend cannot fetch API: ensure `frontend` is healthy and `backend` is reachable inside Docker network; CORS origins include public origin
- MySQL init errors: verify `/opt/apnaride/mysql` ownership (`999:999`) and that `DB_PASSWORD` matches

---

## 13) Optional: Webhook

- Set a GitHub webhook to your Jenkins URL: `/github-webhook/`
- Install GitHub Integration or use generic webhook + Multibranch if desired
