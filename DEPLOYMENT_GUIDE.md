# 🚀 ApnaRide - Complete Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Jenkins CI/CD Setup](#jenkins-cicd-setup)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Docker** (v20.10+) & **Docker Compose** (v2.0+)
- **Java 17** (for local development)
- **Maven 3.9+** (for local development)
- **Node.js 20+** (for local development)
- **MySQL 8.0** (or use Docker container)
- **Jenkins** (v2.400+) for CI/CD

### Optional Tools
- **Git** (v2.30+)
- **kubectl** (for Kubernetes deployment)
- **AWS CLI** / **Azure CLI** / **GCP CLI** (for cloud deployment)

---

## ⚙️ Environment Configuration

### 1. Backend Environment Variables

Copy the example file and configure:
```bash
cd "Back End"
cp .env.example .env
```

Edit `.env` with your settings:
```properties
# Server Configuration
SERVER_PORT=9031

# Database Configuration
DB_HOST=mysql                    # Use 'localhost' for local, 'mysql' for Docker
DB_PORT=3306
DB_NAME=apnaride
DB_USERNAME=root
DB_PASSWORD=your_secure_password

# JPA Configuration
JPA_DDL_AUTO=update             # Use 'validate' in production
JPA_SHOW_SQL=false              # Set to false in production

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80

# Application Environment
SPRING_PROFILES_ACTIVE=prod

# Security (IMPORTANT: Change these!)
JWT_SECRET=your_jwt_secret_key_minimum_256_bits
JWT_EXPIRATION=86400000

# WebSocket Configuration
WEBSOCKET_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80
```

### 2. Frontend Environment Variables

```bash
cd apnaride-frontend
cp .env.example .env
```

Edit `.env`:
```properties
# API Configuration
VITE_API_BASE_URL=http://localhost:9031
VITE_WS_BASE_URL=ws://localhost:9031

# Application Configuration
VITE_APP_NAME=ApnaRide
VITE_APP_VERSION=1.0.0

# Map Configuration
VITE_MAP_DEFAULT_LAT=28.6139
VITE_MAP_DEFAULT_LNG=77.2090
VITE_MAP_DEFAULT_ZOOM=13

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Build and start all services:**
```bash
docker-compose up -d
```

2. **View logs:**
```bash
docker-compose logs -f
```

3. **Stop all services:**
```bash
docker-compose down
```

4. **Stop and remove volumes (clean slate):**
```bash
docker-compose down -v
```

### Individual Service Management

**Build specific service:**
```bash
docker-compose build backend
docker-compose build frontend
```

**Restart specific service:**
```bash
docker-compose restart backend
docker-compose restart frontend
```

**View service logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Manual Docker Build

**Backend:**
```bash
cd "Back End"
docker build -t apnaride/backend:latest .
docker run -p 9031:9031 --env-file .env apnaride/backend:latest
```

**Frontend:**
```bash
cd apnaride-frontend
docker build -t apnaride/frontend:latest .
docker run -p 80:80 apnaride/frontend:latest
```

### Health Checks

**Backend Health:**
```bash
curl http://localhost:9031/actuator/health
```

**Frontend Health:**
```bash
curl http://localhost:80
```

**Database Health:**
```bash
docker exec apnaride-mysql mysqladmin ping -h localhost
```

---

## 🔄 Jenkins CI/CD Setup

### 1. Jenkins Installation

**Using Docker:**
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

### 2. Required Jenkins Plugins

Install these plugins via Jenkins UI (Manage Jenkins → Plugins):
- Docker Pipeline
- Git Plugin
- Maven Integration
- NodeJS Plugin
- SonarQube Scanner (optional)
- Email Extension Plugin

### 3. Configure Jenkins Tools

**Manage Jenkins → Tools:**

**Maven:**
- Name: `Maven-3.9`
- Install automatically: Yes
- Version: 3.9.6

**NodeJS:**
- Name: `NodeJS-20`
- Install automatically: Yes
- Version: 20.x

**Docker:**
- Should be available if Docker is installed on Jenkins host

### 4. Configure Credentials

**Manage Jenkins → Credentials → Add Credentials:**

**Docker Hub:**
- Kind: Username with password
- ID: `dockerhub-credentials`
- Username: Your Docker Hub username
- Password: Your Docker Hub password/token

**Git (if private repo):**
- Kind: SSH Username with private key
- ID: `git-credentials`
- Username: git
- Private Key: Your SSH private key

### 5. Create Jenkins Pipeline

1. **New Item → Pipeline**
2. **Name:** `ApnaRide-Pipeline`
3. **Pipeline Definition:** Pipeline script from SCM
4. **SCM:** Git
5. **Repository URL:** Your Git repository URL
6. **Credentials:** Select your Git credentials
7. **Branch:** `*/main` (or your branch)
8. **Script Path:** `Jenkinsfile`
9. **Save**

### 6. Configure Webhooks (Optional)

**GitHub/GitLab Webhook:**
- URL: `http://your-jenkins-url:8080/github-webhook/`
- Events: Push events, Pull requests
- This triggers builds automatically on code push

### 7. Environment Variables in Jenkins

**Manage Jenkins → Configure System → Global Properties:**

Add environment variables:
- `DOCKER_REGISTRY`: `docker.io`
- `BACKEND_IMAGE`: `your-dockerhub-username/apnaride-backend`
- `FRONTEND_IMAGE`: `your-dockerhub-username/apnaride-frontend`

---

## 🌐 Production Deployment

### Option 1: Docker Compose (Single Server)

**Create production compose file:**
```bash
cp docker-compose.yml docker-compose.prod.yml
```

**Edit for production:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - /opt/apnaride/mysql:/var/lib/mysql
    networks:
      - apnaride-network

  backend:
    image: your-dockerhub-username/apnaride-backend:latest
    restart: always
    ports:
      - "9031:9031"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - JPA_SHOW_SQL=false
    depends_on:
      - mysql
    networks:
      - apnaride-network

  frontend:
    image: your-dockerhub-username/apnaride-frontend:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - apnaride-network

networks:
  apnaride-network:
    driver: bridge
```

**Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Kubernetes Deployment

**Create Kubernetes manifests:**

**namespace.yaml:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: apnaride
```

**mysql-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: apnaride
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        - name: MYSQL_DATABASE
          value: apnaride
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
```

**backend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: apnaride
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-dockerhub-username/apnaride-backend:latest
        env:
        - name: DB_HOST
          value: mysql
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        ports:
        - containerPort: 9031
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: 9031
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 9031
          initialDelaySeconds: 30
          periodSeconds: 5
```

**Deploy to Kubernetes:**
```bash
kubectl apply -f k8s/
kubectl get pods -n apnaride
kubectl get services -n apnaride
```

### Option 3: Cloud Deployment

**AWS (Elastic Beanstalk):**
```bash
eb init -p docker apnaride
eb create apnaride-prod
eb deploy
```

**Azure (Container Instances):**
```bash
az container create \
  --resource-group apnaride-rg \
  --name apnaride-backend \
  --image your-dockerhub-username/apnaride-backend:latest \
  --dns-name-label apnaride-backend \
  --ports 9031
```

**Google Cloud (Cloud Run):**
```bash
gcloud run deploy apnaride-backend \
  --image your-dockerhub-username/apnaride-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring

**Backend Actuator Endpoints:**
```bash
# Health check
curl http://localhost:9031/actuator/health

# Application info
curl http://localhost:9031/actuator/info

# Metrics
curl http://localhost:9031/actuator/metrics
```

### Log Management

**View Docker logs:**
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Export logs:**
```bash
docker-compose logs > apnaride-logs.txt
```

### Database Backup

**Manual backup:**
```bash
docker exec apnaride-mysql mysqldump -u root -p apnaride > backup.sql
```

**Automated backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/apnaride/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec apnaride-mysql mysqldump -u root -p${DB_PASSWORD} apnaride > ${BACKUP_DIR}/apnaride_${DATE}.sql
find ${BACKUP_DIR} -name "*.sql" -mtime +7 -delete
```

**Restore backup:**
```bash
docker exec -i apnaride-mysql mysql -u root -p apnaride < backup.sql
```

### Scaling

**Scale backend instances:**
```bash
docker-compose up -d --scale backend=3
```

**For Kubernetes:**
```bash
kubectl scale deployment backend --replicas=5 -n apnaride
```

### Updates & Rollback

**Update to new version:**
```bash
docker-compose pull
docker-compose up -d
```

**Rollback:**
```bash
docker-compose down
docker-compose up -d --force-recreate
```

---

## 🔍 Troubleshooting

### Common Issues

**1. Backend won't start - Database connection error**
```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Verify credentials in .env file
cat "Back End/.env"

# Test MySQL connection
docker exec -it apnaride-mysql mysql -u root -p
```

**2. Frontend can't connect to backend**
```bash
# Check backend is running
curl http://localhost:9031/actuator/health

# Verify CORS settings in application.properties
# Check frontend .env file has correct API URL
cat apnaride-frontend/.env
```

**3. Port already in use**
```bash
# Find process using port
netstat -ano | findstr :9031
netstat -ano | findstr :80

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

**4. Out of memory errors**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory

# Or add to docker-compose.yml:
services:
  backend:
    mem_limit: 2g
```

**5. Database data lost after restart**
```bash
# Ensure volumes are configured in docker-compose.yml
# Check volume exists
docker volume ls

# Inspect volume
docker volume inspect apnaride_mysql_data
```

**6. Jenkins build fails**
```bash
# Check Jenkins logs
docker logs jenkins

# Verify Maven/Node tools are configured
# Check Docker socket is mounted
docker exec jenkins docker ps
```

### Debug Commands

**Check container status:**
```bash
docker-compose ps
docker stats
```

**Enter container shell:**
```bash
docker exec -it apnaride-backend sh
docker exec -it apnaride-frontend sh
docker exec -it apnaride-mysql bash
```

**Network debugging:**
```bash
docker network ls
docker network inspect apnaride_apnaride-network
```

**Clean everything and restart:**
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 📝 Additional Resources

### Security Best Practices

1. **Change default passwords** in `.env` files
2. **Use secrets management** (Docker Secrets, Kubernetes Secrets, AWS Secrets Manager)
3. **Enable HTTPS** with SSL certificates (Let's Encrypt)
4. **Implement rate limiting** on APIs
5. **Regular security updates** for dependencies
6. **Database encryption** at rest and in transit
7. **Network isolation** using Docker networks
8. **Principle of least privilege** for user permissions

### Performance Optimization

1. **Enable database connection pooling** (already configured)
2. **Use Redis** for caching (optional)
3. **CDN** for static assets
4. **Load balancer** for multiple instances
5. **Database indexing** on frequently queried fields
6. **Gzip compression** (enabled in nginx.conf)

### Monitoring Tools (Optional)

- **Prometheus + Grafana** for metrics
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for logs
- **New Relic / Datadog** for APM
- **Sentry** for error tracking

---

## 🎉 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] JWT secret changed from default
- [ ] CORS origins configured correctly
- [ ] SSL certificates installed (production)
- [ ] Firewall rules configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this guide
- Check application health: `http://localhost:9031/actuator/health`
- Contact DevOps team

**Built with ❤️ for production deployment**
